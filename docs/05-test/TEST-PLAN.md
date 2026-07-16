---
project: AncestorTree
path: docs/05-test/TEST-PLAN.md
type: test
version: 1.0.0
updated: 2026-02-24
owner: "@tester"
status: draft
---

# Test Plan

## Overview

This document outlines the testing strategy for AncestorTree.

## Test Categories

### 1. Unit Tests
- Component rendering
- Utility functions
- Form validation

### 2. Integration Tests  
- API integration with Supabase
- Authentication flow
- Data fetching

### 3. E2E Tests
- User registration/login
- Tree navigation
- Member CRUD operations

## Test Checklist

### Frontend
- [ ] Build passes (`pnpm build`)
- [ ] Dev server runs (`pnpm dev`)
- [ ] All pages render (/, /login, /register, /tree, /people)
- [ ] Sidebar navigation works
- [ ] Mobile responsive
- [ ] Form validation

### Authentication
- [ ] Registration form
- [ ] Login form
- [ ] Session persistence
- [ ] Protected routes

### Tree View (Sprint 2)
- [ ] Tree rendering
- [ ] Node interaction
- [ ] Zoom/pan controls

## Tools

- **Framework:** Vitest
- **E2E:** Playwright
- **Coverage:** V8

## 5. Desktop App Tests (Sprint 9)

End-to-end tests for the Electron desktop application with offline SQLite backend.

### 5.1 Electron Shell

| # | Test Case | Expected Result | Status |
| --- | --------- | --------------- | ------ |
| 5.1.1 | App launches without errors | Main window opens, no crash | - [ ] |
| 5.1.2 | Window is visible and correct size | `BrowserWindow.isVisible()` returns true, default dimensions applied | - [ ] |
| 5.1.3 | Loading screen displays | Splash/loading screen shown before main content renders | - [ ] |
| 5.1.4 | App title is correct | Window title matches "AncestorTree" / "Gia Phả Điện Tử" | - [ ] |
| 5.1.5 | App closes cleanly | No orphan processes after window close | - [ ] |

### 5.2 SQLite Database

| # | Test Case | Expected Result | Status |
| --- | --------- | --------------- | ------ |
| 5.2.1 | Migrations applied on first launch | All migration files run in order, `schema_version` updated | - [ ] |
| 5.2.2 | All 13 tables created | `people`, `families`, `children`, `profiles`, `contributions`, `media`, `events`, `achievements`, `fund_transactions`, `scholarships`, `clan_articles`, `cau_duong_pools`, `cau_duong_assignments` exist | - [ ] |
| 5.2.3 | INSERT on all 13 tables | Row created, ID returned | - [ ] |
| 5.2.4 | SELECT on all 13 tables | Rows returned with correct columns | - [ ] |
| 5.2.5 | UPDATE on all 13 tables | Row updated, changes persisted | - [ ] |
| 5.2.6 | DELETE on all 13 tables | Row removed, foreign keys respected | - [ ] |
| 5.2.7 | Re-launch preserves data | Data written before quit is available after restart | - [ ] |

### 5.3 Auth Shim

| # | Test Case | Expected Result | Status |
| --- | --------- | --------------- | ------ |
| 5.3.1 | Mock login succeeds | `signInWithPassword` resolves without error | - [ ] |
| 5.3.2 | `getUser()` returns admin profile | `user.id` is valid UUID, role is `admin` | - [ ] |
| 5.3.3 | `getSession()` returns valid session | Session object with `access_token` present | - [ ] |
| 5.3.4 | `signOut()` is no-op | Resolves without error, no state change | - [ ] |
| 5.3.5 | `onAuthStateChange` fires SIGNED_IN | Listener callback invoked with SIGNED_IN event on subscribe | - [ ] |

### 5.4 Storage Shim

| # | Test Case | Expected Result | Status |
| --- | --------- | --------------- | ------ |
| 5.4.1 | Media upload via `/api/media` | File saved to local media directory, path returned | - [ ] |
| 5.4.2 | Media download via `/api/media/[...path]` | Correct file served with appropriate Content-Type | - [ ] |
| 5.4.3 | Path traversal guard (`../`) | Request with `../` in path returns 400/403 | - [ ] |
| 5.4.4 | Non-existent file returns 404 | GET for missing file returns 404 status | - [ ] |
| 5.4.5 | Filename with special characters | Upload/download works for filenames with spaces, Vietnamese diacritics | - [ ] |

### 5.5 Query Operators

| # | Test Case | Expected Result | Status |
| --- | --------- | --------------- | ------ |
| 5.5.1 | `.select('*')` | Returns all columns for matching rows | - [ ] |
| 5.5.2 | `.select('id, name')` | Returns only specified columns | - [ ] |
| 5.5.3 | `.eq('column', value)` | Filters rows where column equals value | - [ ] |
| 5.5.4 | `.in('column', [values])` | Filters rows where column is in array | - [ ] |
| 5.5.5 | `.ilike('column', '%pattern%')` | Case-insensitive LIKE match | - [ ] |
| 5.5.6 | `.is('column', null)` | Filters rows where column IS NULL | - [ ] |
| 5.5.7 | `.or('col1.eq.a,col2.eq.b')` | OR condition across columns | - [ ] |
| 5.5.8 | `.not('column', 'eq', value)` | Negated filter | - [ ] |
| 5.5.9 | `.order('column', { ascending: true })` | Results sorted ascending | - [ ] |
| 5.5.10 | `.order('column', { ascending: false })` | Results sorted descending | - [ ] |
| 5.5.11 | `.limit(n)` | Returns at most n rows | - [ ] |
| 5.5.12 | `.single()` | Returns exactly one row (not array) | - [ ] |
| 5.5.13 | `.maybeSingle()` | Returns one row or null (no error on zero rows) | - [ ] |

### 5.6 Type Coercion

| # | Test Case | Expected Result | Status |
| --- | --------- | --------------- | ------ |
| 5.6.1 | Boolean 0/1 → true/false | SQLite integer 0 returned as `false`, 1 as `true` | - [ ] |
| 5.6.2 | Boolean true/false → 0/1 | JS `true` stored as 1, `false` as 0 in SQLite | - [ ] |
| 5.6.3 | JSONB ↔ TEXT | JSON objects stored as TEXT, parsed back to objects on read | - [ ] |
| 5.6.4 | UUID auto-generation | Rows without explicit `id` get a valid UUID v4 assigned | - [ ] |
| 5.6.5 | Timestamp auto-generation | `created_at` / `updated_at` populated automatically | - [ ] |
| 5.6.6 | NULL handling | NULL values round-trip correctly (not converted to empty string) | - [ ] |

### 5.7 RPC

| # | Test Case | Expected Result | Status |
| --- | --------- | --------------- | ------ |
| 5.7.1 | `is_person_in_subtree(root, target)` — direct child | Returns `true` for immediate child of root | - [ ] |
| 5.7.2 | `is_person_in_subtree(root, target)` — deep descendant | Returns `true` for grandchild/great-grandchild via recursive CTE | - [ ] |
| 5.7.3 | `is_person_in_subtree(root, target)` — unrelated person | Returns `false` for person not in subtree | - [ ] |
| 5.7.4 | `is_person_in_subtree(root, root)` — self | Returns `true` (root is in its own subtree) | - [ ] |
| 5.7.5 | RPC with invalid UUID | Returns error, does not crash | - [ ] |

### 5.8 Error Shapes

| # | Test Case | Expected Result | Status |
| --- | --------- | --------------- | ------ |
| 5.8.1 | `.single()` with no matching rows | Error with `code: 'PGRST116'`, message indicates no rows | - [ ] |
| 5.8.2 | `.single()` with multiple matching rows | Error with `code: 'PGRST116'`, message indicates multiple rows | - [ ] |
| 5.8.3 | Insert with missing required column | Error returned with column name in message | - [ ] |
| 5.8.4 | Foreign key violation | Error returned with constraint name | - [ ] |
| 5.8.5 | Unique constraint violation | Error returned with duplicate key info | - [ ] |

### 5.9 Export / Import

| # | Test Case | Expected Result | Status |
| --- | --------- | --------------- | ------ |
| 5.9.1 | Export creates ZIP file | Valid ZIP archive generated | - [ ] |
| 5.9.2 | ZIP contains manifest | `manifest.json` present with version, timestamp, table list | - [ ] |
| 5.9.3 | ZIP includes media files | All files from media directory included under `media/` folder | - [ ] |
| 5.9.4 | ZIP includes all table data | JSON files for each of the 13 tables present | - [ ] |
| 5.9.5 | Fresh import into empty database | All tables populated, media files restored, app loads correctly | - [ ] |
| 5.9.6 | Merge import into existing database | Existing records preserved, new records added, conflicts resolved | - [ ] |
| 5.9.7 | Import invalid ZIP | Graceful error message, no data corruption | - [ ] |
| 5.9.8 | Import ZIP with missing manifest | Rejected with clear error | - [ ] |

### 5.10 Pages

| # | Test Case | Expected Result | Status |
| --- | --------- | --------------- | ------ |
| 5.10.1 | Home page (`/`) | Renders without errors | - [ ] |
| 5.10.2 | Tree page (`/tree`) | Family tree visualization loads | - [ ] |
| 5.10.3 | People list (`/people`) | Member list renders | - [ ] |
| 5.10.4 | Person detail (`/people/[id]`) | Detail view with relations card loads | - [ ] |
| 5.10.5 | Directory (`/directory`) | Member directory renders | - [ ] |
| 5.10.6 | Events (`/events`) | Event calendar/list renders | - [ ] |
| 5.10.7 | Contributions (`/contributions`) | Contribution list renders | - [ ] |
| 5.10.8 | Documents (`/documents/book`) | Gia phả sách page renders | - [ ] |
| 5.10.9 | Achievements (`/achievements`) | Vinh danh page renders | - [ ] |
| 5.10.10 | Charter (`/charter`) | Hương ước page renders | - [ ] |
| 5.10.11 | Fund (`/fund`) | Quỹ khuyến học page renders | - [ ] |
| 5.10.12 | Cầu đường (`/cau-duong`) | Lịch cầu đường page renders | - [ ] |
| 5.10.13 | Admin panel (`/admin/*`) | Admin pages render for admin role | - [ ] |

## Running Tests

```bash
cd frontend
pnpm test          # Unit tests
pnpm test:e2e      # E2E tests
pnpm test:coverage # With coverage
```

### Desktop App Tests

```bash
cd desktop
pnpm test          # Unit + integration tests (Vitest)
pnpm test:e2e      # Electron E2E tests (Playwright Electron)
```
