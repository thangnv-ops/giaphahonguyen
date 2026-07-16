---
project: AncestorTree
path: docs/01-planning/roadmap.md
type: planning
version: 3.1.0
updated: 2026-03-09
owner: "@pm"
status: approved
---

# Project Roadmap

## 0. What Actually Happened

> **Planned:** 7 sprints over 6 weeks (Feb 24 – Apr 4, 2026)
> **Actual: 11 sprints in 3 days.**

| Phase | When | What |
| --- | --- | --- |
| **MVP (Sprint 1–3)** | Tối 24/02/2026 | Foundation + Auth + People CRUD + Interactive Tree + Deploy |
| **Enhanced (Sprint 4–6)** | Đêm 24/02/2026 | Directory + Lunar Calendar + Contributions + Culture modules |
| **Sprint 7 — Cầu đương** | Rạng sáng 25/02 | Lịch cúng lễ xoay vòng, thuật toán DFS |
| **Sprint 7.5** | Sáng 25/02/2026 | Family Relations UX + Tree hierarchical + Tree-scoped editor |
| **Test + Ship** | Chiều–tối 25/02 | QA, code review, hotfix, deploy Vercel, ship to community |
| **Sprint 8 — Local Dev + Security** | 26/02/2026 | Supabase CLI + Docker local mode + RLS hardening |
| **Sprint 9 — Desktop** | 26/02/2026 | Electron + sql.js standalone app (Phase 1-3 complete) |
| **Sprint 10 — Landing Page** | 26–27/02/2026 | Public landing page + community funnel + download links |
| **Sprint 11 — Kho tài liệu + Help** | 27/02/2026 | In-App Help page + Document repository (library + admin CRUD) |

**Tổng cộng:** ~40 giờ build · 1 người · 8 AI agents · TinySDLC methodology

> **v2.5.0 hoàn thành.** Phần bên dưới bao gồm kế hoạch ban đầu (planned vs actual) + roadmap tương lai cho cộng đồng đóng góp.

---

## 1. Release Overview

```
 2026
 ─────────────────────────────────────────────────────────────────────────
 Feb                    Mar                    Apr
 ├─────────────────────┼─────────────────────┼────
 │                     │                     │
 │  ┌─────────────┐    │  ┌─────────────┐    │  ┌─────────────┐
 │  │   v0.1.0    │    │  │   v1.0.0    │    │  │   v1.3.0    │
 │  │   Alpha     │    │  │    MVP      │    │  │   Culture   │
 │  │  (Sprint 1) │    │  │ (Sprint 2-3)│    │  │  (Sprint 6) │
 │  └─────────────┘    │  └─────────────┘    │  └─────────────┘
 │                     │                     │
 │               ┌─────────────┐  ┌─────────────┐
 │               │   v1.1.0    │  │   v1.2.0    │
 │               │  Enhanced   │  │   Release   │
 │               │ (Sprint 4)  │  │  (Sprint 5) │
 │               └─────────────┘  └─────────────┘
 │                     │                     │
 └─────────────────────┴─────────────────────┴────
```

---

## 2. Version Milestones

### v0.1.0 - Alpha (Sprint 1)

**Target:** Week 1-2 (Late Feb 2026)
**Goal:** Core infrastructure + basic tree view

| Epic | Stories | Priority |
|------|---------|----------|
| **Infrastructure** | Setup Next.js, Supabase, Vercel | P0 |
| **Data Model** | Create tables, seed data | P0 |
| **Tree View** | Basic tree rendering | P0 |
| **Auth** | Login/Register | P0 |

**Exit Criteria:**
- [ ] Project scaffolding complete
- [ ] Database schema created
- [ ] Basic tree renders with mock data
- [ ] Auth flow works

---

### v1.0.0 - MVP (Sprint 2-3)

**Target:** Week 3-4 (Early Mar 2026)
**Goal:** Production-ready for Chi tộc Đặng Đình

| Epic | Stories | Priority |
|------|---------|----------|
| **People Management** | CRUD operations | P0 |
| **Family Relationships** | Link parents/children | P0 |
| **Tree View** | Zoom, pan, collapse | P0 |
| **Search** | Find by name | P0 |
| **Admin Panel** | User management | P0 |
| **Mobile** | Responsive design | P0 |
| **Deploy** | Production on Vercel | P0 |

**Exit Criteria:**
- [ ] Full CRUD for people and families
- [ ] Interactive tree with 5+ generations
- [ ] Admin can manage users
- [ ] Mobile responsive
- [ ] Production deployed
- [ ] Documentation complete

---

### v1.1.0 - Enhanced (Sprint 4)

**Target:** Week 4 (Mar 17-21, 2026)
**Goal:** Directory + Memorial calendar + Contributions

| Epic | Stories | Priority |
|------|---------|----------|
| **Directory** | Contact list with privacy controls | P1 |
| **Memorial Calendar** | Âm lịch, ngày giỗ tracking | P1 |
| **Lunar Calendar** | Solar-lunar conversion utility | P1 |
| **Contributions** | Viewer suggest edits, admin review | P1 |

**Exit Criteria:**
- [ ] Directory shows contacts with privacy settings
- [ ] Memorial calendar displays giỗ dates
- [ ] Lunar dates convert correctly
- [ ] Contribution approve/reject workflow works

---

### v1.2.0 - Release (Sprint 5)

**Target:** Week 5 (Mar 24-28, 2026)
**Goal:** GEDCOM export + Book generator + Final polish

| Epic | Stories | Priority |
|------|---------|----------|
| **GEDCOM Export** | Export valid GEDCOM file | P1 |
| **Book Generator** | Formatted genealogy book view | P1 |
| **Photo Upload** | Media upload & gallery | P1 |
| **Performance** | Lighthouse >90, SEO, polish | P1 |

**Exit Criteria:**
- [ ] GEDCOM exports valid file
- [ ] Book view renders correctly
- [ ] Photos upload & display
- [ ] Lighthouse >90 all categories

---

### v1.3.0 - Culture & Community (Sprint 6)

**Target:** Week 6 (Mar 31 - Apr 4, 2026)
**Goal:** Achievement honors + Education fund + Family charter

| Epic | Stories | Priority |
|------|---------|----------|
| **Achievement Honors** | Vinh danh thành tích (FR-1201~1206) | P1 |
| **Education Fund** | Quỹ khuyến học, học bổng (FR-1301~1308) | P1 |
| **Family Charter** | Hương ước gia tộc (FR-1401~1406) | P1 |

**Exit Criteria:**
- [ ] Achievements display with category filters
- [ ] Fund dashboard shows balance and transactions
- [ ] Scholarships can be created, approved, and paid
- [ ] Charter articles display with category tabs
- [ ] Admin can manage all new content

> **Note:** Detailed Sprint 4-6 task breakdown available in [SPRINT-PLAN.md](../04-build/SPRINT-PLAN.md)

---

### v1.4.0 - Ceremony (Sprint 7)

**Target:** Feb 25, 2026 (actual)
**Goal:** Lịch Cầu đương — phân công xoay vòng chủ lễ

| Epic | Stories | Priority |
|------|---------|----------|
| **Cầu đương DB** | Tables: cau_duong_pools, cau_duong_assignments + RLS | P1 |
| **DFS Algorithm** | `buildDFSOrder` — trật tự xoay vòng theo cây gia phả | P1 |
| **Public View** | Lịch phân công 4 lễ/năm với status badge | P1 |
| **Admin Panel** | Tạo pool, phân công tự động, ủy quyền, đổi ngày | P1 |

**Exit Criteria:**
- [ ] Admin tạo được nhóm Cầu đương với cấu hình đời/tuổi
- [ ] Danh sách thành viên đúng theo DFS preorder
- [ ] Viewer xem lịch phân công 4 lễ/năm
- [ ] Ủy quyền + đổi ngày hoạt động

---

### v1.5.0 - Relations (Sprint 7.5)

**Target:** Feb 25, 2026 (actual, same day as Sprint 7)
**Goal:** Cải thiện UX quan hệ gia đình + Tree layout phân nhánh + Tree-scoped editor

| Epic | Stories | Priority |
|------|---------|----------|
| **FamilyRelationsCard** | Hiển thị bố/mẹ/anh-chị-em/vợ-chồng/con + AddRelationDialog | P1 |
| **Tree hierarchical layout** | Bottom-up subtree width → top-down X assignment | P1 |
| **Branch filter** | `?root=<id>` URL state + DFS from root | P1 |
| **Tree-scoped editor** | `edit_root_person_id` + `is_person_in_subtree()` RLS | P1 |
| **Admin UI** | TreeMappingDialog (linked_person + edit scope) | P1 |

**Exit Criteria:**
- [ ] `/people/[id]` hiển thị FamilyRelationsCard với add relation dialog
- [ ] `/people/new` chọn được bố/mẹ (auto-fill generation)
- [ ] `/tree` hiển thị hierarchical layout + lọc theo nhánh
- [ ] `/admin/users` TreeMappingDialog hoạt động
- [ ] `sprint75-migration.sql` deployed sạch

---

### v1.6.0 - Local Development (Sprint 8)

**Target:** Feb 26, 2026
**Goal:** Chạy app offline không cần tài khoản Supabase/Vercel

| Epic | Stories | Priority |
|------|---------|----------|
| **Supabase CLI** | config.toml + migrations + seed.sql | P1 |
| **Setup Script** | `scripts/local-setup.mjs` (cross-platform Node.js) | P1 |
| **Demo Data** | 15-20 thành viên, 4-5 đời, admin account | P1 |
| **Documentation** | LOCAL-DEVELOPMENT.md + README update | P1 |

**Exit Criteria:**

- [x] `pnpm local:setup` khởi chạy Docker containers + tạo `.env.local`
- [x] Login `admin@giapha.local` / `admin123` thành công
- [x] Demo family tree hiển thị đúng
- [x] `pnpm build` vẫn pass (cloud mode không ảnh hưởng)

---

### v1.7.0 - Security Hardening (Sprint 8 Part B)

**Target:** Feb 26, 2026 (actual)
**Goal:** Vá lỗ hổng bảo mật dữ liệu cá nhân

| Epic | Stories | Priority |
|------|---------|----------|
| **Middleware** | Rename proxy.ts → middleware.ts, protect all (main) routes | P0 |
| **RLS Hardening** | profiles auth-only, contact fields stripped, privacy defaults | P0 |
| **Password Policy** | Minimum 8 characters | P1 |

**Exit Criteria:**

- [x] Middleware chạy đúng, bảo vệ tất cả route `(main)/`
- [x] Supabase REST API không trả về contact data khi chưa đăng nhập
- [x] `privacy_level` mặc định `1` cho thành viên mới

---

### v2.0.0 - Desktop App (Sprint 9)

**Target:** Feb 26, 2026 (actual)
**Goal:** Bản cài đặt offline cho thành viên phi kỹ thuật

| Epic | Stories | Priority |
|------|---------|----------|
| **Electron Shell** | BrowserWindow, server spawner, preload | P1 |
| **sql.js Shim** | Supabase Client → SQLite (79 functions unchanged) | P1 |
| **Desktop DB API** | query-builder, type-coerce, rpc-handlers, error-mapper | P1 |
| **Build Targets** | macOS .dmg, Windows .exe (NSIS), Linux .AppImage | P1 |
| **First-run Wizard** | Tên dòng họ + admin + import | P1 |
| **ZIP Export/Import** | Data + media portability | P1 |

**Exit Criteria:**

- [x] Electron app launches, sql.js WASM loads
- [x] Desktop DB API (6 files) handles all queries
- [x] Build targets configured (mac/win/linux)
- [x] First-run wizard + ZIP export/import working
- [x] `pnpm build` (web mode) unaffected

---

### v2.1.0 - Landing Page (Sprint 10)

**Target:** Feb 26, 2026+
**Goal:** Public landing page tại `ancestortree.info`

| Epic | Stories | Priority |
|------|---------|----------|
| **Landing Page** | 7-section public page (hero, features, download, community) | P1 |
| **SEO** | Canonical URL, robots.txt, OG metadata | P1 |
| **Community Funnel** | GitHub Issues templates (bug report, feature request) | P1 |
| **Download Links** | Desktop app → GitHub Releases (.dmg, .exe) | P1 |
| **Community Docs** | Update all 8 posts from v1.5.0 → v2.1.0 | P1 |

**Exit Criteria:**

- [x] `/welcome` loads without login — 9 sections + user guide + FAQ
- [x] Download links to GitHub Releases (.exe, .dmg)
- [x] Community links to GitHub Issues/Discussions
- [x] SEO: canonical URL (`ancestortree.info`) + robots.txt
- [x] 8 community docs at v2.1.0

---

### v2.2.0 - Kho tài liệu (Sprint 11)

**Target:** Community contribution / Owner has time
**Goal:** Lưu trữ tài liệu, ảnh cũ, giấy tờ, video — kho lưu giữ ký ức dòng họ

| Epic | Stories | Priority |
|------|---------|----------|
| **In-App Help** | `/help` — Hướng dẫn sử dụng chi tiết (5 sections, Desktop conditional) | P1 |
| **DB Schema** | Bảng `documents` (title, category, file_url, uploaded_by, tags) + RLS | P1 |
| **Upload/Storage** | Supabase Storage bucket `documents/`, max 10MB/file | P1 |
| **Categories** | Ảnh lịch sử, Giấy tờ, Bản đồ, Video, Bài viết, Khác | P1 |
| **Public View** | Gallery view + filter by category, search by title | P1 |
| **Admin Panel** | CRUD documents, approve uploads, manage categories | P1 |
| **Member Tags** | Gắn thẻ thành viên liên quan trong tài liệu | P2 |
| **Desktop Support** | SQLite table + shim cho desktop mode | P1 |

**Exit Criteria:**

- [x] `/help` page with 5 sections (điều hướng, workflow, phân quyền, mẹo, FAQ)
- [x] Upload/download tài liệu hoạt động (ảnh, PDF, video link)
- [x] Gallery view với filter theo category
- [x] Admin duyệt/quản lý tài liệu
- [x] Desktop mode hỗ trợ đầy đủ
- [x] `pnpm build` passes (36 routes, 0 errors)

**Ước lượng:** ~4-6 giờ (theo pattern Sprint 6 — module mới với CRUD)

---

### v2.4.1 - Bảo mật & Xác nhận thành viên (Sprint 12) ✅

**Target:** Community contribution / Owner has time
**Goal:** Tăng cường bảo mật, xác nhận email & thành viên, sub-admin, MFA, Docker, bulk actions

| Epic | Stories | Priority |
|------|---------|----------|
| **Privacy & Verification** | is_verified, pending-verification, middleware enforcement | P0 |
| **MFA** | TOTP-based via Supabase MFA API | P1 |
| **Profile Settings** | Hồ sơ tài khoản, đổi avatar | P1 |
| **Backup & Restore** | Admin backup/restore ZIP, auto-schedule | P1 |
| **Docker** | docker-compose.yml, Dockerfile, health check | P1 |
| **Bulk Admin** | Checkbox selection + bulk verify/suspend/delete | P1 |

**Exit Criteria:**

- [x] Login khi is_verified=false → redirect /pending-verification
- [x] MFA enroll/verify/unenroll hoạt động
- [x] Backup/restore ZIP hoạt động
- [x] Docker deployment hoạt động
- [x] Bulk admin actions hoạt động
- [x] `pnpm build` passes

---

### v2.5.0 - Cộng đồng & Nâng cao (Sprint 13–18) ✅

**Status:** Done (2026-03-09)
**Goal:** Góc giao lưu, tìm kiếm & thống kê, GEDCOM 7.0, thông báo, export/import, nhà thờ họ, SEO

| Epic | Tính năng | Sprint |
|------|-----------|--------|
| **Góc giao lưu** | Feed bài viết, bình luận, thả tim, upload ảnh, moderation | S15 |
| **Tìm quan hệ** | BFS pathfinding + Vietnamese relationship labels | S13 |
| **Thống kê** | Dashboard biểu đồ (Recharts) + PDF export (beta) | S13 |
| **GEDCOM 7.0** | Export nâng cấp + Vietnamese extensions (Quá Kế) | S14 |
| **Phát hiện trùng lặp** | Levenshtein + Vietnamese NFD + admin review queue | S14 |
| **Chế độ người cao tuổi** | Font size toggle + simplified list view | S14 |
| **Thông báo** | Bell icon + 6 loại + DB triggers (trigger-only insert) | S16 |
| **GEDCOM Import** | Parse .ged 5.5.1/7.0 → tạo people + families | S17 |
| **CSV/Markdown Export** | Xuất danh sách thành viên ra CSV/Markdown | S17 |
| **Hội đồng gia tộc** | `/council` — ban quản trị, lịch sử, sứ mệnh (public) | S18 |
| **Nhà thờ họ** | `/ancestral-hall` — gallery, lịch tế lễ, OpenStreetMap | S18 |
| **Đăng ký thành viên** | `/register-member` — form + honeypot + rate limit | S18 |
| **Fuzzy Search** | Fuse.js diacritics-tolerant search | S18 |
| **SEO** | sitemap.ts, Open Graph, robots.txt cho 4 trang public | S18 |

**Exit Criteria:** ✅ Tất cả đạt · `pnpm build` passes

---

### v2.6.0+ - Cộng đồng mở rộng (Future)

**Target:** Q2-Q3 2026
**Goal:** Mở rộng cho cộng đồng — đa ngôn ngữ, AI, liên kết dòng họ

| Epic | Stories | Priority |
|------|---------|----------|
| **Đa ngôn ngữ** | English UI cho Việt kiều (i18n next-intl) | P2 |
| **AI Search / Hỏi đáp** | NLP tìm kiếm + hỏi đáp về gia phả | P2 |
| **Radial Tree** | Cây tròn polar transform (không D3.js) | P2 |
| **Email Notifications** | Nhắc ngày giỗ qua email (Edge Functions + Resend) | P2 |
| **Cross-clan** | Kết nối liên dòng họ, shared events | P3 |
| **Multi-tenant** | Nhiều dòng họ trên 1 instance | P3 |
| **PWA Mobile** | Progressive Web App cho điện thoại | P2 |
| **Native Apps** | iOS/Android (React Native) | P3 |

---

## 3. Sprint Plan

### Sprint 1: Foundation (5 days)

**Dates:** Feb 24 - Feb 28, 2026
**Goal:** Project setup + core data layer

| Day | Tasks | Owner |
|-----|-------|-------|
| **Day 1** | Project scaffolding (Next.js, TypeScript, Tailwind) | @dev |
| **Day 2** | Supabase setup (tables, RLS, seed data) | @dev |
| **Day 3** | Auth flow (login, register, roles) | @dev |
| **Day 4** | Tree layout algorithm | @dev |
| **Day 5** | Basic tree component | @dev |

**Sprint 1 Deliverables:**
- [ ] Next.js 15 project with TypeScript
- [ ] Supabase project with schema
- [ ] Auth working (admin/viewer)
- [ ] Basic tree renders

---

### Sprint 2: Core Features (5 days)

**Dates:** Mar 3 - Mar 7, 2026
**Goal:** People CRUD + Interactive tree

| Day | Tasks | Owner |
|-----|-------|-------|
| **Day 1** | People list page | @dev |
| **Day 2** | People detail/edit page | @dev |
| **Day 3** | Family relationships UI | @dev |
| **Day 4** | Tree interactivity (zoom, pan, collapse) | @dev |
| **Day 5** | Search functionality | @dev |

**Sprint 2 Deliverables:**
- [ ] CRUD for people
- [ ] Family relationship management
- [ ] Interactive tree view
- [ ] Search by name

---

### Sprint 3: Polish & Deploy (5 days)

**Dates:** Mar 10 - Mar 14, 2026
**Goal:** Production-ready MVP

| Day | Tasks | Owner |
|-----|-------|-------|
| **Day 1** | Admin panel (user management) | @dev |
| **Day 2** | Mobile responsive | @dev |
| **Day 3** | Performance optimization | @dev |
| **Day 4** | Documentation + README | @pm |
| **Day 5** | Deploy to production | @dev |

**Sprint 3 Deliverables:**
- [ ] Admin panel complete
- [ ] Mobile tested
- [ ] Performance optimized
- [ ] Documentation complete
- [ ] Production live

---

## 4. Resource Allocation

### Team

| Role | Allocation | Responsibilities |
|------|------------|------------------|
| **@pm** | 20% | Planning, documentation, review |
| **@dev** | 70% | Implementation |
| **@researcher** | 10% | Research, analysis |

### Infrastructure

| Resource | Provider | Cost |
|----------|----------|------|
| **Database** | Supabase Free | $0 |
| **Hosting** | Vercel Hobby | $0 |
| **Domain** | Optional | ~$10/year |
| **Total** | | **~$0/month** |

---

## 5. Dependencies & Risks

### Dependencies

| ID | Dependency | Impact | Status |
|----|------------|--------|--------|
| **D-01** | Supabase account | Blocking | ⏳ Pending |
| **D-02** | Vercel account | Blocking | ⏳ Pending |
| **D-03** | Initial data (gia phả) | Blocking | ⏳ Pending |
| **D-04** | Domain (optional) | Non-blocking | ⏳ Pending |

### Risks

| ID | Risk | Mitigation |
|----|------|------------|
| **R-01** | Data not ready | Start with sample data |
| **R-02** | Scope creep | Strict MVP definition |
| **R-03** | Free tier limits | Monitor usage |

---

## 6. Success Metrics

### Sprint 1

| Metric | Target |
|--------|--------|
| Setup complete | 100% |
| Basic tree renders | Yes |
| Auth works | Yes |

### Sprint 2

| Metric | Target |
|--------|--------|
| CRUD functional | 100% |
| Tree interactive | Yes |
| Search works | Yes |

### Sprint 3

| Metric | Target |
|--------|--------|
| Mobile responsive | 100% |
| Lighthouse score | >90 |
| Production deployed | Yes |
| Documentation | Complete |

### Sprint 4-6

| Metric | Target |
|--------|--------|
| Lunar dates correct | Yes |
| Contribution workflow | Complete |
| GEDCOM exports valid | Yes |
| Achievements with filters | Yes |
| Fund dashboard with balance | Yes |
| Charter articles with tabs | Yes |
| pnpm build passes | Yes |

### Sprint 8

| Metric | Target |
|--------|--------|
| `pnpm local:setup` works | Yes |
| Login with demo account | Yes |
| Demo family tree renders | Yes |
| Cloud mode unaffected | Yes |

### Sprint 9 — Desktop App

| Metric | Target |
|--------|--------|
| Electron launches + BrowserWindow renders | Yes |
| sql.js WASM loads in standalone mode | Yes |
| Desktop DB API (6 files) operational | Yes |
| Build targets (mac/win/linux) configured | Yes |
| First-run wizard works | Yes |
| ZIP export/import works | Yes |
| Web build (`pnpm build`) unaffected | Yes |

### Sprint 10 — Landing Page ✅

| Metric | Target | Actual |
| -------- | -------- | -------- |
| `/welcome` loads without login | Yes | ✅ 9 sections |
| Download links → GitHub Releases | Yes | ✅ .exe + .dmg |
| Community links → GitHub Issues/Discussions | Yes | ✅ |
| SEO: canonical URL + robots.txt | Yes | ✅ ancestortree.info |
| Mobile responsive (375px, 768px, 1024px) | Yes | ✅ |
| Community docs updated to v2.1.0 | Yes | ✅ 8 files |
| `pnpm build` passes | Yes | ✅ |

### Sprint 11+ — Future Milestones

| Sprint | Version | Feature | Metric |
| -------- | --------- | --------- | -------- |
| 11 | v2.2.0 | Kho tài liệu | Upload/download + gallery + admin ✅ |
| 12 | v2.4.1 | Bảo mật & Xác nhận | Verification + MFA + Backup + Docker + Bulk ✅ |
| 13–18 | v2.5.0 | Cộng đồng & Nâng cao | Feed + Search + GEDCOM 7.0 + Notifications + Nhà thờ họ + SEO ✅ |

---

## 7. Communication Plan

### Meetings

| Meeting | Frequency | Participants |
|---------|-----------|--------------|
| **Sprint Planning** | Per sprint | @pm, @dev |
| **Daily Standup** | Daily | @pm, @dev |
| **Sprint Review** | Per sprint | @pm, @dev, Sponsor |

### Reporting

| Report | Frequency | Audience |
|--------|-----------|----------|
| **Sprint Status** | Weekly | Sponsor |
| **Progress Update** | Daily | Team |

---

## 8. Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Sponsor | Chủ tịch HĐGT | | ⏳ Pending |
| PM | @pm | 2026-02-24 | ✅ Approved |

---

**Previous:** [BRD.md](./BRD.md)
**Next:** [02-design/technical-design.md](../02-design/technical-design.md)

*SDLC Framework 6.1.1 - Stage 01 Planning*
