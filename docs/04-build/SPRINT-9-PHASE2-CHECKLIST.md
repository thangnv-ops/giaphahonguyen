---
project: AncestorTree
path: docs/04-build/SPRINT-9-PHASE2-CHECKLIST.md
type: implementation-checklist
version: 1.0.0
updated: 2026-02-26
owner: architect
status: approved
---

# Sprint 9 — Phase 2 Checklist (SQLite Shim Core)

CTO v4 observations and Phase 2 prerequisites, consolidated from plan review.

## Must-Resolve (from CTO v4)

- [x] **Obs 1**: `createServerClient` naming collision → renamed to `createServiceRoleClient()`
- [x] **Obs 4**: `/api/media/[...path]` web-mode guard → `guardDesktopOnly()` implemented
- [ ] **Obs 2**: `profiles` admin row race — Auth shim returns mock profile; setup wizard inserts real row
- [ ] **Obs 3**: `profiles` UUID remapping on import — skip `profiles` table, use `DESKTOP_USER_ID`

## Clarifications (handle during Phase 2)

- [ ] **Obs 5**: Migration files → single location: `desktop/migrations/`
- [ ] **Obs 6**: Mock UUID constant → `DESKTOP_USER_ID = '00000000-0000-0000-0000-000000000001'`
- [ ] **Obs 7**: `.rpc('is_person_in_subtree')` → shim handler needed (called in `supabase-data.ts`)
- [ ] **Obs 8**: sql.js WASM in standalone → verified Phase 1.7, `outputFileTracingIncludes` configured

## Phase 2 Implementation Tasks

### 2.1 Auth Shim (`src/lib/supabase-desktop-auth.ts`)
- [ ] Mock `getUser()` → returns admin user with `DESKTOP_USER_ID`
- [ ] Mock `getSession()` → returns fake session
- [ ] Mock `signInWithPassword()`, `signOut()`, `signUp()` → no-op
- [ ] Mock `onAuthStateChange()` → fire callback with `setTimeout(cb, 0)`
- [ ] Mock 8 auth methods total (see plan inventory)

### 2.2 Storage Shim (`src/lib/supabase-desktop-storage.ts`)
- [ ] `getPublicUrl()` → returns `/api/media/{path}`
- [ ] `upload()` → POST to `/api/media/{path}`
- [ ] `remove()` → DELETE to `/api/media/{path}`

### 2.3 Desktop DB Route (6 files per ADR-002)
- [ ] `src/app/api/desktop-db/route.ts` — main entry, parses request
- [ ] `src/app/api/desktop-db/sqlite-db.ts` — singleton `getDatabase()` + `flushToDisk()`
- [ ] `src/app/api/desktop-db/query-builder.ts` — translates Supabase DSL to SQL
- [ ] `src/app/api/desktop-db/type-coerce.ts` — Boolean 0/1 ↔ true/false, JSONB ↔ TEXT
- [ ] `src/app/api/desktop-db/error-mapper.ts` — maps SQLite errors to Supabase error shapes
- [ ] `src/app/api/desktop-db/rpc-handlers.ts` — `is_person_in_subtree` DFS

### 2.4 SQLite Migration (`desktop/migrations/`)
- [ ] `001-initial-schema.sql` — 13 tables matching Supabase schema
- [ ] `_migrations` tracking table
- [ ] `DESKTOP_USER_ID` admin profile row

### 2.5 Supabase Client Shim (`src/lib/supabase-desktop.ts`)
- [ ] `SQLiteSupabaseClient` class mimicking Supabase JS API
- [ ] 17 query operators: `.from()`, `.select()`, `.insert()`, `.update()`, `.delete()`, `.eq()`, `.in()`, `.ilike()`, `.is()`, `.or()`, `.not()`, `.order()`, `.limit()`, `.single()`, `.maybeSingle()`, `.rpc()`
- [ ] Conditional export: desktop shim vs real Supabase based on `NEXT_PUBLIC_DESKTOP_MODE`

### 2.6 Integration Tests
- [ ] All 79 data layer functions pass against SQLite shim
- [ ] Vietnamese ILIKE search works
- [ ] `is_person_in_subtree` RPC works
- [ ] Boolean coercion correct
- [ ] JSONB round-trip correct

## Edge Cases to Handle

1. Boolean 0/1 ↔ true/false (SQLite uses INTEGER)
2. JSONB → TEXT (`contributions.changes` needs JSON.stringify/parse)
3. `.or('father_id.eq.X,mother_id.eq.X')` DSL parsing
4. `.not('rotation_index', 'is', null)` → `IS NOT NULL`
5. Error shape: `error.code === 'PGRST116'` for `.single()` row not found
6. Vietnamese ILIKE: use `LOWER()` wrapper for Unicode
7. `privacy_level` default = 1 (from security hardening migration)
8. Profiles table needs 1 admin row for AuthProvider

## Verification Gates

- [ ] All 13 pages render without errors in desktop mode
- [ ] CRUD operations work on all 13 tables
- [ ] Tree visualization renders correctly
- [ ] Cầu đường rotation algorithm works
- [ ] Export produces valid ZIP with manifest
- [ ] Import restores data correctly
