---
project: AncestorTree
path: docs/02-design/ADR/ADR-001-sqlite-adapter.md
type: architecture-decision-record
version: 1.0.0
updated: 2026-02-26
status: accepted
---

# ADR-001: SQLite Adapter Pattern — sql.js with DbAdapter Interface

**Date:** 2026-02-26  
**Status:** Accepted  
**Context:** Sprint 9 — Standalone Desktop App

---

## Context

The desktop app needs a local database that works offline with zero installation requirements for end users. We evaluated two SQLite bindings:

| Option | Pros | Cons |
|--------|------|------|
| **sql.js** | Pure WASM, zero native compilation, works on all platforms including Apple Silicon | In-memory only (must flush to disk manually), ~1.2MB WASM bundle |
| **better-sqlite3** | Fastest SQLite binding, synchronous API, auto-persists | Native Node.js addon — requires `electron-rebuild` per platform, known failures on Windows ARM and Apple Silicon |

With a target audience of family members (non-technical) on varied hardware including M-series Macs, native addon compilation is a critical risk.

---

## Decision

**Primary: sql.js** — SQLite compiled to WebAssembly.  
**Interface: `DbAdapter`** — an abstraction layer wrapping the active SQLite implementation.

```typescript
// frontend/src/app/api/desktop-db/type-coerce.ts

export interface DbAdapter {
  exec(sql: string): QueryExecResult[];
  run(sql: string, params?: BindParams): RunResult;
  prepare(sql: string): Statement;
  export(): Uint8Array;
  close(): void;
}
```

The `getDatabase()` singleton in `sqlite-db.ts` returns a `DbAdapter`-compatible object. All query-builder code uses this interface, never the raw `sql.js` Database type directly.

---

## Consequences

### Positive
- **Zero native deps**: Works on macOS ARM, macOS Intel, Windows x64, Linux x64 out of the box
- **Single installer**: No user-visible compilation step, no `electron-rebuild` in CI
- **Swappable**: If performance becomes a concern (e.g., 50MB+ DB, batch imports), replace `getDatabase()` to return a `better-sqlite3` wrapper implementing `DbAdapter` — zero changes to query-builder, route, or data layer
- **Phase 2 test contract**: Integration tests assert against `DbAdapter`, meaning mock implementations are trivial

### Negative
- **Manual persistence**: `flushToDisk()` must be called after every mutating query. Omission = data loss on crash. Mitigated by: (a) atomic write via `.tmp` rename, (b) integration test assertion that flush is called
- **Memory usage**: sql.js loads the entire `.db` file into WASM heap. For expected dataset (< 5MB for 500–5,000 people records), this is fine. Media is stored on filesystem, not in DB
- **WASM load time**: ~200ms on cold start. Acceptable; spinner during first API call

### Neutral
- Performance within 2× of better-sqlite3 for < 10MB databases with low write frequency (family tree CRUD patterns)

---

## Rejected Alternatives

- **better-sqlite3**: Rejected due to native addon fragility on ARM platforms
- **Node.js `fs` + JSON files**: Rejected — no SQL query capabilities, no transactions
- **IndexedDB (PWA)**: Rejected — no SQL, browser can evict data, family data too important to risk

---

## Future Upgrade Path

If sql.js becomes a bottleneck:
1. Add `better-sqlite3` to `desktop/package.json`
2. Create `BetterSqliteAdapter` implementing `DbAdapter`
3. Change `getDatabase()` return type from sql.js Database → BetterSqliteAdapter
4. Remove `flushToDisk()` calls (better-sqlite3 is always-persistent)
5. Zero changes to query-builder.ts, route.ts, or any data layer

This upgrade is a 1-file change.
