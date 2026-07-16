---
project: AncestorTree
path: docs/02-design/ADR/ADR-002-desktop-db-decomposition.md
type: architecture-decision-record
version: 1.0.0
updated: 2026-02-26
owner: architect
status: approved
---

# ADR-002: Desktop DB Route Decomposition

## Status

Approved (CTO review v3, 2026-02-26)

## Context

Desktop app cần API route để translate Supabase query builder calls thành SQL cho SQLite. Route này handle 17 operators, type coercion (Boolean, JSONB, UUID), error shapes (PGRST116), và RPC calls. Ước tính ~600 lines — quá lớn cho single file.

## Decision

Tách thành 6 files trong `frontend/src/app/api/desktop-db/`:

| File | Lines | Responsibility |
|------|-------|---------------|
| `route.ts` | ~80 | HTTP handler + dispatch |
| `query-builder.ts` | ~200 | 17 operators → parameterized SQL |
| `type-coerce.ts` | ~80 | Boolean 0/1, JSONB, UUID gen, timestamp gen |
| `error-mapper.ts` | ~40 | PGRST116 error shapes, `.single()` assertion |
| `rpc-handlers.ts` | ~100 | `is_person_in_subtree` recursive CTE |
| `sqlite-db.ts` | ~80 | Singleton `getDatabase()` + `flushToDisk()` |

## Rationale

- Mỗi file testable independently
- Bug trong `query-builder.ts` không ảnh hưởng `type-coerce.ts`
- Easier code review — mỗi PR chỉ touch 1-2 files
- `sqlite-db.ts` tách riêng để mock trong tests

## Consequences

- 6 files thay vì 1 → nhưng tổng lines tương đương
- Import chain: `route.ts` → `query-builder.ts` → `type-coerce.ts` + `error-mapper.ts`
- `sqlite-db.ts` shared across route.ts và rpc-handlers.ts
