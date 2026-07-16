---
project: AncestorTree
path: docs/04-build/SPRINT-14-SPEC.md
type: build
version: 1.0.0
updated: 2026-03-09
owner: "@pm"
status: draft
---

# Sprint 14 — GEDCOM Export + Duplicate Detection + Elderly Mode (v2.6.0)

## 1. Context & Motivation

### Business Need

Nghiên cứu repo [GiaPhaHoLe](https://github.com/dunglechi/GiaPhaHoLe) phát hiện nhiều tính năng hay cho gia phả Việt Nam. CTO đã review và phê duyệt 3 tính năng cho Sprint 14:

1. **GEDCOM 7.0 Export** — chuẩn quốc tế chia sẻ dữ liệu gia phả (chỉ Export, không Import)
2. **Duplicate Detection** — phát hiện thành viên trùng lặp (detection + review UI, không auto-merge)
3. **Elderly Mode** — chế độ hiển thị cho người cao tuổi (font lớn, giao diện đơn giản)

### Scope

- **In scope:** GEDCOM 7.0 export, duplicate detection with admin review, elderly mode toggle
- **Out of scope:** GEDCOM import, auto-merge duplicates, AI search, D3.js radial tree

### Dependencies

- Sprint 13 complete (Góc giao lưu)
- `getTreeData()` function exists in `src/lib/supabase-data.ts`
- `useTreeData()` hook exists in `src/hooks/use-families.ts`

---

## 2. Feature A: GEDCOM 7.0 Export

### A1. Tổng quan

Xuất toàn bộ dữ liệu gia phả ra file `.ged` chuẩn GEDCOM 7.0 (UTF-8 + BOM).
Người dùng có thể import vào FamilySearch, MyHeritage, Gramps, v.v.

### A2. Data mapping: AncestorTree → GEDCOM 7.0

```text
Person.display_name  → INDI > NAME Given /Surname/  (tách bằng last-space)
Person.gender 1/2    → INDI > SEX M/F
Person.birth_year    → INDI > BIRT > DATE 1950
Person.birth_date    → INDI > BIRT > DATE 15 MAR 1950
Person.birth_place   → INDI > BIRT > PLAC ...
Person.death_year    → INDI > DEAT > DATE ...
Person.death_place   → INDI > DEAT > PLAC ...
Person.burial_place  → INDI > BURI > PLAC ...
Person.is_living     → nếu true: bỏ DEAT; nếu false + no date: DEAT Y
Person.biography     → INDI > NOTE (CONT cho multiline)
Person.occupation    → INDI > OCCU
Person.generation    → INDI > _GENER (extension tag)
Person.chi           → INDI > _CHI (extension tag)

Family.father_id     → FAM > HUSB @I{n}@
Family.mother_id     → FAM > WIFE @I{n}@
Family.marriage_date → FAM > MARR > DATE ...
Children (sorted)    → FAM > CHIL @I{n}@ (theo sort_order)

Bidirectional: INDI > FAMC @F{n}@ + INDI > FAMS @F{n}@
```

PII fields (phone, email, zalo, facebook, address) → **KHÔNG xuất** (privacy).

### A3. Extension tags (SCHMA)

```text
1 SCHMA
2 TAG _GENER https://ancestortree.info/gedcom/generation
2 TAG _CHI https://ancestortree.info/gedcom/chi-branch
```

### A4. Core function: `exportToGedcom()`

```text
Input:  TreeData { people, families, children }
Output: string (GEDCOM 7.0 content)

Steps:
1. Build xref maps: personId → @I{n}@, familyId → @F{n}@
2. Build reverse maps: personId → [familyIds as child], personId → [familyIds as spouse]
3. Emit HEAD (GEDC VERS 7.0, SOUR AncestorTree, SCHMA extensions)
4. For each person: emit INDI record
5. For each family: emit FAM record (HUSB, WIFE, CHIL sorted, MARR)
6. Emit TRLR
7. Prepend BOM (\uFEFF)
```

Reuse: `getTreeData()` from `src/lib/supabase-data.ts`.

### A5. API endpoint

```text
GET /api/export/gedcom
→ Response: file download, Content-Type: text/x-gedcom
→ Filename: ancestortree-YYYY-MM-DD.ged
→ Auth: admin/editor only (service-role for full data access)
```

### A6. Desktop mode

Desktop: gọi cùng API endpoint (`/api/export/gedcom`). SQLite shim đã handle `getTreeData()`.

### A7. Files

| File                                        | Action | Description                                    |
| ------------------------------------------- | ------ | ---------------------------------------------- |
| `src/lib/gedcom-export.ts`                  | NEW    | `exportToGedcom(data: TreeData): string`       |
| `src/app/api/export/gedcom/route.ts`        | NEW    | API endpoint: GET → generate .ged → download   |
| `src/app/(main)/admin/export/page.tsx`      | NEW    | Admin page: nút "Xuất GEDCOM" + preview        |
| `src/app/(main)/admin/export/error.tsx`     | NEW    | Error boundary                                 |
| `src/app/(main)/admin/export/loading.tsx`   | NEW    | Loading skeleton                               |
| `src/components/layout/app-sidebar.tsx`     | MODIFY | Thêm nav "Xuất dữ liệu" trong admin           |

---

## 3. Feature B: Duplicate Detection

### B1. Tổng quan

Phát hiện thành viên có thể trùng lặp bằng composite scoring.
Admin review queue — **KHÔNG auto-merge** (CTO: risk quá cao cho gia phả).

### B2. Algorithm: Composite Scoring

```text
Score = nameScore × 0.30
      + fatherScore × 0.25
      + birthYearScore × 0.20
      + generationScore × 0.15
      + genderScore × 0.10

Negative signals (veto):
- Khác giới tính (gender mismatch) → score = 0 (skip)
- Chênh birth_year > 10 năm → score = 0 (skip)
```

**nameScore**: Vietnamese name comparison

1. Tách Họ / Đệm / Tên (last space = Tên, first word = Họ, giữa = Đệm)
2. Normalize: NFD → remove diacritics → lowercase
3. Levenshtein distance trên từng phần, weighted: Tên 0.5 + Họ 0.3 + Đệm 0.2
4. Score = 1 - (weighted_distance / max_length)

**fatherScore**: Tìm cha qua `children` + `families` tables

- Cùng cha → 1.0
- Không có thông tin cha → 0.5 (neutral)
- Khác cha → 0.0

**birthYearScore**: `1.0 - (|year_diff| / 10)`, clamp 0-1

**generationScore**: Cùng đời → 1.0, chênh 1 → 0.5, chênh >1 → 0.0

**genderScore**: Match → 1.0, mismatch → veto (skip pair)

### B3. Blocking Strategy (Performance)

Trước khi so sánh O(n²), pre-filter:

- Chỉ so sánh cùng surname (Họ)
- Chỉ so sánh generation ±1
- Giảm từ ~n² xuống ~k² (k << n)

### B4. Thresholds

| Level  | Score   | Action                           |
| ------ | ------- | -------------------------------- |
| HIGH   | >= 85%  | Hiện đầu danh sách, badge đỏ    |
| MEDIUM | 60-84%  | Hiện trong danh sách, badge vàng |
| LOW    | < 60%   | Ẩn (không hiện)                  |

### B5. Types

```typescript
interface DuplicateScore {
  name: number;       // 0-1
  father: number;     // 0-1
  birthYear: number;  // 0-1
  generation: number; // 0-1
  gender: number;     // 0-1
  total: number;      // weighted composite 0-1
}

interface DuplicatePair {
  personA: Person;
  personB: Person;
  score: DuplicateScore;
  level: 'HIGH' | 'MEDIUM';
}
```

### B6. Admin Review UI

```text
┌─────────────────────────────────────────────┐
│  Phát hiện trùng lặp                        │
│  Tìm thấy 3 cặp có thể trùng              │
├─────────────────────────────────────────────┤
│  [HIGH 92%] ●  vs  ●                       │
│  Đặng Văn Nam (Đời 5)  ↔  Đặng Văn Nam    │
│  Sinh: 1985              Sinh: 1986         │
│  Cha: Đặng Văn Tuấn      Cha: Đặng Văn Tuấn│
│  [Xem chi tiết A] [Xem chi tiết B] [Bỏ qua]│
├─────────────────────────────────────────────┤
│  [MEDIUM 72%] ●  vs  ●                     │
│  Đặng Thị Lan (Đời 6)  ↔  Đặng Thị Lan H. │
│  ...                                        │
└─────────────────────────────────────────────┘
```

Actions per pair: "Xem chi tiết A" (link), "Xem chi tiết B", "Bỏ qua" (dismiss).
Dismissed pairs saved to localStorage.

### B7. Reuse existing code

- `getTreeData()` from `supabase-data.ts` — toàn bộ data
- `useTreeData()` from `use-families.ts` — React Query hook, 5min staleTime
- Client-side only (không cần API endpoint riêng)

### B8. Files

| File                                           | Action | Description                           |
| ---------------------------------------------- | ------ | ------------------------------------- |
| `src/lib/duplicate-detection.ts`               | NEW    | `findDuplicates()` scoring + blocking |
| `src/hooks/use-duplicates.ts`                  | NEW    | `useDuplicates()` React Query hook    |
| `src/app/(main)/admin/duplicates/page.tsx`     | NEW    | Admin review page                     |
| `src/app/(main)/admin/duplicates/error.tsx`    | NEW    | Error boundary                        |
| `src/app/(main)/admin/duplicates/loading.tsx`  | NEW    | Loading skeleton                      |
| `src/types/index.ts`                           | MODIFY | Add DuplicatePair, DuplicateScore     |
| `src/components/layout/app-sidebar.tsx`        | MODIFY | Thêm "Trùng lặp" trong admin nav     |

---

## 4. Feature C: Elderly Mode (Chế độ người cao tuổi)

### C1. Tổng quan

Toggle "Chế độ hiển thị lớn" cho người cao tuổi:

- Font size tăng (base 16px → 20px)
- Spacing tăng (padding/gap lớn hơn)
- Giao diện đơn giản hóa (ẩn tính năng phức tạp)
- Cây gia phả → danh sách đời (thay vì cây đồ họa)

### C2. Implementation: CSS custom property + Context

```typescript
// ElderlyContext: boolean toggle, persist to localStorage
const [elderlyMode, setElderlyMode] = useState(
  () => localStorage.getItem('elderlyMode') === 'true'
);
```

Khi `elderlyMode = true`:

- `<html>` thêm class `elderly-mode`
- CSS: `.elderly-mode { font-size: 20px; }` + spacing overrides
- Sidebar: ẩn admin items, chỉ hiện core nav (Trang chủ, Cây gia phả, Thành viên, Góc giao lưu)
- Tree page: hiện `<ElderlyTreeView>` thay vì `<FamilyTree>`

### C3. ElderlyTreeView component

Danh sách phân nhóm theo đời:

```text
Đời 1 (Thủy tổ)
├── Đặng Đình X (1820-1890)

Đời 2
├── Đặng Đình Y (1845-1920) — con ông X
├── Đặng Đình Z (1850-1925) — con ông X

Đời 3
├── Đặng Đình A (1875-1950) — con ông Y
├── Đặng Đình B (1880-1955) — con ông Y
```

Click vào tên → mở `/people/[id]`.

### C4. Reuse

- `useTreeData()` — đã có, dùng cho cả ElderlyTreeView
- Person page `/people/[id]` — reuse, chỉ áp CSS elderly-mode
- Sidebar — conditional filter, không tạo sidebar mới

### C5. Files

| File                                        | Action | Description                      |
| ------------------------------------------- | ------ | -------------------------------- |
| `src/contexts/elderly-context.tsx`          | NEW    | ElderlyContext + ElderlyProvider |
| `src/components/tree/elderly-tree-view.tsx` | NEW    | Danh sách theo đời               |
| `src/components/layout/elderly-toggle.tsx`  | NEW    | Toggle button (sidebar/header)   |
| `src/app/globals.css`                       | MODIFY | `.elderly-mode` CSS overrides    |
| `src/app/(main)/layout.tsx`                 | MODIFY | Wrap ElderlyProvider             |
| `src/components/layout/app-sidebar.tsx`     | MODIFY | Conditional nav items            |
| `src/components/tree/family-tree.tsx`       | MODIFY | Conditional ElderlyTreeView      |

---

## 5. Execution Order

```text
Phase 1: Types (15m)
└── S14-01: Add DuplicatePair, DuplicateScore, GedcomExportOptions types

Phase 2: GEDCOM Export (2h)
├── S14-02: gedcom-export.ts — core export function
├── S14-03: /api/export/gedcom/route.ts — API endpoint
└── S14-04: /admin/export/page.tsx + error + loading

Phase 3: Duplicate Detection (2.5h)
├── S14-05: duplicate-detection.ts — scoring algorithm + blocking
├── S14-06: use-duplicates.ts — React Query hook
└── S14-07: /admin/duplicates/page.tsx + error + loading

Phase 4: Elderly Mode (1.5h)
├── S14-08: elderly-context.tsx + elderly-toggle.tsx
├── S14-09: elderly-tree-view.tsx
├── S14-10: globals.css elderly-mode overrides
└── S14-11: Layout + sidebar + tree page conditional rendering

Phase 5: Infrastructure (30m)
├── S14-12: Sidebar nav items (admin: Xuất dữ liệu, Trùng lặp)
└── S14-13: proxy.ts: add /admin/export, /admin/duplicates to auth paths

Phase 6: Build & verify (30m)
└── S14-14: pnpm build + manual QA
```

---

## 6. Tasks

| #      | Task                                                             | Type    | Est. |
| ------ | ---------------------------------------------------------------- | ------- | ---- |
| S14-01 | Types: DuplicatePair, DuplicateScore, GedcomExportOptions        | TS      | 15m  |
| S14-02 | gedcom-export.ts: exportToGedcom() + name parser + date format   | Lib     | 60m  |
| S14-03 | API: /api/export/gedcom/route.ts (admin-only, file download)     | API     | 20m  |
| S14-04 | Admin export page + error/loading boundaries                     | Page    | 30m  |
| S14-05 | duplicate-detection.ts: scoring + blocking + name comparison     | Lib     | 60m  |
| S14-06 | use-duplicates.ts: React Query hook                              | Hooks   | 15m  |
| S14-07 | Admin duplicates page + review UI + dismiss                      | Page    | 45m  |
| S14-08 | ElderlyContext + ElderlyToggle component                         | Context | 20m  |
| S14-09 | ElderlyTreeView: danh sách phân nhóm theo đời                   | UI      | 30m  |
| S14-10 | globals.css: .elderly-mode CSS overrides                         | CSS     | 15m  |
| S14-11 | Layout/sidebar/tree page conditional rendering                   | Infra   | 20m  |
| S14-12 | Sidebar nav + proxy.ts auth paths                                | Infra   | 15m  |
| S14-13 | Build verify: pnpm build + QA                                    | QA      | 15m  |

**Total estimate: ~7h**

---

## 7. File Structure

```text
frontend/src/
├── types/index.ts                           MODIFY (S14-01)
├── lib/
│   ├── gedcom-export.ts                     NEW (S14-02)
│   └── duplicate-detection.ts               NEW (S14-05)
├── hooks/
│   └── use-duplicates.ts                    NEW (S14-06)
├── contexts/
│   └── elderly-context.tsx                  NEW (S14-08)
├── components/
│   ├── tree/elderly-tree-view.tsx           NEW (S14-09)
│   ├── layout/elderly-toggle.tsx            NEW (S14-08)
│   └── layout/app-sidebar.tsx               MODIFY (S14-12)
├── app/
│   ├── globals.css                          MODIFY (S14-10)
│   ├── (main)/layout.tsx                    MODIFY (S14-11)
│   ├── (main)/admin/export/
│   │   ├── page.tsx                         NEW (S14-04)
│   │   ├── error.tsx                        NEW (S14-04)
│   │   └── loading.tsx                      NEW (S14-04)
│   └── (main)/admin/duplicates/
│       ├── page.tsx                         NEW (S14-07)
│       ├── error.tsx                        NEW (S14-07)
│       └── loading.tsx                      NEW (S14-07)
├── api/export/gedcom/
│   └── route.ts                             NEW (S14-03)
└── proxy.ts                                 MODIFY (S14-12)
```

**New files:** ~11 | **Modified files:** ~6 | **Est. LOC:** ~1,200-1,500

---

## 8. Verification Checklist

### GEDCOM Export

- [ ] Admin → /admin/export → click "Xuất GEDCOM" → file .ged download
- [ ] Mở file .ged bằng text editor → valid GEDCOM 7.0 (BOM + HEAD + INDI + FAM + TRLR)
- [ ] Import file .ged vào Gramps hoặc FamilySearch → dữ liệu hiển thị đúng
- [ ] Extension tags _GENER, _CHI có trong output
- [ ] PII (phone, email) KHÔNG có trong output
- [ ] Desktop mode → export hoạt động bình thường

### Duplicate Detection

- [ ] Admin → /admin/duplicates → hiện danh sách cặp trùng (nếu có)
- [ ] Score badge: HIGH (đỏ, >=85%), MEDIUM (vàng, 60-84%)
- [ ] Click "Xem chi tiết" → navigate to person page
- [ ] Click "Bỏ qua" → pair disappears, persist in localStorage
- [ ] Refresh page → dismissed pairs vẫn ẩn
- [ ] Không có cặp nào gender mismatch hoặc birth_year chênh >10

### Elderly Mode

- [ ] Click toggle "Chế độ hiển thị lớn" → font tăng, spacing tăng
- [ ] Sidebar: chỉ hiện core nav items (ẩn admin phức tạp)
- [ ] Tree page: hiện danh sách theo đời thay vì cây đồ họa
- [ ] Click tên trong danh sách → mở /people/[id]
- [ ] Refresh page → elderly mode persist (localStorage)
- [ ] Toggle off → quay về giao diện bình thường

### Build

- [ ] `pnpm build` passes
- [ ] `pnpm lint` passes
- [ ] Existing routes không bị ảnh hưởng (regression)

---

## 9. CTO Constraints

1. **Không thêm D3.js** — không cần cho sprint này
2. **GEDCOM chỉ Export** — không Import (Import = XL effort, sprint riêng)
3. **Duplicate Detection = detection + review only** — KHÔNG auto-merge
4. **Mỗi tính năng phải có fallback Desktop mode** (offline, no external API)
5. **Không thêm AI dependency** — để sau Sprint 15+

---

## 10. Risks & Mitigations

| #    | Risk                                          | Impact | Mitigation                                                       |
| ---- | --------------------------------------------- | ------ | ---------------------------------------------------------------- |
| R-01 | GEDCOM export fail with large datasets (500+) | Medium | Stream output, test with seed data 18 members first              |
| R-02 | Vietnamese name parsing edge cases             | Medium | Handle single-word names, compound surnames (Đặng Đình)          |
| R-03 | Duplicate detection false positives            | Low    | Conservative thresholds (60%+), admin review only, no auto-merge |
| R-04 | Elderly mode CSS conflicts with existing UI    | Low    | Use `.elderly-mode` scope, test all pages                        |
| R-05 | Desktop mode GEDCOM export fails               | Low    | Same API endpoint, SQLite shim handles getTreeData()             |

---

## 11. Future Considerations (Not in Sprint 14)

| Feature                | Sprint | Notes                                             |
| ---------------------- | ------ | ------------------------------------------------- |
| GEDCOM Import          | 16+    | XL effort: map flat GEDCOM → normalized 3-table   |
| Auto-merge duplicates  | 16+    | Only after extensive testing + admin confirmation  |
| AI Search (Gemini)     | 15+    | Needs business case, API cost analysis             |
| Radial Tree (D3.js)    | 15+    | Optional view, needs bundle size analysis          |
| Companion Mode         | 16+    | WebSocket/realtime, over-engineered for ~50 users  |

---

*SDLC Framework 6.1.1 - Stage 04 Build*
