---
project: AncestorTree
path: docs/04-build/SPRINT-18-SPEC.md
type: build
version: 1.0.0
updated: 2026-03-09
owner: "@pm"
status: draft
---

# Sprint 18 — Nhà thờ họ (v3.0.0)

## 1. Context & Motivation

### Business Need

Milestone v3.0.0 — bước đột phá từ "công cụ quản lý" sang "không gian văn hóa dòng họ":

1. **Trang Hội đồng gia tộc** — Giới thiệu ban quản trị, lịch sử, sứ mệnh
2. **Đăng ký thành viên trực tuyến** — Form ghi danh công khai cho con cháu xa
3. **Trang Nhà thờ họ** — Thông tin nhà thờ, hình ảnh, lịch tế lễ
4. **Fuzzy Search (Fuse.js)** — Tìm kiếm client-side mạnh mẽ cho tên tiếng Việt
5. **SEO nâng cao** — Meta tags, sitemap cho landing page

### Scope

- **In scope:** 5 features trên
- **Out of scope:** Phòng thờ ảo (phức tạp, cần thiết kế UX riêng), bản đồ mộ (GIS library nặng), companion mode (WebSocket)

### Dependencies

- Sprint 17 complete (v2.9.0)
- Landing page (`/welcome`) exists (Sprint 10)
- `clan_settings` table exists (Sprint 12)

---

## 2. Feature A: Trang Hội đồng gia tộc

### A1. Tổng quan

Trang public (không cần đăng nhập) hiển thị:

- Ban quản trị dòng họ (Chủ tịch, Phó CT, Thư ký, Thủ quỹ)
- Lịch sử & nguồn gốc dòng họ
- Sứ mệnh & tầm nhìn
- Ảnh nhà thờ họ, từ đường

### A2. Data source

Dùng `clan_settings` table (đã có) với các key mới:

```text
council_members: JSONB — [{ name, title, phone?, avatar? }]
clan_history: TEXT — rich text lịch sử dòng họ
clan_mission: TEXT — sứ mệnh
ancestral_hall_images: JSONB — [URL] ảnh nhà thờ
```

### A3. Files

| File | Action | Description |
|------|--------|-------------|
| `src/app/(landing)/council/page.tsx` | NEW | Trang Hội đồng (public) |
| `src/app/(main)/admin/settings/page.tsx` | MODIFY | Thêm section quản lý Hội đồng |
| `src/lib/supabase-data-clan-settings.ts` | MODIFY | Thêm CRUD cho council settings |

---

## 3. Feature B: Đăng ký thành viên trực tuyến

### B1. Tổng quan

Form ghi danh công khai cho con cháu sống xa, không cần tài khoản.
Admin duyệt → tự động tạo thành viên trong gia phả.

### B2. Database: `member_registrations` table

```sql
CREATE TABLE IF NOT EXISTS member_registrations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name       TEXT NOT NULL,
    gender          INTEGER NOT NULL CHECK (gender IN (1, 2)),
    birth_year      INTEGER,
    birth_place     TEXT,
    phone           TEXT,
    email           TEXT,
    parent_name     TEXT,              -- tên cha/mẹ (text, để đối chiếu)
    generation      INTEGER,           -- đời (tự khai)
    chi             INTEGER,           -- chi (tự khai)
    relationship    TEXT,              -- "Con ông X", "Cháu bà Y"
    notes           TEXT,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by     UUID REFERENCES auth.users(id),
    reviewed_at     TIMESTAMPTZ,
    person_id       UUID REFERENCES people(id), -- linked after approval
    honeypot        TEXT,              -- anti-spam: hidden field, must be empty
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### B3. Flow

```text
1. Con cháu xa truy cập /register-member (public, không cần login)
2. Điền form: họ tên, giới tính, năm sinh, tên cha/mẹ, đời, chi, ghi chú
3. Submit → row INSERT vào member_registrations (status=pending)
4. Admin → /admin/registrations → thấy danh sách chờ duyệt
5. Admin duyệt → tạo person row → link person_id → thông báo
6. Admin từ chối → ghi lý do → thông báo
```

### B4. Anti-spam

- **Honeypot field:** hidden input `website`, nếu filled → reject
- **Rate limit:** max 3 registrations/IP/giờ (application level)
- **Captcha:** không dùng (UX phức tạp cho người lớn tuổi)

### B5. Files

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/20260320000018_sprint18_registrations.sql` | NEW | Table + RLS |
| `src/lib/supabase-data-registrations.ts` | NEW | CRUD |
| `src/hooks/use-registrations.ts` | NEW | Hooks |
| `src/app/(landing)/register-member/page.tsx` | NEW | Public form |
| `src/app/(main)/admin/registrations/page.tsx` | NEW | Admin review |

---

## 4. Feature C: Trang Nhà thờ họ

### C1. Tổng quan

Trang public giới thiệu nhà thờ họ / từ đường:

- Gallery ảnh nhà thờ (slideshow)
- Lịch tế lễ hàng năm (từ events table, filter type = 'gio' hoặc 'le')
- Địa chỉ + Google Maps embed (nếu có toạ độ)
- Lịch sử xây dựng / trùng tu

### C2. Files

| File | Action | Description |
|------|--------|-------------|
| `src/app/(landing)/ancestral-hall/page.tsx` | NEW | Trang nhà thờ (public) |
| Admin settings | MODIFY | Thêm config address, coordinates, images |

---

## 5. Feature D: Fuzzy Search (Fuse.js)

### D1. Tổng quan

Thay thế / bổ sung `searchPeople()` (hiện chỉ dùng `ilike` trên display_name):

- Client-side fuzzy search: tolerant with diacritics ("Dang" matches "Đặng")
- Multi-field: tìm theo tên, nơi sinh, nghề nghiệp
- Instant results: không cần round-trip server

### D2. Implementation

```bash
pnpm add fuse.js
```

```typescript
const fuse = new Fuse(people, {
  keys: [
    { name: 'display_name', weight: 0.7 },
    { name: 'birth_place', weight: 0.2 },
    { name: 'occupation', weight: 0.1 },
  ],
  threshold: 0.3,
  includeScore: true,
});
```

### D3. Files

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/use-fuzzy-search.ts` | NEW | Fuse.js wrapper hook |
| `src/components/people/people-search.tsx` | MODIFY | Use fuzzy search |
| `frontend/package.json` | MODIFY | Add fuse.js |

---

## 6. Feature E: SEO nâng cao

### E1. Tổng quan

Tối ưu SEO cho các trang public (landing, council, ancestral-hall, register-member):

- `metadata` export trong mỗi page.tsx (Next.js 16 built-in)
- Open Graph + Twitter Card meta tags
- `sitemap.xml` generation
- `robots.txt` update

### E2. Files

| File | Action | Description |
|------|--------|-------------|
| `src/app/sitemap.ts` | NEW | Dynamic sitemap generation |
| `src/app/robots.ts` | MODIFY | Update crawl rules |
| Landing pages | MODIFY | Add metadata exports |

---

## 7. Execution Order

```text
Phase 1: Database (30m)
└── S18-01: member_registrations migration + SQLite

Phase 2: Council + Ancestral Hall (2h)
├── S18-02: Council page (public)
├── S18-03: Ancestral hall page (public)
└── S18-04: Admin settings extensions

Phase 3: Registration (2h)
├── S18-05: Registration data layer + hooks
├── S18-06: Public registration form
└── S18-07: Admin review page

Phase 4: Fuzzy Search (1h)
├── S18-08: Fuse.js integration
└── S18-09: People search component update

Phase 5: SEO (30m)
└── S18-10: Sitemap + meta tags + robots

Phase 6: Build & verify (30m)
└── S18-11: pnpm build + QA
```

**Total estimate: ~6.5h**

---

## 8. Verification Checklist

### Hội đồng gia tộc

- [ ] /council hiển thị danh sách ban quản trị
- [ ] Admin thêm/sửa/xoá thành viên hội đồng trong settings
- [ ] Trang public, không cần đăng nhập

### Đăng ký thành viên

- [ ] /register-member → form ghi danh → submit thành công
- [ ] Honeypot filled → reject silently
- [ ] Admin → /admin/registrations → duyệt → tạo person
- [ ] Admin → từ chối → ghi lý do

### Nhà thờ họ

- [ ] /ancestral-hall hiển thị gallery + lịch tế lễ
- [ ] Trang public, responsive

### Fuzzy Search

- [ ] Tìm "dang" → ra kết quả "Đặng" (diacritics tolerant)
- [ ] Tìm "thach lam" → ra người có birth_place "Thạch Lâm"
- [ ] Results instant (client-side)

### SEO

- [ ] /sitemap.xml trả về XML hợp lệ
- [ ] Landing pages có Open Graph meta tags
- [ ] `pnpm build` passes

---

## 9. v3.0.0 Release Notes Preview

```
AncestorTree v3.0.0 — Nhà thờ họ

Bước đột phá từ "công cụ quản lý" sang "không gian văn hóa dòng họ":

✅ Trang Hội đồng gia tộc — giới thiệu ban quản trị dòng họ
✅ Đăng ký thành viên trực tuyến — con cháu xa ghi danh không cần tài khoản
✅ Trang Nhà thờ họ — gallery, lịch tế lễ, bản đồ
✅ Tìm kiếm thông minh — Fuse.js fuzzy search, tolerant diacritics
✅ SEO nâng cao — sitemap, Open Graph, Twitter Cards

18 sprints, 21 tables, 80+ pages, 0$/tháng.
```

---

*SDLC Framework 6.1.1 - Stage 04 Build*
