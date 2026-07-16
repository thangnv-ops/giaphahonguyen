---
project: AncestorTree
path: docs/04-build/SPRINT-15-SPEC.md
type: build
version: 1.0.0
updated: 2026-03-09
owner: "@pm"
status: draft
---

# Sprint 15 — Tìm kiếm & Thống kê (v2.7.0)

## 1. Context & Motivation

### Business Need

Ba tính năng P0 từ nghiên cứu GiaPhaHoLe, CTO đã phê duyệt:

1. **Tìm quan hệ giữa 2 người (Pathfinding)** — "Ông A có quan hệ gì với ông B?"
2. **Dashboard thống kê** — Biểu đồ phân bố theo đời, chi, giới tính, v.v.
3. **Xuất PDF cây gia phả** — In ấn cho lễ giỗ, hội đồng gia tộc

### Scope

- **In scope:** Pathfinding (BFS + LCA), stats dashboard (recharts), PDF export (prototype)
- **Out of scope:** AI search, radial tree, GEDCOM import

### Dependencies

- Sprint 14 complete (v2.6.0)
- `getTreeData()` in `src/lib/supabase-data.ts` (returns people + families + children)
- `useTreeData()` in `src/hooks/use-families.ts` (React Query, 5min staleTime)

---

## 2. Feature A: Tìm quan hệ giữa 2 người (Pathfinding)

### A1. Tổng quan

Chọn 2 thành viên bất kỳ → hệ thống tìm đường quan hệ ngắn nhất và mô tả bằng tiếng Việt.

### A2. Algorithm

**Graph construction** (từ TreeData):

```text
Nodes: mỗi Person là 1 node
Edges (bidirectional):
  - Cha/Mẹ → Con: weight 1.0 (blood)
  - Vợ ↔ Chồng: weight 2.0 (marriage)

Build từ families + children tables:
  - Mỗi family: father_id ↔ mother_id (marriage edge)
  - Mỗi child in family: child.person_id ↔ family.father_id (blood edge)
  - Mỗi child in family: child.person_id ↔ family.mother_id (blood edge)
```

**BFS** tìm đường ngắn nhất (unweighted) giữa personA và personB.

**LCA (Lowest Common Ancestor):**

1. Trace ancestors từ personA lên gốc → Set ancestorsA
2. Trace ancestors từ personB lên gốc → tìm đầu tiên nằm trong ancestorsA
3. LCA = tổ tiên chung gần nhất

**Vietnamese relationship description:**

```text
Same generation, same parents → "Anh/chị em ruột"
Same generation, same grandparents → "Anh/chị em họ"
Different generation → "Cháu đời X của ông/bà Y"
Through marriage → "(thông gia)"
No common ancestor found → "Không tìm thấy quan hệ trực tiếp"
```

### A3. Reuse existing code

| Pattern | Location | Reuse |
|---------|----------|-------|
| `fatherToFamilies` map | `family-tree.tsx:277` | Graph downward edges |
| `childToFamily` map | `family-tree.tsx:287` | Graph upward edges |
| `addAncestors()` upward DFS | `family-tree.tsx:338` | LCA ancestor tracing |
| `getTreeData()` | `supabase-data.ts:614` | All data for graph |

### A4. UI: Trang Tìm quan hệ

```text
┌──────────────────────────────────────────────┐
│  Tìm quan hệ giữa 2 thành viên              │
├──────────────────────────────────────────────┤
│  Người 1: [🔍 Combobox chọn thành viên    ] │
│  Người 2: [🔍 Combobox chọn thành viên    ] │
│  [Tìm quan hệ]                              │
├──────────────────────────────────────────────┤
│  Kết quả:                                    │
│  Đặng Văn A ← con → Đặng Văn B             │
│  "Anh em ruột (cùng cha Đặng Văn X)"        │
│  Tổ tiên chung: Đặng Văn X (Đời 3)          │
│  Khoảng cách: 2 bậc                         │
│                                              │
│  [Xem trên cây gia phả]                     │
└──────────────────────────────────────────────┘
```

### A5. Files

| File | Action | Description |
|------|--------|-------------|
| `src/lib/pathfinding.ts` | NEW | `findRelationship()`, `findLCA()`, `describeRelationship()` |
| `src/hooks/use-pathfinding.ts` | NEW | `useRelationship(personAId, personBId)` |
| `src/app/(main)/relationship/page.tsx` | NEW | Trang tìm quan hệ |
| `src/app/(main)/relationship/error.tsx` | NEW | Error boundary |
| `src/app/(main)/relationship/loading.tsx` | NEW | Loading skeleton |
| `src/components/layout/app-sidebar.tsx` | MODIFY | Thêm "Tìm quan hệ" nav item |

---

## 3. Feature B: Dashboard Thống kê

### B1. Tổng quan

Trang thống kê trực quan với biểu đồ, mở rộng từ StatsCard hiện có.

### B2. Library: recharts

```bash
pnpm add recharts
```

Lý do chọn recharts: phổ biến nhất trong React ecosystem, nhẹ, declarative API, SSR-compatible.
**CTO đã yêu cầu không dùng D3.js** — recharts phù hợp hơn cho bar/pie chart đơn giản.

### B3. Thống kê cần hiển thị

| # | Metric | Chart type | Source |
|---|--------|-----------|--------|
| 1 | Tổng thành viên | Number card | `getStats().totalPeople` |
| 2 | Phân bố theo đời | Bar chart (horizontal) | Group by `person.generation` |
| 3 | Phân bố theo chi | Bar chart | Group by `person.chi` |
| 4 | Tỷ lệ giới tính | Pie chart | Group by `person.gender` |
| 5 | Tỷ lệ còn sống/đã mất | Pie chart | Group by `person.is_living` |
| 6 | Trung bình con/gia đình | Number card | `families.count` vs `children.count` |
| 7 | Tỷ lệ tuyệt tự | Number card | Người không có con / tổng |

### B4. Reuse

- `getTreeData()` — đã trả về tất cả data cần thiết
- `getStats()` — extend, không tạo mới
- `StatsCard` — giữ nguyên trên homepage, trang mới là dashboard chi tiết

### B5. Files

| File | Action | Description |
|------|--------|-------------|
| `src/lib/stats-calculator.ts` | NEW | `calculateDetailedStats(data: TreeData)` |
| `src/app/(main)/stats/page.tsx` | NEW | Dashboard thống kê |
| `src/app/(main)/stats/error.tsx` | NEW | Error boundary |
| `src/app/(main)/stats/loading.tsx` | NEW | Loading skeleton |
| `src/components/layout/app-sidebar.tsx` | MODIFY | Thêm "Thống kê" nav item |
| `frontend/package.json` | MODIFY | Add `recharts` dependency |

---

## 4. Feature C: Xuất PDF cây gia phả (Prototype)

### C1. Tổng quan

Xuất cây gia phả hiện tại (hoặc một nhánh) ra file PDF để in ấn.
**CTO lưu ý: đây là prototype** — có thể giới hạn với cây lớn (100+ node).

### C2. Approach: html2canvas + jsPDF (client-side)

```text
1. Render cây gia phả ra DOM (reuse existing FamilyTree component)
2. html2canvas chụp DOM → Canvas
3. jsPDF chuyển Canvas → PDF (A3/A2 landscape)
4. Download file PDF
```

### C3. Giới hạn prototype

- Cây < 50 người: full quality
- Cây 50-100 người: giảm resolution, cảnh báo user
- Cây > 100 người: hiện cảnh báo "Cây quá lớn, vui lòng lọc theo nhánh trước khi xuất"
- Chỉ xuất view hiện tại (sau khi filter nếu có)

### C4. Dependencies

```bash
pnpm add html2canvas jspdf
```

### C5. Files

| File | Action | Description |
|------|--------|-------------|
| `src/lib/pdf-export.ts` | NEW | `exportTreeToPdf(elementRef, filename)` |
| `src/components/tree/family-tree.tsx` | MODIFY | Thêm nút "Xuất PDF" + ref |

---

## 5. Execution Order

```text
Phase 1: Dependencies (10m)
└── S15-01: pnpm add recharts html2canvas jspdf

Phase 2: Pathfinding (2.5h)
├── S15-02: pathfinding.ts — BFS + LCA + Vietnamese description
├── S15-03: use-pathfinding.ts — React Query hook
└── S15-04: /relationship page + error + loading

Phase 3: Stats Dashboard (2h)
├── S15-05: stats-calculator.ts — detailed stats from TreeData
└── S15-06: /stats page + recharts charts + error + loading

Phase 4: PDF Export (1.5h)
├── S15-07: pdf-export.ts — html2canvas + jsPDF
└── S15-08: Add export button to family-tree.tsx

Phase 5: Infrastructure (20m)
└── S15-09: Sidebar nav (Tìm quan hệ, Thống kê) + proxy.ts

Phase 6: Build & verify (30m)
└── S15-10: pnpm build + manual QA
```

**Total estimate: ~7h**

---

## 6. Tasks

| # | Task | Type | Est. |
|---|------|------|------|
| S15-01 | Dependencies: recharts, html2canvas, jspdf | Deps | 10m |
| S15-02 | pathfinding.ts: BFS + LCA + describeRelationship() | Lib | 60m |
| S15-03 | use-pathfinding.ts: React Query hook | Hooks | 15m |
| S15-04 | Relationship page + person combobox + result display | Page | 45m |
| S15-05 | stats-calculator.ts: detailed stats computation | Lib | 30m |
| S15-06 | Stats dashboard page + recharts charts | Page | 60m |
| S15-07 | pdf-export.ts: html2canvas + jsPDF | Lib | 45m |
| S15-08 | Add PDF export button to family-tree.tsx | UI | 15m |
| S15-09 | Sidebar nav + proxy.ts auth paths | Infra | 15m |
| S15-10 | Build verify + QA | QA | 15m |

---

## 7. File Structure

```text
frontend/src/
├── lib/
│   ├── pathfinding.ts                       NEW (S15-02)
│   ├── stats-calculator.ts                  NEW (S15-05)
│   └── pdf-export.ts                        NEW (S15-07)
├── hooks/
│   └── use-pathfinding.ts                   NEW (S15-03)
├── app/(main)/
│   ├── relationship/
│   │   ├── page.tsx                         NEW (S15-04)
│   │   ├── error.tsx                        NEW (S15-04)
│   │   └── loading.tsx                      NEW (S15-04)
│   └── stats/
│       ├── page.tsx                         NEW (S15-06)
│       ├── error.tsx                        NEW (S15-06)
│       └── loading.tsx                      NEW (S15-06)
├── components/
│   ├── tree/family-tree.tsx                 MODIFY (S15-08)
│   └── layout/app-sidebar.tsx               MODIFY (S15-09)
└── proxy.ts                                 MODIFY (S15-09)
```

**New files:** ~9 | **Modified files:** ~3 | **New deps:** recharts, html2canvas, jspdf

---

## 8. Verification Checklist

### Pathfinding

- [ ] Chọn 2 người cùng cha → "Anh em ruột"
- [ ] Chọn 2 người khác đời → hiện LCA + khoảng cách bậc
- [ ] Chọn 2 người vợ/chồng → hiện quan hệ hôn nhân
- [ ] Chọn cùng 1 người → thông báo lỗi
- [ ] Không tìm thấy quan hệ → hiện "Không tìm thấy quan hệ trực tiếp"
- [ ] Desktop mode hoạt động bình thường

### Stats Dashboard

- [ ] Biểu đồ phân bố theo đời hiện đúng
- [ ] Biểu đồ phân bố theo chi hiện đúng
- [ ] Pie chart giới tính + sống/mất hiện đúng
- [ ] Số liệu khớp với homepage StatsCard
- [ ] Desktop mode hoạt động bình thường

### PDF Export

- [ ] Cây < 50 người → PDF download thành công, hình ảnh rõ nét
- [ ] Cây > 100 người → hiện cảnh báo
- [ ] PDF mở được trong Preview/Acrobat
- [ ] File name format: `gia-pha-YYYY-MM-DD.pdf`

### Build

- [ ] `pnpm build` passes
- [ ] `pnpm lint` passes
- [ ] Bundle size tăng < 200KB (recharts tree-shakeable)

---

## 9. Risks & Mitigations

| # | Risk | Impact | Mitigation |
|---|------|--------|------------|
| R-01 | Pathfinding O(n) trên cây lớn | Low | BFS linear time, data < 500 people |
| R-02 | Vietnamese relationship edge cases | Medium | Start with basic rules, iterate |
| R-03 | PDF quality degraded on large trees | Medium | Prototype label, filter-first UX |
| R-04 | recharts SSR hydration mismatch | Low | Use `dynamic(() => import(...), { ssr: false })` |
| R-05 | html2canvas fails on complex CSS | Medium | Test with current tree component early |

---

*SDLC Framework 6.1.1 - Stage 04 Build*
