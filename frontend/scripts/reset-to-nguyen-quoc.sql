-- ═══════════════════════════════════════════════════════════════════════════
-- Script: Xóa dữ liệu gia phả cũ và nhập dữ liệu Họ Nguyễn Quốc
-- Chạy trực tiếp trên database đang hoạt động (local hoặc Supabase Cloud)
--
-- CÁCH CHẠY (local):
--   supabase db execute --file frontend/scripts/reset-to-nguyen-quoc.sql
--
-- HOẶC qua psql:
--   psql $DATABASE_URL -f frontend/scripts/reset-to-nguyen-quoc.sql
--
-- LƯU Ý: Script này KHÔNG xóa profiles/auth users, chỉ xóa genealogy data.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─── 1. XÓA DỮ LIỆU CŨ (theo thứ tự phụ thuộc khóa ngoại) ──────────────
DELETE FROM public.children;
DELETE FROM public.families;
DELETE FROM public.events WHERE person_id IS NOT NULL OR event_type IN ('gio', 'hop_ho', 'le_tet');
DELETE FROM public.people;
DELETE FROM public.clan_articles;
-- Giữ nguyên profiles, contributions, achievements, fund_transactions, v.v.

-- ─── 2. CẬP NHẬT CLAN SETTINGS ───────────────────────────────────────────
UPDATE public.clan_settings SET
    clan_name        = 'Họ Nguyễn Quốc',
    clan_full_name   = 'Họ Nguyễn Quốc làng Sa Long, xã Hà Linh, huyện Hương Khê, tỉnh Hà Tĩnh',
    clan_founding_year = 1700,
    clan_origin      = 'Yên Nhân Thôn, Dương Luật xã, Thạch Hà phủ (nay là Thôn Minh Hải, xã Thạch Hải, huyện Thạch Hà, tỉnh Hà Tĩnh)',
    clan_patriarch   = 'Nguyễn Quốc Thắng',
    clan_description = 'Dòng họ Nguyễn Quốc có nguồn gốc từ Thạch Hà, Hà Tĩnh. Từ đầu thế kỷ thứ 18, Thủy tổ Nguyễn Quốc Thắng đến an cư lập nghiệp tại thôn Sa Long, xã Hà Linh, huyện Hương Khê. Đến thế kỷ 21, dòng dõi đã phát triển đến đời thứ 8 với hai cửa họ: Cửa trưởng (nhánh Nguyễn Quốc Trung) và Cửa thứ (nhánh Nguyễn Quốc Chu).',
    updated_at       = NOW()
WHERE id = '00000000-0000-0000-0000-000000000001';

-- ─── 3. NHẬP NGƯỜI (62 thành viên) ───────────────────────────────────────

-- ĐỜI 1: Thủy Tổ
INSERT INTO public.people (id, handle, display_name, first_name, surname, gender, generation, is_living, is_patrilineal, hometown, death_lunar, biography, notes, privacy_level) VALUES
(
    '11111111-0001-4000-b000-000000000001', 'P001', 'Nguyễn Quốc Thắng', 'Thắng', 'Nguyễn', 1, 1, false, true,
    'Thôn Minh Hải, xã Thạch Hải, huyện Thạch Hà, Hà Tĩnh', '7/7',
    'Thủy Tổ dòng họ Nguyễn Quốc (Tự Quốc Thắng). Người đầu tiên đến định cư, khai sáng cơ nghiệp dòng họ tại thôn Sa Long, xã Hà Linh, huyện Hương Khê, Hà Tĩnh. Gốc xưa: Yên Nhân Thôn, Dương Luật xã, Thạch Hà phủ. Không rõ năm sinh năm mất.',
    'Phần mộ song tán chiêu hồn tại xứ Nhà Măn (phía Tây vườn anh Trần Đình Tá). Ngày giỗ: 07/07 Âm lịch.', 0
),
(
    '11111111-0002-4000-b000-000000000002', 'P002', 'Bà Miềng', 'Miềng', NULL, 2, 1, false, false,
    NULL, '7/7',
    'Vợ cụ Thủy Tổ Nguyễn Quốc Thắng. Không rõ họ, quê quán và nghề nghiệp.',
    'Phần mộ song tán chiêu hồn tại xứ Nhà Măn. Ngày giỗ: 07/07 Âm lịch.', 0
);

-- ĐỜI 2
INSERT INTO public.people (id, handle, display_name, first_name, surname, gender, generation, chi, is_living, is_patrilineal, hometown, death_lunar, biography, notes, privacy_level) VALUES
(
    '11111111-0011-4000-b000-000000000011', 'P011', 'Nguyễn Quốc Trung', 'Trung', 'Nguyễn', 1, 2, 1, false, true,
    'Thôn Sa Long, xã Hà Linh, Hương Khê, Hà Tĩnh', NULL,
    'Con trưởng (Anh cả) của Thủy Tổ. Trưởng nhánh Cửa thứ 1 (Cửa trưởng).', NULL, 0
),
(
    '11111111-0012-4000-b000-000000000012', 'P012', 'Nguyễn Quốc Chu', 'Chu', 'Nguyễn', 1, 2, 2, false, true,
    'Xóm Long Thượng, thôn Sa Long, xã Hà Linh, Hương Khê, Hà Tĩnh', '20/4',
    'Con thứ của Thủy Tổ (còn gọi là Nguyễn Quốc Phì / Cố Thu). Trưởng nhánh Cửa thứ 2. Nghề: dạy chữ Hán, bốc thuốc Nam-Bắc, thầy địa lý. Hưởng thọ 70 tuổi. Từng làm công tác tài chính cho cụ Phan Đình Phùng trong phong trào Cần Vương.',
    'Ngày giỗ: 20/04 Âm lịch. Phần mộ táng tại Rú Cố.', 0
),
(
    '11111111-0013-4000-b000-000000000013', 'P013', 'Phan Thị Nhiên', 'Nhiên', 'Phan', 2, 2, 2, false, false,
    'Xóm Long Thượng, thôn Sa Long, xã Hà Linh, Hương Khê, Hà Tĩnh', '10/10',
    'Vợ ông Nguyễn Quốc Chu. Người cửa họ Phan - Hanh trong làng Sa Long.',
    'Ngày giỗ: 10/10 Âm lịch. Phần mộ táng tại Nhà Đắc.', 0
);

-- ĐỜI 3
INSERT INTO public.people (id, handle, display_name, first_name, surname, gender, generation, chi, is_living, is_patrilineal, hometown, death_lunar, biography, notes, privacy_level) VALUES
(
    '11111111-0021-4000-b000-000000000021', 'P021', 'Nguyễn Quốc Diệu', 'Diệu', 'Nguyễn', 1, 3, 1, false, true,
    'Thôn Sa Long, xã Hà Linh, Hương Khê, Hà Tĩnh', NULL,
    'Con của ông Nguyễn Quốc Trung (Cửa trưởng). Thân phụ ông Nguyễn Quốc Mận.', NULL, 0
),
(
    '11111111-0022-4000-b000-000000000022', 'P022', 'Nguyễn Quốc Tiệp', 'Tiệp', 'Nguyễn', 1, 3, 2, false, true,
    'Thôn Sa Long, xã Hà Linh, Hương Khê, Hà Tĩnh', '21/9',
    'Con kế tự của ông Nguyễn Quốc Chu và bà Phan Thị Nhiên. Nghề bốc thuốc Bắc-Nam. Hưởng thọ trên 70 tuổi. Do sự trả thù của giặc Pháp đối với phong trào khởi nghĩa Hương Khê, toàn bộ nhà cửa và tài sản bị đốt phá, cướp sạch.',
    'Ngày giỗ: 21/09 Âm lịch. Phần mộ táng tại Cồn Nhà.', 0
),
(
    '11111111-0023-4000-b000-000000000023', 'P023', 'Nguyễn Quốc San', 'San', 'Nguyễn', 1, 3, 2, false, true,
    'Thôn Sa Long, xã Hà Linh, Hương Khê, Hà Tĩnh', NULL,
    'Con của ông Nguyễn Quốc Chu. Qua đời lúc nhỏ tuổi.', NULL, 0
),
(
    '11111111-0024-4000-b000-000000000024', 'P024', 'Nguyễn Quốc Đức', 'Đức', 'Nguyễn', 1, 3, 2, false, true,
    'Thôn Sa Long, xã Hà Linh, Hương Khê, Hà Tĩnh', NULL,
    'Con của ông Nguyễn Quốc Chu. Qua đời lúc nhỏ tuổi.', NULL, 0
),
(
    '11111111-0025-4000-b000-000000000025', 'P025', 'Nguyễn Quốc Út', 'Út', 'Nguyễn', 1, 3, 2, false, true,
    'Thôn Sa Long, xã Hà Linh, Hương Khê, Hà Tĩnh', NULL,
    'Con của ông Nguyễn Quốc Chu. Qua đời lúc nhỏ tuổi.', NULL, 0
),
(
    '11111111-0026-4000-b000-000000000026', 'P026', 'Nguyễn Thị Ngưỡng', 'Ngưỡng', 'Nguyễn', 2, 3, 2, false, true,
    'Thôn Sa Long, xã Hà Linh, Hương Khê, Hà Tĩnh', NULL,
    'Con gái của ông Nguyễn Quốc Chu. Lấy chồng trong làng, nay hậu duệ không còn ai.', NULL, 0
),
(
    '11111111-0027-4000-b000-000000000027', 'P027', 'Nguyễn Thị Phơn', 'Phơn', 'Nguyễn', 2, 3, 2, false, true,
    'Thôn Sa Long, xã Hà Linh, Hương Khê, Hà Tĩnh', NULL,
    'Con gái của ông Nguyễn Quốc Chu. Lấy chồng trong làng, nay hậu duệ không còn ai.', NULL, 0
),
(
    '11111111-0028-4000-b000-000000000028', 'P028', 'Nguyễn Thị Bá', 'Bá', 'Nguyễn', 2, 3, 2, false, false,
    'Thôn Sa Long, xã Hà Linh, Hương Khê, Hà Tĩnh', '12/10',
    'Vợ ông Nguyễn Quốc Tiệp. Người họ Nguyễn Quang Lương cùng làng Sa Long. Hưởng thọ trên 70 tuổi.',
    'Ngày giỗ: 12/10 Âm lịch. Phần mộ táng tại Xứ Nhà Đắc.', 0
);

-- ĐỜI 4
INSERT INTO public.people (id, handle, display_name, first_name, surname, gender, generation, chi, is_living, is_patrilineal, hometown, birth_year, death_year, death_lunar, biography, notes, privacy_level) VALUES
(
    '11111111-0031-4000-b000-000000000031', 'P031', 'Nguyễn Quốc Mận', 'Mận', 'Nguyễn', 1, 4, 1, false, true,
    'Thôn Sa Long, xã Hà Linh, Hương Khê, Hà Tĩnh', NULL, NULL, NULL,
    'Con của ông Nguyễn Quốc Diệu (Cửa trưởng). Sinh hạ 4 người con (3 nam, 1 nữ): Nguyễn Quốc Thị, Nguyễn Quốc Mỹ, Nguyễn Quốc Thụ, Nguyễn Thị Mai.',
    NULL, 0
),
(
    '11111111-0032-4000-b000-000000000032', 'P032', 'Nguyễn Quốc Phúc', 'Phúc', 'Nguyễn', 1, 4, 2, false, true,
    'Thôn Sa Long, xã Hà Linh, Hương Khê, Hà Tĩnh', 1906, 1934, '29/3',
    'Con duy nhất của ông Nguyễn Quốc Tiệp và bà Nguyễn Thị Bá. Chuyên đi làm thuê, đốt than, bán củi. Tạ thế năm 1934 khi mới 28 tuổi.',
    'Ngày giỗ: 29/03 Âm lịch. Phần mộ táng tại Cồn Nhà.', 0
),
(
    '11111111-0033-4000-b000-000000000033', 'P033', 'Phan Thị Ngoéch Tôn', 'Ngoéch Tôn', 'Phan', 2, 4, 2, false, false,
    'Thôn Sa Long, xã Hà Linh, Hương Khê, Hà Tĩnh', 1918, 1991, '30/10',
    'Vợ ông Nguyễn Quốc Phúc, thường gọi là Cố Loan. Người cửa họ Phan Đình - Căn trong làng. Tạ thế ngày 30/10/1991, hưởng thọ 73 tuổi.',
    'Ngày giỗ: 30/10 Âm lịch. Phần mộ táng tại cồn Mua trên đập Lười, vùng Trường Sơn (xã Hương Vĩnh, Hương Khê).', 0
);

-- ĐỜI 5
INSERT INTO public.people (id, handle, display_name, first_name, surname, gender, generation, chi, is_living, is_patrilineal, hometown, birth_year, birth_date, death_year, death_date, death_lunar, occupation, biography, notes, privacy_level) VALUES
(
    '11111111-0041-4000-b000-000000000041', 'P041', 'Nguyễn Quốc Thị', 'Thị', 'Nguyễn', 1, 5, 1, false, true,
    'Thôn Sa Long, xã Hà Linh, Hương Khê, Hà Tĩnh',
    NULL, NULL, NULL, NULL, NULL, NULL,
    'Con trưởng của ông Nguyễn Quốc Mận (Cửa trưởng). Sinh hạ 3 người con trai: Nguyễn Quốc Uy, Nguyễn Quốc Công, Nguyễn Quốc Ân.',
    NULL, 0
),
(
    '11111111-0042-4000-b000-000000000042', 'P042', 'Nguyễn Quốc Mỹ', 'Mỹ', 'Nguyễn', 1, 5, 1, false, true,
    'Thôn Sa Long, xã Hà Linh, Hương Khê, Hà Tĩnh',
    NULL, NULL, NULL, NULL, NULL, NULL,
    'Con thứ hai của ông Nguyễn Quốc Mận (Cửa trưởng). Sinh hạ 2 người con trai: Nguyễn Quốc Hùng, Nguyễn Quốc Lượng.',
    NULL, 0
),
(
    '11111111-0043-4000-b000-000000000043', 'P043', 'Nguyễn Quốc Thụ', 'Thụ', 'Nguyễn', 1, 5, 1, false, true,
    'Thôn Sa Long, xã Hà Linh, Hương Khê, Hà Tĩnh',
    NULL, NULL, NULL, NULL, NULL, NULL,
    'Con thứ ba của ông Nguyễn Quốc Mận (Cửa trưởng). Sinh hạ 3 người con trai: Nguyễn Quốc Huy, Nguyễn Quốc Đạt, Nguyễn Quốc Sửu.',
    NULL, 0
),
(
    '11111111-0044-4000-b000-000000000044', 'P044', 'Nguyễn Thị Mai', 'Mai', 'Nguyễn', 2, 5, 1, true, true,
    'Thôn Sa Long, xã Hà Linh, Hương Khê, Hà Tĩnh',
    NULL, NULL, NULL, NULL, NULL, NULL,
    'Con gái út của ông Nguyễn Quốc Mận (Cửa trưởng).',
    NULL, 0
),
(
    '11111111-0045-4000-b000-000000000045', 'P045', 'Nguyễn Quốc Lưu', 'Lưu', 'Nguyễn', 1, 5, 2, false, true,
    'Thôn Sa Long, xã Hà Linh, Hương Khê, Hà Tĩnh',
    NULL, NULL, NULL, NULL, NULL, NULL,
    'Con trưởng của ông Nguyễn Quốc Phúc và bà Cố Loan. Mất lúc 2 tuổi, không có hậu duệ.',
    NULL, 0
),
(
    '11111111-0046-4000-b000-000000000046', 'P046', 'Nguyễn Trí Tuệ', 'Trí Tuệ', 'Nguyễn', 1, 5, 2, false, true,
    'Thôn Sa Long, xã Hà Linh, Hương Khê, Hà Tĩnh',
    1932, '1932-06-01', 2025, '2025-08-22', '29/6',
    'Thanh niên xung phong',
    'Tên gốc: Nguyễn Quốc Loan (thủa nhỏ còn gọi là Nguyễn Quốc Vinh). Con thứ hai của ông Nguyễn Quốc Phúc và bà Cố Loan. Năm 1960 chính thức đổi tên thành Nguyễn Trí Tuệ. Tham gia Thanh niên xung phong, dân công hỏa tuyến và công nhân Lâm nghiệp. Qua đời lúc 20h25 ngày 22/08/2025 (29/06 Ất Tỵ), hưởng thọ 95 tuổi.',
    'An táng tại Nghĩa trang thôn 3, xã Cư Prao, huyện M''Drắk, Đắk Lắk. Ngày giỗ: 29/06 Âm lịch.', 0
),
(
    '11111111-0047-4000-b000-000000000047', 'P047', 'Nguyễn Quốc Hiếu', 'Hiếu', 'Nguyễn', 1, 5, 2, false, true,
    'Thôn Sa Long, xã Hà Linh, Hương Khê, Hà Tĩnh',
    NULL, NULL, NULL, NULL, NULL, NULL,
    'Con út của ông Nguyễn Quốc Phúc và bà Cố Loan. Mất lúc 2 tuổi, không có hậu duệ.',
    NULL, 0
),
(
    '11111111-0048-4000-b000-000000000048', 'P048', 'Hồ Thị Lưu', 'Lưu', 'Hồ', 2, 5, 2, false, false,
    NULL,
    NULL, NULL, 1980, NULL, '29/9', NULL,
    'Người vợ thứ nhất của ông Nguyễn Trí Tuệ. Mất ngày 29/09/1980.',
    'Ngày giỗ: 29/09 Âm lịch.', 0
),
(
    '11111111-0049-4000-b000-000000000049', 'P049', 'Phan Thị Lập', 'Lập', 'Phan', 2, 5, 2, true, false,
    NULL,
    NULL, NULL, NULL, NULL, NULL, NULL,
    'Người vợ thứ hai của ông Nguyễn Trí Tuệ.',
    NULL, 0
);

-- ĐỜI 6
INSERT INTO public.people (id, handle, display_name, first_name, surname, gender, generation, chi, is_living, is_patrilineal, birth_year, biography, notes, privacy_level) VALUES
('11111111-0051-4000-b000-000000000051', 'P051', 'Nguyễn Quốc Uy', 'Uy', 'Nguyễn', 1, 6, 1, true, true, NULL, 'Con trưởng của ông Nguyễn Quốc Thị. Sinh ra ông Nguyễn Quốc Dân (Đời 7).', NULL, 0),
('11111111-0052-4000-b000-000000000052', 'P052', 'Nguyễn Quốc Công', 'Công', 'Nguyễn', 1, 6, 1, true, true, NULL, 'Con thứ của ông Nguyễn Quốc Thị. Người lập sơ đồ gia phả năm 2019. Sinh ra Nguyễn Quốc Diện và Nguyễn Quốc Văn (Đời 7).', 'Người lập sơ đồ gia phả ngày 01/05/2019.', 0),
('11111111-0053-4000-b000-000000000053', 'P053', 'Nguyễn Quốc Ân', 'Ân', 'Nguyễn', 1, 6, 1, true, true, NULL, 'Con út của ông Nguyễn Quốc Thị. Sinh ra ông Nguyễn Quốc Nhân (Đời 7).', NULL, 0),
('11111111-0054-4000-b000-000000000054', 'P054', 'Nguyễn Quốc Hùng', 'Hùng', 'Nguyễn', 1, 6, 1, true, true, NULL, 'Con trưởng của ông Nguyễn Quốc Mỹ. Sinh ra ông Nguyễn Quốc Hải (Đời 7).', NULL, 0),
('11111111-0055-4000-b000-000000000055', 'P055', 'Nguyễn Quốc Lượng', 'Lượng', 'Nguyễn', 1, 6, 1, true, true, NULL, 'Con thứ của ông Nguyễn Quốc Mỹ. Sinh ra ông Nguyễn Quốc Toàn (Đời 7).', NULL, 0),
('11111111-0056-4000-b000-000000000056', 'P056', 'Nguyễn Quốc Huy', 'Huy', 'Nguyễn', 1, 6, 1, true, true, NULL, 'Con trưởng của ông Nguyễn Quốc Thụ. Sinh ra ông Nguyễn Quốc Tiến (Đời 7).', NULL, 0),
('11111111-0057-4000-b000-000000000057', 'P057', 'Nguyễn Quốc Đạt', 'Đạt', 'Nguyễn', 1, 6, 1, true, true, NULL, 'Con thứ của ông Nguyễn Quốc Thụ.', NULL, 0),
('11111111-0058-4000-b000-000000000058', 'P058', 'Nguyễn Quốc Sửu', 'Sửu', 'Nguyễn', 1, 6, 1, true, true, NULL, 'Con út của ông Nguyễn Quốc Thụ.', NULL, 0),
('11111111-0059-4000-b000-000000000059', 'P059', 'Nguyễn Quốc Thông', 'Thông', 'Nguyễn', 1, 6, 2, true, true, NULL, 'Con trưởng của ông Nguyễn Trí Tuệ và bà Hồ Thị Lưu. Tên gốc: Thanh. Sinh ra Nguyễn Quốc Tuấn và Nguyễn Quốc Tú (Đời 7).', NULL, 0),
('11111111-0060-4000-b000-000000000060', 'P060', 'Nguyễn Quốc Minh', 'Minh', 'Nguyễn', 1, 6, 2, true, true, NULL, 'Con của ông Nguyễn Trí Tuệ và bà Hồ Thị Lưu. Sinh ra ông Nguyễn Quốc Bảo (Đời 7).', NULL, 0),
('11111111-0061-4000-b000-000000000061', 'P061', 'Nguyễn Quốc Sáng', 'Sáng', 'Nguyễn', 1, 6, 2, true, true, NULL, 'Con của ông Nguyễn Trí Tuệ và bà Hồ Thị Lưu. Sinh ra ông Nguyễn Quốc Hà (Đời 7).', NULL, 0),
('11111111-0062-4000-b000-000000000062', 'P062', 'Nguyễn Quốc Tạo', 'Tạo', 'Nguyễn', 1, 6, 2, true, true, NULL, 'Con của ông Nguyễn Trí Tuệ và bà Hồ Thị Lưu. Sinh ra Nguyễn Lê Quốc Anh và Nguyễn Lê Quốc Đạt (Đời 7).', NULL, 0),
('11111111-0063-4000-b000-000000000063', 'P063', 'Nguyễn Thị Tâm', 'Tâm', 'Nguyễn', 2, 6, 2, true, true, 1977, 'Con gái của ông Nguyễn Trí Tuệ và bà Hồ Thị Lưu. Sinh năm 1977.', NULL, 0),
('11111111-0064-4000-b000-000000000064', 'P064', 'Nguyễn Thị Trí', 'Trí', 'Nguyễn', 2, 6, 2, true, true, 1983, 'Con gái của ông Nguyễn Trí Tuệ và bà Phan Thị Lập. Sinh năm 1983.', NULL, 0),
('11111111-0065-4000-b000-000000000065', 'P065', 'Nguyễn Thị Lễ', 'Lễ', 'Nguyễn', 2, 6, 2, true, true, 1990, 'Con gái của ông Nguyễn Trí Tuệ và bà Phan Thị Lập. Sinh năm 1990.', NULL, 0),
('11111111-0066-4000-b000-000000000066', 'P066', 'Nguyễn Quốc Hồng Lam', 'Hồng Lam', 'Nguyễn', 1, 6, 2, true, true, 1977, 'Con riêng của bà Phan Thị Lập. Sinh năm 1977. Nhập vào họ Nguyễn Quốc năm 2000.', 'Nhập họ Nguyễn Quốc năm 2000.', 0);

-- ĐỜI 7
INSERT INTO public.people (id, handle, display_name, first_name, surname, gender, generation, chi, is_living, is_patrilineal, biography, privacy_level) VALUES
('11111111-0071-4000-b000-000000000071', 'P071', 'Nguyễn Quốc Dân', 'Dân', 'Nguyễn', 1, 7, 1, true, true, 'Con của ông Nguyễn Quốc Uy. Sinh ra con trai Nguyễn Quốc Hoàng (Đời 8).', 0),
('11111111-0072-4000-b000-000000000072', 'P072', 'Nguyễn Quốc Diện', 'Diện', 'Nguyễn', 1, 7, 1, true, true, 'Con trưởng của ông Nguyễn Quốc Công. Sinh ra con trai Nguyễn Quốc Khánh (Đời 8).', 0),
('11111111-0073-4000-b000-000000000073', 'P073', 'Nguyễn Quốc Văn', 'Văn', 'Nguyễn', 1, 7, 1, true, true, 'Con thứ của ông Nguyễn Quốc Công. Sinh ra con trai Nguyễn Quốc Phát (Đời 8).', 0),
('11111111-0074-4000-b000-000000000074', 'P074', 'Nguyễn Quốc Nhân', 'Nhân', 'Nguyễn', 1, 7, 1, true, true, 'Con của ông Nguyễn Quốc Ân.', 0),
('11111111-0075-4000-b000-000000000075', 'P075', 'Nguyễn Quốc Hải', 'Hải', 'Nguyễn', 1, 7, 1, true, true, 'Con của ông Nguyễn Quốc Hùng.', 0),
('11111111-0076-4000-b000-000000000076', 'P076', 'Nguyễn Quốc Toàn', 'Toàn', 'Nguyễn', 1, 7, 1, true, true, 'Con của ông Nguyễn Quốc Lượng.', 0),
('11111111-0077-4000-b000-000000000077', 'P077', 'Nguyễn Quốc Tiến (Cửa 1)', 'Tiến', 'Nguyễn', 1, 7, 1, true, true, 'Con của ông Nguyễn Quốc Huy (Cửa trưởng Đời 6).', 0),
('11111111-0078-4000-b000-000000000078', 'P078', 'Nguyễn Quốc Tuấn', 'Tuấn', 'Nguyễn', 1, 7, 2, true, true, 'Con trưởng của ông Nguyễn Quốc Thông. Sinh ra con trai Nguyễn Quốc Tiến (Đời 8).', 0),
('11111111-0079-4000-b000-000000000079', 'P079', 'Nguyễn Quốc Tú', 'Tú', 'Nguyễn', 1, 7, 2, true, true, 'Con thứ của ông Nguyễn Quốc Thông. Sinh ra Nguyễn Quốc Quân và Nguyễn Quốc Duy (Đời 8).', 0),
('11111111-0080-4000-b000-000000000080', 'P080', 'Nguyễn Quốc Bảo', 'Bảo', 'Nguyễn', 1, 7, 2, true, true, 'Con của ông Nguyễn Quốc Minh.', 0),
('11111111-0081-4000-b000-000000000081', 'P081', 'Nguyễn Quốc Hà', 'Hà', 'Nguyễn', 1, 7, 2, true, true, 'Con của ông Nguyễn Quốc Sáng.', 0),
('11111111-0082-4000-b000-000000000082', 'P082', 'Nguyễn Lê Quốc Anh', 'Quốc Anh', 'Nguyễn Lê', 1, 7, 2, true, true, 'Con trưởng của ông Nguyễn Quốc Tạo.', 0),
('11111111-0083-4000-b000-000000000083', 'P083', 'Nguyễn Lê Quốc Đạt', 'Quốc Đạt', 'Nguyễn Lê', 1, 7, 2, true, true, 'Con thứ của ông Nguyễn Quốc Tạo.', 0);

-- ĐỜI 8
INSERT INTO public.people (id, handle, display_name, first_name, surname, gender, generation, chi, is_living, is_patrilineal, biography, privacy_level) VALUES
('11111111-0091-4000-b000-000000000091', 'P091', 'Nguyễn Quốc Hoàng', 'Hoàng', 'Nguyễn', 1, 8, 1, true, true, 'Con của ông Nguyễn Quốc Dân (Đời 7, Cửa trưởng).', 0),
('11111111-0092-4000-b000-000000000092', 'P092', 'Nguyễn Quốc Khánh', 'Khánh', 'Nguyễn', 1, 8, 1, true, true, 'Con của ông Nguyễn Quốc Diện (Đời 7, Cửa trưởng).', 0),
('11111111-0093-4000-b000-000000000093', 'P093', 'Nguyễn Quốc Phát', 'Phát', 'Nguyễn', 1, 8, 1, true, true, 'Con của ông Nguyễn Quốc Văn (Đời 7, Cửa trưởng).', 0),
('11111111-0094-4000-b000-000000000094', 'P094', 'Nguyễn Quốc Tiến (Cửa 2)', 'Tiến', 'Nguyễn', 1, 8, 2, true, true, 'Con của ông Nguyễn Quốc Tuấn (Đời 7, Cửa thứ).', 0),
('11111111-0095-4000-b000-000000000095', 'P095', 'Nguyễn Quốc Quân', 'Quân', 'Nguyễn', 1, 8, 2, true, true, 'Con trưởng của ông Nguyễn Quốc Tú (Đời 7, Cửa thứ).', 0),
('11111111-0096-4000-b000-000000000096', 'P096', 'Nguyễn Quốc Duy', 'Duy', 'Nguyễn', 1, 8, 2, true, true, 'Con thứ của ông Nguyễn Quốc Tú (Đời 7, Cửa thứ).', 0);

-- ─── 4. NHẬP FAMILIES (27 đơn vị) ───────────────────────────────────────
INSERT INTO public.families (id, handle, father_id, mother_id, sort_order) VALUES
('22222222-0001-4000-c000-000000000001', 'F001', '11111111-0001-4000-b000-000000000001', '11111111-0002-4000-b000-000000000002', 1),
('22222222-0002-4000-c000-000000000002', 'F002', '11111111-0011-4000-b000-000000000011', NULL, 1),
('22222222-0003-4000-c000-000000000003', 'F003', '11111111-0012-4000-b000-000000000012', '11111111-0013-4000-b000-000000000013', 2),
('22222222-0004-4000-c000-000000000004', 'F004', '11111111-0021-4000-b000-000000000021', NULL, 1),
('22222222-0005-4000-c000-000000000005', 'F005', '11111111-0022-4000-b000-000000000022', '11111111-0028-4000-b000-000000000028', 1),
('22222222-0006-4000-c000-000000000006', 'F006', '11111111-0031-4000-b000-000000000031', NULL, 1),
('22222222-0007-4000-c000-000000000007', 'F007', '11111111-0032-4000-b000-000000000032', '11111111-0033-4000-b000-000000000033', 1),
('22222222-0008-4000-c000-000000000008', 'F008', '11111111-0041-4000-b000-000000000041', NULL, 1),
('22222222-0009-4000-c000-000000000009', 'F009', '11111111-0042-4000-b000-000000000042', NULL, 2),
('22222222-0010-4000-c000-000000000010', 'F010', '11111111-0043-4000-b000-000000000043', NULL, 3),
('22222222-0011-4000-c000-000000000011', 'F011', '11111111-0046-4000-b000-000000000046', '11111111-0048-4000-b000-000000000048', 1),
('22222222-0012-4000-c000-000000000012', 'F012', '11111111-0046-4000-b000-000000000046', '11111111-0049-4000-b000-000000000049', 2),
('22222222-0013-4000-c000-000000000013', 'F013', '11111111-0051-4000-b000-000000000051', NULL, 1),
('22222222-0014-4000-c000-000000000014', 'F014', '11111111-0052-4000-b000-000000000052', NULL, 2),
('22222222-0015-4000-c000-000000000015', 'F015', '11111111-0053-4000-b000-000000000053', NULL, 3),
('22222222-0016-4000-c000-000000000016', 'F016', '11111111-0054-4000-b000-000000000054', NULL, 1),
('22222222-0017-4000-c000-000000000017', 'F017', '11111111-0055-4000-b000-000000000055', NULL, 2),
('22222222-0018-4000-c000-000000000018', 'F018', '11111111-0056-4000-b000-000000000056', NULL, 1),
('22222222-0019-4000-c000-000000000019', 'F019', '11111111-0059-4000-b000-000000000059', NULL, 1),
('22222222-0020-4000-c000-000000000020', 'F020', '11111111-0060-4000-b000-000000000060', NULL, 2),
('22222222-0021-4000-c000-000000000021', 'F021', '11111111-0061-4000-b000-000000000061', NULL, 3),
('22222222-0022-4000-c000-000000000022', 'F022', '11111111-0062-4000-b000-000000000062', NULL, 4),
('22222222-0023-4000-c000-000000000023', 'F023', '11111111-0071-4000-b000-000000000071', NULL, 1),
('22222222-0024-4000-c000-000000000024', 'F024', '11111111-0072-4000-b000-000000000072', NULL, 2),
('22222222-0025-4000-c000-000000000025', 'F025', '11111111-0073-4000-b000-000000000073', NULL, 3),
('22222222-0026-4000-c000-000000000026', 'F026', '11111111-0078-4000-b000-000000000078', NULL, 1),
('22222222-0027-4000-c000-000000000027', 'F027', '11111111-0079-4000-b000-000000000079', NULL, 2);

-- ─── 5. NHẬP CHILDREN ────────────────────────────────────────────────────
INSERT INTO public.children (family_id, person_id, sort_order) VALUES
-- F001 → Đời 2
('22222222-0001-4000-c000-000000000001', '11111111-0011-4000-b000-000000000011', 1),
('22222222-0001-4000-c000-000000000001', '11111111-0012-4000-b000-000000000012', 2),
-- F002 (Trung) → Diệu
('22222222-0002-4000-c000-000000000002', '11111111-0021-4000-b000-000000000021', 1),
-- F003 (Chu + Nhiên) → 6 con
('22222222-0003-4000-c000-000000000003', '11111111-0022-4000-b000-000000000022', 1),
('22222222-0003-4000-c000-000000000003', '11111111-0023-4000-b000-000000000023', 2),
('22222222-0003-4000-c000-000000000003', '11111111-0024-4000-b000-000000000024', 3),
('22222222-0003-4000-c000-000000000003', '11111111-0025-4000-b000-000000000025', 4),
('22222222-0003-4000-c000-000000000003', '11111111-0026-4000-b000-000000000026', 5),
('22222222-0003-4000-c000-000000000003', '11111111-0027-4000-b000-000000000027', 6),
-- F004 (Diệu) → Mận
('22222222-0004-4000-c000-000000000004', '11111111-0031-4000-b000-000000000031', 1),
-- F005 (Tiệp + Bá) → Phúc
('22222222-0005-4000-c000-000000000005', '11111111-0032-4000-b000-000000000032', 1),
-- F006 (Mận) → 4 con
('22222222-0006-4000-c000-000000000006', '11111111-0041-4000-b000-000000000041', 1),
('22222222-0006-4000-c000-000000000006', '11111111-0042-4000-b000-000000000042', 2),
('22222222-0006-4000-c000-000000000006', '11111111-0043-4000-b000-000000000043', 3),
('22222222-0006-4000-c000-000000000006', '11111111-0044-4000-b000-000000000044', 4),
-- F007 (Phúc + Cố Loan) → 3 con
('22222222-0007-4000-c000-000000000007', '11111111-0045-4000-b000-000000000045', 1),
('22222222-0007-4000-c000-000000000007', '11111111-0046-4000-b000-000000000046', 2),
('22222222-0007-4000-c000-000000000007', '11111111-0047-4000-b000-000000000047', 3),
-- F008 (Thị) → Uy, Công, Ân
('22222222-0008-4000-c000-000000000008', '11111111-0051-4000-b000-000000000051', 1),
('22222222-0008-4000-c000-000000000008', '11111111-0052-4000-b000-000000000052', 2),
('22222222-0008-4000-c000-000000000008', '11111111-0053-4000-b000-000000000053', 3),
-- F009 (Mỹ) → Hùng, Lượng
('22222222-0009-4000-c000-000000000009', '11111111-0054-4000-b000-000000000054', 1),
('22222222-0009-4000-c000-000000000009', '11111111-0055-4000-b000-000000000055', 2),
-- F010 (Thụ) → Huy, Đạt, Sửu
('22222222-0010-4000-c000-000000000010', '11111111-0056-4000-b000-000000000056', 1),
('22222222-0010-4000-c000-000000000010', '11111111-0057-4000-b000-000000000057', 2),
('22222222-0010-4000-c000-000000000010', '11111111-0058-4000-b000-000000000058', 3),
-- F011 (Tuệ + Hồ Thị Lưu) → Thông, Minh, Sáng, Tạo, Tâm
('22222222-0011-4000-c000-000000000011', '11111111-0059-4000-b000-000000000059', 1),
('22222222-0011-4000-c000-000000000011', '11111111-0060-4000-b000-000000000060', 2),
('22222222-0011-4000-c000-000000000011', '11111111-0061-4000-b000-000000000061', 3),
('22222222-0011-4000-c000-000000000011', '11111111-0062-4000-b000-000000000062', 4),
('22222222-0011-4000-c000-000000000011', '11111111-0063-4000-b000-000000000063', 5),
-- F012 (Tuệ + Phan Thị Lập) → Trí, Lễ, Hồng Lam
('22222222-0012-4000-c000-000000000012', '11111111-0064-4000-b000-000000000064', 1),
('22222222-0012-4000-c000-000000000012', '11111111-0065-4000-b000-000000000065', 2),
('22222222-0012-4000-c000-000000000012', '11111111-0066-4000-b000-000000000066', 3),
-- F013 (Uy) → Dân
('22222222-0013-4000-c000-000000000013', '11111111-0071-4000-b000-000000000071', 1),
-- F014 (Công) → Diện, Văn
('22222222-0014-4000-c000-000000000014', '11111111-0072-4000-b000-000000000072', 1),
('22222222-0014-4000-c000-000000000014', '11111111-0073-4000-b000-000000000073', 2),
-- F015 (Ân) → Nhân
('22222222-0015-4000-c000-000000000015', '11111111-0074-4000-b000-000000000074', 1),
-- F016 (Hùng) → Hải
('22222222-0016-4000-c000-000000000016', '11111111-0075-4000-b000-000000000075', 1),
-- F017 (Lượng) → Toàn
('22222222-0017-4000-c000-000000000017', '11111111-0076-4000-b000-000000000076', 1),
-- F018 (Huy) → Tiến (Cửa 1, Đời 7)
('22222222-0018-4000-c000-000000000018', '11111111-0077-4000-b000-000000000077', 1),
-- F019 (Thông) → Tuấn, Tú
('22222222-0019-4000-c000-000000000019', '11111111-0078-4000-b000-000000000078', 1),
('22222222-0019-4000-c000-000000000019', '11111111-0079-4000-b000-000000000079', 2),
-- F020 (Minh) → Bảo
('22222222-0020-4000-c000-000000000020', '11111111-0080-4000-b000-000000000080', 1),
-- F021 (Sáng) → Hà
('22222222-0021-4000-c000-000000000021', '11111111-0081-4000-b000-000000000081', 1),
-- F022 (Tạo) → Q.Anh, Q.Đạt
('22222222-0022-4000-c000-000000000022', '11111111-0082-4000-b000-000000000082', 1),
('22222222-0022-4000-c000-000000000022', '11111111-0083-4000-b000-000000000083', 2),
-- F023 (Dân) → Hoàng
('22222222-0023-4000-c000-000000000023', '11111111-0091-4000-b000-000000000091', 1),
-- F024 (Diện) → Khánh
('22222222-0024-4000-c000-000000000024', '11111111-0092-4000-b000-000000000092', 1),
-- F025 (Văn) → Phát
('22222222-0025-4000-c000-000000000025', '11111111-0093-4000-b000-000000000093', 1),
-- F026 (Tuấn) → Tiến (Cửa 2, Đời 8)
('22222222-0026-4000-c000-000000000026', '11111111-0094-4000-b000-000000000094', 1),
-- F027 (Tú) → Quân, Duy
('22222222-0027-4000-c000-000000000027', '11111111-0095-4000-b000-000000000095', 1),
('22222222-0027-4000-c000-000000000027', '11111111-0096-4000-b000-000000000096', 2);

-- ─── 6. NHẬP EVENTS (Ngày giỗ) ───────────────────────────────────────────
INSERT INTO public.events (title, event_type, event_lunar, person_id, recurring, location) VALUES
('Giỗ Cụ Thủy Tổ Nguyễn Quốc Thắng và Bà Miềng', 'gio', '7/7', '11111111-0001-4000-b000-000000000001', true, 'Thôn Sa Long, xã Hà Linh, Hương Khê'),
('Giỗ Cụ Nguyễn Quốc Chu (Cố Thu)', 'gio', '20/4', '11111111-0012-4000-b000-000000000012', true, 'Thôn Sa Long, xã Hà Linh, Hương Khê'),
('Giỗ Cụ Phan Thị Nhiên', 'gio', '10/10', '11111111-0013-4000-b000-000000000013', true, 'Thôn Sa Long, xã Hà Linh, Hương Khê'),
('Giỗ Cụ Nguyễn Quốc Tiệp', 'gio', '21/9', '11111111-0022-4000-b000-000000000022', true, 'Thôn Sa Long, xã Hà Linh, Hương Khê'),
('Giỗ Cụ Nguyễn Thị Bá', 'gio', '12/10', '11111111-0028-4000-b000-000000000028', true, 'Thôn Sa Long, xã Hà Linh, Hương Khê'),
('Giỗ Cụ Nguyễn Quốc Phúc', 'gio', '29/3', '11111111-0032-4000-b000-000000000032', true, 'Thôn Sa Long, xã Hà Linh, Hương Khê'),
('Giỗ Cụ Phan Thị Ngoéch Tôn (Cố Loan)', 'gio', '30/10', '11111111-0033-4000-b000-000000000033', true, 'xã Hương Vĩnh, Hương Khê'),
('Giỗ Bà Hồ Thị Lưu', 'gio', '29/9', '11111111-0048-4000-b000-000000000048', true, NULL),
('Giỗ Ông Nguyễn Trí Tuệ (Nguyễn Quốc Loan)', 'gio', '29/6', '11111111-0046-4000-b000-000000000046', true, 'Nghĩa trang thôn 3, xã Cư Prao, huyện M''Drắk, Đắk Lắk'),
('Rằm tháng Bảy - Vu Lan', 'le_tet', '15/7', NULL, true, 'Thôn Sa Long, xã Hà Linh, Hương Khê'),
('Tết Nguyên Đán', 'le_tet', '1/1', NULL, true, 'Thôn Sa Long, xã Hà Linh, Hương Khê'),
('Họp họ hằng năm', 'hop_ho', NULL, NULL, true, 'Thôn Sa Long, xã Hà Linh, Hương Khê');

-- ─── 7. NHẬP CLAN ARTICLES ───────────────────────────────────────────────
INSERT INTO public.clan_articles (title, content, category, sort_order) VALUES
('Lời tựa gia phả Họ Nguyễn Quốc', 'Gia phả này được ghi rõ và có sơ đồ cụ thể. Con cháu đời sau xin hãy ghi lòng tạc dạ, nhớ lấy những ngày giỗ kỵ mà thắp hương tưởng niệm. Phàm ở đời, có người đời trước mới sinh ra người đời sau; có gốc mới có ngọn, có tổ tiên mới có con cháu ngày nay.', 'gia_huan', 1),
('Lời căn dặn đời sau', 'Trách nhiệm của các con, các cháu, các chắt thế hệ về sau thuộc cả hai cửa họ là phải tiếp tục ghi chép bổ sung những diễn biến, sự nảy nở của con cháu mình một cách chân thực, cụ thể. Con cháu phải luôn ghi nhớ cội nguồn (Thôn Minh Hải, xã Thạch Hải), nhớ ngày giỗ kỵ của tổ tiên. Hãy lấy chữ Hiếu, chữ Tình làm trọng, xóa bỏ những mâu thuẫn để dòng họ được đời đời đoàn tụ, vững bền.', 'gia_huan', 2),
('Quy ước họp họ', 'Họp họ tổ chức hằng năm tại thôn Sa Long, xã Hà Linh, huyện Hương Khê, tỉnh Hà Tĩnh. Mọi thành viên trong dòng họ từ 18 tuổi trở lên đều có quyền tham dự. Đây là dịp để con cháu hai cửa họ (Cửa trưởng và Cửa thứ) gặp gỡ, ôn lại truyền thống và bàn bạc việc họ tộc.', 'quy_uoc', 1),
('Nguồn gốc dòng họ Nguyễn Quốc', 'Gia tộc họ Nguyễn Quốc có nguồn gốc từ Yên Nhân Thôn, Dương Luật xã, Thạch Hà phủ (nay là Thôn Minh Hải, xã Thạch Hải, huyện Thạch Hà, tỉnh Hà Tĩnh). Bắt nguồn từ đầu thế kỷ thứ 18, Thủy tổ Nguyễn Quốc Thắng đến an cư lập nghiệp tại thôn Sa Long, xã Hà Linh, huyện Hương Khê. Đến thế kỷ 21, dòng dõi đã phát triển đến đời thứ 8.', 'gia_huan', 3);

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- DONE: Họ Nguyễn Quốc — 62 người, 8 đời, 2 cửa, 27 gia đình, 12 ngày giỗ
-- ═══════════════════════════════════════════════════════════════════════════
