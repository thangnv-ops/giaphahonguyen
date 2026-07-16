---
project: AncestorTree
path: docs/04-build/SPRINT-17-SPEC.md
type: build
version: 1.0.0
updated: 2026-03-09
owner: "@pm"
status: draft
---

# Sprint 17 — Export/Import nâng cao (v2.9.0)

## 1. Context & Motivation

### Business Need

Mở rộng khả năng chia sẻ dữ liệu:

1. **GEDCOM Import** — Nhập dữ liệu từ FamilySearch, MyHeritage, Gramps vào AncestorTree
2. **JSON Export/Import nâng cao** — Backup format chính thức, versioned schema
3. **CSV Export** — Xuất danh sách thành viên ra Excel cho các cụ không rành công nghệ
4. **Markdown Export** — Xuất gia phả dạng văn bản để in hoặc chia sẻ

### Scope

- **In scope:** GEDCOM 7.0 import, CSV export, Markdown export, JSON backup v2
- **Out of scope:** PDF import, image/OCR import, real-time sync

### Dependencies

- Sprint 14 complete: GEDCOM Export (v2.6.0) — reuse `gedcom-export.ts` patterns
- Sprint 15 complete: PDF export prototype
- `getTreeData()` for all export functions

---

## 2. Feature A: GEDCOM 7.0 Import

### A1. Tổng quan

Import file `.ged` (GEDCOM 7.0 hoặc 5.5.1) vào AncestorTree.
**XL effort** (CTO: sprint riêng) — map flat GEDCOM → normalized 3-table model.

### A2. Import pipeline

```text
1. Upload .ged file
2. Parse GEDCOM → in-memory tree
3. Validate: check required fields, detect encoding
4. Preview: show summary (# individuals, # families, conflicts)
5. Conflict resolution: duplicate detection (reuse Sprint 14 scoring)
6. Map INDI → people rows, FAM → families + children rows
7. Batch INSERT with transaction
8. Show import result
```

### A3. GEDCOM Parser

```text
Input: string (GEDCOM file content)
Output: {
  individuals: GedcomIndividual[],
  families: GedcomFamily[],
  header: GedcomHeader
}

GedcomIndividual {
  xref: string (@I1@)
  name: { given, surname }
  sex: 'M' | 'F' | 'X'
  birth: { date?, place? }
  death: { date?, place? }
  burial: { place? }
  occupation?: string
  note?: string
  familyAsChild: string[]   (FAM xrefs)
  familyAsSpouse: string[]  (FAM xrefs)
}

GedcomFamily {
  xref: string (@F1@)
  husband?: string (INDI xref)
  wife?: string (INDI xref)
  children: string[] (INDI xrefs, ordered)
  marriage: { date?, place? }
}
```

### A4. Mapping GEDCOM → AncestorTree

```text
GedcomIndividual → Person:
  name.given → first_name
  name.surname → surname
  name.given + name.surname → display_name
  sex M/F → gender 1/2
  birth.date → birth_date (parse DD MMM YYYY → ISO)
  birth.place → birth_place
  death.date → death_date
  burial.place → burial_place
  occupation → occupation
  note → biography

GedcomFamily → Family:
  husband → father_id (match by xref → person.id)
  wife → mother_id
  marriage.date → marriage_date

GedcomFamily.children → children rows:
  child xref → person_id, family_id, sort_order (by position)
```

**Generation auto-calculation:** DFS from roots (people with no parents), assign generation incrementally.

### A5. Import UI

```text
┌──────────────────────────────────────────────┐
│  Nhập dữ liệu GEDCOM                        │
├──────────────────────────────────────────────┤
│  Step 1: Upload file                         │
│  [📁 Chọn file .ged] ancestortree.ged (45KB) │
├──────────────────────────────────────────────┤
│  Step 2: Xem trước                           │
│  Tìm thấy: 45 cá nhân, 12 gia đình          │
│  Trùng lặp tiềm ẩn: 3 cặp                   │
│  [Xem chi tiết trùng lặp]                    │
├──────────────────────────────────────────────┤
│  Step 3: Xác nhận                            │
│  ○ Thêm mới tất cả (bỏ qua trùng lặp)      │
│  ○ Bỏ qua các bản ghi trùng lặp             │
│  [Nhập dữ liệu]                             │
├──────────────────────────────────────────────┤
│  Kết quả: Đã thêm 42 thành viên, 12 gia đình│
│  Bỏ qua: 3 (trùng lặp)                      │
└──────────────────────────────────────────────┘
```

### A6. Files

| File | Action | Description |
|------|--------|-------------|
| `src/lib/gedcom-import.ts` | NEW | Parser + mapper + validator |
| `src/app/(main)/admin/import/page.tsx` | NEW | Import wizard (3 steps) |
| `src/app/(main)/admin/import/error.tsx` | NEW | Error boundary |
| `src/app/(main)/admin/import/loading.tsx` | NEW | Loading |

---

## 3. Feature B: CSV Export

### B1. Tổng quan

Xuất danh sách thành viên ra CSV (UTF-8 BOM) để mở trong Excel.

### B2. Columns

```text
Họ tên, Giới tính, Đời, Chi, Năm sinh, Nơi sinh, Năm mất, Còn sống,
Nghề nghiệp, Tên cha, Tên mẹ
```

PII (phone, email) **KHÔNG xuất** — consistent với GEDCOM export.

### B3. Files

| File | Action | Description |
|------|--------|-------------|
| `src/lib/csv-export.ts` | NEW | `exportToCsv(people, families, children): string` |
| `src/app/api/export/csv/route.ts` | NEW | API endpoint |
| Admin export page (Sprint 14) | MODIFY | Thêm nút "Xuất CSV" |

---

## 4. Feature C: Markdown Export

### C1. Tổng quan

Xuất gia phả dạng văn bản Markdown, phân nhóm theo đời.

### C2. Output format

```markdown
# Gia phả họ Đặng — Thạch Lâm, Hà Tĩnh

## Đời 1 (Thủy tổ)

### Đặng Đình X (1820–1890)
- Giới tính: Nam
- Nơi sinh: Thạch Lâm, Hà Tĩnh
- Vợ: Nguyễn Thị Y
- Con: Đặng Đình A, Đặng Đình B

## Đời 2
...
```

### C3. Files

| File | Action | Description |
|------|--------|-------------|
| `src/lib/markdown-export.ts` | NEW | `exportToMarkdown(data: TreeData): string` |
| `src/app/api/export/markdown/route.ts` | NEW | API endpoint |
| Admin export page | MODIFY | Thêm nút "Xuất Markdown" |

---

## 5. Execution Order

```text
Phase 1: CSV + Markdown Export (1.5h)
├── S17-01: csv-export.ts + API endpoint
└── S17-02: markdown-export.ts + API endpoint

Phase 2: GEDCOM Import (4h)
├── S17-03: gedcom-import.ts — parser (GEDCOM → in-memory)
├── S17-04: gedcom-import.ts — mapper (in-memory → AncestorTree rows)
├── S17-05: gedcom-import.ts — validator + duplicate check
└── S17-06: Admin import page (3-step wizard)

Phase 3: Admin export page update (30m)
└── S17-07: Add CSV + Markdown buttons to /admin/export

Phase 4: Build & verify (30m)
└── S17-08: pnpm build + QA
```

**Total estimate: ~6.5h**

---

## 6. Verification Checklist

- [ ] GEDCOM import: upload .ged → preview → confirm → data appears in tree
- [ ] GEDCOM import: detect duplicates, show count
- [ ] CSV export: download .csv → open in Excel → Vietnamese characters display correctly (BOM)
- [ ] Markdown export: download .md → readable format, grouped by generation
- [ ] Admin export page shows all 4 formats: GEDCOM, CSV, Markdown, ZIP backup
- [ ] Desktop mode: all exports work
- [ ] `pnpm build` passes

---

*SDLC Framework 6.1.1 - Stage 04 Build*
