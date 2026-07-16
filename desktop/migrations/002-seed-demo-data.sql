-- ═══════════════════════════════════════════════════════════════════════════
-- AncestorTree Desktop — Demo Seed Data
-- 18 thành viên, 5 đời, 5 gia đình, sự kiện, thành tích, hương ước
-- Mirrors frontend/supabase/seed.sql for desktop SQLite
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── People (Đời 1–5, 18 thành viên) ─────────────────────────────────────

-- Đời 1: Thủy tổ
INSERT OR IGNORE INTO people (id, handle, display_name, first_name, surname, gender, generation, is_living, birth_year, death_year, death_lunar, biography, privacy_level, is_patrilineal) VALUES
('bbbbbbbb-0001-4000-b000-000000000001', 'dang-van-thuy-to', 'Đặng Văn Thủy Tổ', 'Thủy Tổ', 'Đặng', 1, 1, 0, 1850, 1920, '12/3', 'Thủy tổ dòng họ Đặng làng Kỷ Các.', 0, 1),
('bbbbbbbb-0002-4000-b000-000000000002', 'nguyen-thi-tu', 'Nguyễn Thị Từ', 'Từ', 'Nguyễn', 2, 1, 0, 1855, 1935, '8/7', 'Vợ cụ Thủy Tổ.', 0, 0);

-- Đời 2: 3 con + 2 dâu
INSERT OR IGNORE INTO people (id, handle, display_name, first_name, surname, gender, generation, is_living, birth_year, death_year, death_lunar, biography, privacy_level, is_patrilineal) VALUES
('bbbbbbbb-0011-4000-b000-000000000011', 'dang-van-nhat', 'Đặng Văn Nhất', 'Nhất', 'Đặng', 1, 2, 0, 1880, 1950, '15/1', 'Con trưởng.', 0, 1),
('bbbbbbbb-0012-4000-b000-000000000012', 'tran-thi-lan', 'Trần Thị Lan', 'Lan', 'Trần', 2, 2, 0, 1885, 1960, '20/9', 'Vợ ông Nhất.', 0, 0),
('bbbbbbbb-0013-4000-b000-000000000013', 'dang-van-nhi', 'Đặng Văn Nhị', 'Nhị', 'Đặng', 1, 2, 0, 1883, 1955, '5/11', 'Con thứ.', 0, 1),
('bbbbbbbb-0014-4000-b000-000000000014', 'le-thi-mai', 'Lê Thị Mai', 'Mai', 'Lê', 2, 2, 0, 1888, 1965, '22/4', 'Vợ ông Nhị.', 0, 0),
('bbbbbbbb-0015-4000-b000-000000000015', 'dang-thi-ba', 'Đặng Thị Ba', 'Ba', 'Đặng', 2, 2, 0, 1886, 1970, '3/6', 'Con gái út.', 0, 1);

-- Đời 3: 4 cháu
INSERT OR IGNORE INTO people (id, handle, display_name, first_name, surname, gender, generation, is_living, birth_year, death_year, death_lunar, biography, privacy_level, is_patrilineal) VALUES
('bbbbbbbb-0021-4000-b000-000000000021', 'dang-van-tai', 'Đặng Văn Tài', 'Tài', 'Đặng', 1, 3, 0, 1910, 1980, '18/2', 'Cháu trưởng.', 0, 1),
('bbbbbbbb-0022-4000-b000-000000000022', 'pham-thi-hoa', 'Phạm Thị Hoa', 'Hoa', 'Phạm', 2, 3, 0, 1915, 1990, '7/10', 'Vợ ông Tài.', 0, 0),
('bbbbbbbb-0023-4000-b000-000000000023', 'dang-thi-lien', 'Đặng Thị Liên', 'Liên', 'Đặng', 2, 3, 0, 1912, 1985, '25/8', 'Con gái ông Nhất.', 0, 1),
('bbbbbbbb-0024-4000-b000-000000000024', 'dang-van-duc', 'Đặng Văn Đức', 'Đức', 'Đặng', 1, 3, 0, 1915, 1988, '10/5', 'Con ông Nhị.', 0, 1);

-- Đời 4: 4 chắt (còn sống)
INSERT OR IGNORE INTO people (id, handle, display_name, first_name, surname, gender, generation, is_living, birth_year, biography, privacy_level, is_patrilineal) VALUES
('bbbbbbbb-0031-4000-b000-000000000031', 'dang-van-minh', 'Đặng Văn Minh', 'Minh', 'Đặng', 1, 4, 1, 1945, 'Trưởng nam đời 4.', 0, 1),
('bbbbbbbb-0032-4000-b000-000000000032', 'nguyen-thi-hang', 'Nguyễn Thị Hằng', 'Hằng', 'Nguyễn', 2, 4, 1, 1948, 'Vợ ông Minh.', 0, 0),
('bbbbbbbb-0033-4000-b000-000000000033', 'dang-van-hung', 'Đặng Văn Hùng', 'Hùng', 'Đặng', 1, 4, 1, 1950, 'Con thứ ông Tài.', 0, 1),
('bbbbbbbb-0034-4000-b000-000000000034', 'dang-thi-phuong', 'Đặng Thị Phượng', 'Phượng', 'Đặng', 2, 4, 1, 1947, 'Con gái ông Đức.', 0, 1);

-- Đời 5: 3 chút (còn sống)
INSERT OR IGNORE INTO people (id, handle, display_name, first_name, surname, gender, generation, is_living, birth_year, biography, privacy_level, is_patrilineal, occupation) VALUES
('bbbbbbbb-0041-4000-b000-000000000041', 'dang-van-an', 'Đặng Văn An', 'An', 'Đặng', 1, 5, 1, 1975, 'Con ông Minh. Kỹ sư CNTT.', 0, 1, 'Kỹ sư phần mềm'),
('bbbbbbbb-0042-4000-b000-000000000042', 'dang-thi-binh', 'Đặng Thị Bình', 'Bình', 'Đặng', 2, 5, 1, 1978, 'Con gái ông Minh.', 0, 1, 'Giáo viên'),
('bbbbbbbb-0043-4000-b000-000000000043', 'dang-van-cuong', 'Đặng Văn Cường', 'Cường', 'Đặng', 1, 5, 1, 1980, 'Con ông Hùng.', 0, 1, 'Bác sĩ');

-- ─── Families ─────────────────────────────────────────────────────────────

INSERT OR IGNORE INTO families (id, handle, father_id, mother_id, marriage_date, sort_order) VALUES
('cccccccc-0001-4000-c000-000000000001', 'thuy-to-tu', 'bbbbbbbb-0001-4000-b000-000000000001', 'bbbbbbbb-0002-4000-b000-000000000002', '1878', 1),
('cccccccc-0002-4000-c000-000000000002', 'nhat-lan', 'bbbbbbbb-0011-4000-b000-000000000011', 'bbbbbbbb-0012-4000-b000-000000000012', '1908', 1),
('cccccccc-0003-4000-c000-000000000003', 'nhi-mai', 'bbbbbbbb-0013-4000-b000-000000000013', 'bbbbbbbb-0014-4000-b000-000000000014', '1912', 2),
('cccccccc-0004-4000-c000-000000000004', 'tai-hoa', 'bbbbbbbb-0021-4000-b000-000000000021', 'bbbbbbbb-0022-4000-b000-000000000022', '1938', 1),
('cccccccc-0005-4000-c000-000000000005', 'minh-hang', 'bbbbbbbb-0031-4000-b000-000000000031', 'bbbbbbbb-0032-4000-b000-000000000032', '1970', 1);

-- ─── Children ─────────────────────────────────────────────────────────────

INSERT OR IGNORE INTO children (id, family_id, person_id, sort_order) VALUES
-- Đời 1 → Đời 2 (3 con)
('dddddddd-0001-4000-d000-000000000001', 'cccccccc-0001-4000-c000-000000000001', 'bbbbbbbb-0011-4000-b000-000000000011', 1),
('dddddddd-0002-4000-d000-000000000002', 'cccccccc-0001-4000-c000-000000000001', 'bbbbbbbb-0013-4000-b000-000000000013', 2),
('dddddddd-0003-4000-d000-000000000003', 'cccccccc-0001-4000-c000-000000000001', 'bbbbbbbb-0015-4000-b000-000000000015', 3),
-- Đời 2 (Nhất + Lan) → Đời 3 (2 con)
('dddddddd-0004-4000-d000-000000000004', 'cccccccc-0002-4000-c000-000000000002', 'bbbbbbbb-0021-4000-b000-000000000021', 1),
('dddddddd-0005-4000-d000-000000000005', 'cccccccc-0002-4000-c000-000000000002', 'bbbbbbbb-0023-4000-b000-000000000023', 2),
-- Đời 2 (Nhị + Mai) → Đời 3 (1 con)
('dddddddd-0006-4000-d000-000000000006', 'cccccccc-0003-4000-c000-000000000003', 'bbbbbbbb-0024-4000-b000-000000000024', 1),
-- Đời 3 (Tài + Hoa) → Đời 4 (2 con)
('dddddddd-0007-4000-d000-000000000007', 'cccccccc-0004-4000-c000-000000000004', 'bbbbbbbb-0031-4000-b000-000000000031', 1),
('dddddddd-0008-4000-d000-000000000008', 'cccccccc-0004-4000-c000-000000000004', 'bbbbbbbb-0033-4000-b000-000000000033', 2),
-- Đời 4 (Minh + Hằng) → Đời 5 (2 con)
('dddddddd-0009-4000-d000-000000000009', 'cccccccc-0005-4000-c000-000000000005', 'bbbbbbbb-0041-4000-b000-000000000041', 1),
('dddddddd-0010-4000-d000-000000000010', 'cccccccc-0005-4000-c000-000000000005', 'bbbbbbbb-0042-4000-b000-000000000042', 2);

-- ─── Events (Ngày giỗ & Lễ) ──────────────────────────────────────────────

INSERT OR IGNORE INTO events (id, title, event_type, event_lunar, person_id, recurring, location) VALUES
('eeeeeeee-0001-4000-e000-000000000001', 'Giỗ Cụ Thủy Tổ', 'gio', '12/3', 'bbbbbbbb-0001-4000-b000-000000000001', 1, 'Nhà thờ họ'),
('eeeeeeee-0002-4000-e000-000000000002', 'Giỗ Bà Thủy Tổ', 'gio', '8/7', 'bbbbbbbb-0002-4000-b000-000000000002', 1, 'Nhà thờ họ'),
('eeeeeeee-0003-4000-e000-000000000003', 'Giỗ Ông Nhất', 'gio', '15/1', 'bbbbbbbb-0011-4000-b000-000000000011', 1, 'Nhà trưởng'),
('eeeeeeee-0004-4000-e000-000000000004', 'Rằm tháng Bảy', 'le_tet', '15/7', NULL, 1, 'Nhà thờ họ'),
('eeeeeeee-0005-4000-e000-000000000005', 'Tết Nguyên Đán', 'le_tet', '1/1', NULL, 1, 'Nhà thờ họ');

-- ─── Achievements ─────────────────────────────────────────────────────────

INSERT OR IGNORE INTO achievements (id, person_id, title, category, year, description) VALUES
('ffffffff-0001-4000-f000-000000000001', 'bbbbbbbb-0041-4000-b000-000000000041', 'Tốt nghiệp Thạc sĩ CNTT', 'hoc_tap', 2002, 'Đại học Bách Khoa Hà Nội'),
('ffffffff-0002-4000-f000-000000000002', 'bbbbbbbb-0042-4000-b000-000000000042', 'Giáo viên Giỏi cấp Tỉnh', 'su_nghiep', 2015, 'Sở GD&ĐT Hà Tĩnh');

-- ─── Clan Articles (Hương ước) ────────────────────────────────────────────

INSERT OR IGNORE INTO clan_articles (id, title, content, category, sort_order) VALUES
('11111111-0001-4000-1000-000000000001', 'Gia huấn dòng họ', 'Kính trên nhường dưới, giữ gìn nề nếp gia phong. Con cháu phải siêng năng học hành, hiếu thảo với cha mẹ.', 'gia_huan', 1),
('11111111-0002-4000-1000-000000000002', 'Quy ước họp họ', 'Họp họ tổ chức vào ngày Rằm tháng Giêng hàng năm tại nhà thờ họ. Mọi thành viên từ 18 tuổi trở lên đều có quyền tham dự và biểu quyết.', 'quy_uoc', 1);

-- ═══════════════════════════════════════════════════════════════════════════
-- DONE — 18 thành viên, 5 gia đình, 10 con, 5 sự kiện, 2 thành tích, 2 bài viết
-- ═══════════════════════════════════════════════════════════════════════════
