---
project: AncestorTree
path: docs/05-test/TEST-PLAN-sprint9.md
type: test-plan
version: 1.0.0
updated: 2026-02-26
owner: tester
status: approved
---

# Test Plan: Sprint 9 — Standalone Desktop App

## Scope
- **Sprint**: Sprint 9 (v2.0.0)
- **Implementation PRs**: Commits 5f495f9, 3d830e0, 43f051a, dce31c7, 8919277
- **Acceptance Criteria**: Sprint 9 gate in `docs/04-build/SPRINT-PLAN.md`
- **Tester**: @tester (SE4A QA)

## Test Strategy

| Layer | Responsible | Coverage Target | Status |
|-------|-------------|-----------------|--------|
| Unit (type-coerce) | tester | 100% exported functions | ✅ Done |
| Integration (query-builder / rpc) | tester | All CRUD methods + edge cases | ✅ Done |
| Manual E2E (installer / first-run) | tester | Critical path AC | ⏳ Pending 3.6 |
| Build smoke | tester | `pnpm build` passes | ✅ Pass |

## Test Coverage Matrix

| Requirement | Test File | Cases | Status |
|-------------|-----------|-------|--------|
| Type coercion (bool ↔ 0/1) | type-coerce.test.ts | TC-001 → TC-007 | ✅ 20/20 |
| Type coercion (JSONB ↔ TEXT) | type-coerce.test.ts | TC-008 → TC-012 | ✅ |
| SELECT filters (eq, in, is, ilike, or, not) | query-builder.integration.test.ts | TC-QB-001 → TC-QB-015 | ✅ 15/15 |
| INSERT (UUID gen, batch, unique violation) | query-builder.integration.test.ts | TC-QB-020 → TC-QB-025 | ✅ 6/6 |
| UPDATE (coercion, updated_at auto) | query-builder.integration.test.ts | TC-QB-030 → TC-QB-032 | ✅ 3/3 |
| DELETE | query-builder.integration.test.ts | TC-QB-040 → TC-QB-041 | ✅ 2/2 |
| OR filter (families) | query-builder.integration.test.ts | TC-QB-050 → TC-QB-051 | ✅ 2/2 |
| Multi-table CRUD (events, achievements, fund, articles) | query-builder.integration.test.ts | TC-QB-060 → TC-QB-063 | ✅ 5/5 |
| is_person_in_subtree RPC (DFS) | rpc-handlers.integration.test.ts | TC-RPC-001 → TC-RPC-009 | ✅ 9/9 |
| Unknown RPC error | rpc-handlers.integration.test.ts | TC-RPC-020 | ✅ 1/1 |

**Total automated tests: 63 passing / 63**

## Automated Test Execution

```bash
cd frontend
pnpm test              # run once
pnpm test:watch        # watch mode
pnpm test:coverage     # with coverage report
```

### Results (2026-02-26)

```
 ✓ type-coerce.test.ts               (20 tests)  2ms
 ✓ rpc-handlers.integration.test.ts  (10 tests) 67ms
 ✓ query-builder.integration.test.ts (33 tests) 111ms

 Test Files  3 passed (3)
 Tests       63 passed (63)
 Duration    308ms
```

## Known Limitations (Documented)

| # | Limitation | Severity | Mitigation |
|---|-----------|----------|------------|
| L-001 | SQLite LIKE only ASCII case-insensitive; Vietnamese diacritics not lowercased | P3 | Use exact-case search for Vietnamese, or add ICU extension (future) |
| L-002 | Desktop = single-user admin; no RBAC | By Design | Documented in ADR-001 |
| L-003 | sql.js is in-memory; power loss between writes could lose data | P2 | `flushToDisk()` called after every write + `.bak` backup before migration |

## Manual Test Cases (Pending — Phase 3.6 Gate)

### TC-E2E-001: First install on clean macOS
- **Requirement**: AC "Double-click installer installs and opens app"
- **Preconditions**: Clean macOS machine, no Node.js / Docker
- **Steps**:
  1. Download `.dmg` from GitHub Releases
  2. Open `.dmg`, drag to Applications
  3. Double-click `AncestorTree.app`
- **Expected**: App opens, shows first-run wizard
- **Status**: ⏳ PENDING (requires GitHub Release build)

### TC-E2E-002: First-run wizard
- **Requirement**: AC "First-run wizard: nhập tên dòng họ + admin → app immediately usable"
- **Steps**:
  1. App opens → /setup page appears
  2. Click "Bắt đầu mới"
  3. Navigate to /tree
- **Expected**: Tree page loads, no errors
- **Status**: ⏳ PENDING

### TC-E2E-003: First-run wizard with backup import
- **Steps**:
  1. App opens → /setup appears
  2. Click "Nhập từ file backup"
  3. Select valid `.zip` export file
  4. Wait for import
  5. Navigate to /tree
- **Expected**: Imported data appears in tree
- **Status**: ⏳ PENDING

### TC-E2E-004: Offline CRUD operations
- **Requirement**: AC "Tất cả 13 routes hoạt động offline"
- **Steps**:
  1. Disconnect internet
  2. Create a new person
  3. Edit, save
  4. Restart app
  5. Verify data persists
- **Expected**: Full CRUD works without internet; data persists across restart
- **Status**: ⏳ PENDING

### TC-E2E-005: ZIP export → web import round-trip
- **Requirement**: AC "Export ZIP → Import vào web instance (data + media intact)"
- **Steps**:
  1. Admin → Xuất / Nhập dữ liệu → Export (include_media: inline)
  2. Download `.zip`
  3. Open web version, Admin → Import
  4. Upload `.zip`
  5. Verify row counts match
- **Expected**: Zero data loss
- **Status**: ⏳ PENDING

### TC-E2E-006: Auto-update flow
- **Requirement**: AC (Phase 4.1)
- **Steps**:
  1. Install old version
  2. Push new tagged release
  3. Open app, wait 10s
- **Expected**: Update prompt appears, install, restart to new version
- **Status**: ⏳ PENDING (requires v2.0.0 → v2.0.1 release)

## Bug Reports

*No open bugs.*

## Gate Evidence for G3 (Ship Ready)

| Evidence | Status |
|---------|--------|
| Automated tests: 63/63 pass | ✅ |
| Build (`pnpm build`) passes | ✅ |
| No P1/P2 open bugs | ✅ |
| Phase 3 implementation complete | ✅ |
| Manual E2E tests | ⏳ Pending Phase 3.6 + tag v2.0.0 |

**G3 Gate Recommendation:** ⏳ Conditionally Ready — automated tests complete, manual E2E pending release binary.

*Tester: @SE4A-QA | SDLC Stage 05 | 2026-02-26*
