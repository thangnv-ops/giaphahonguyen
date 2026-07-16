#!/usr/bin/env node
/**
 * @project AncestorTree Desktop
 * @file desktop/scripts/seed-demo-data.mjs
 * @description Seed demo data into running desktop app via API
 * @version 1.0.0
 * @updated 2026-02-26
 */

const BASE_URL = process.argv[2] || 'http://127.0.0.1:55255';

async function api(table, method, body) {
  const res = await fetch(`${BASE_URL}/api/desktop-db`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ table, method, columns: '*', body, filters: [] }),
  });
  const json = await res.json();
  if (json.error) {
    // Ignore duplicate key errors (already seeded)
    if (json.error.message?.includes('UNIQUE constraint')) return json;
    console.error(`  ERROR [${table}]:`, json.error.message);
  }
  return json;
}

async function seed() {
  console.log(`Seeding demo data to ${BASE_URL}...\n`);

  // ─── People (18 thành viên, 5 đời) ───
  console.log('Seeding people...');
  const people = [
    // Đời 1: Thủy tổ
    { id: 'bbbbbbbb-0001-4000-b000-000000000001', handle: 'dang-van-thuy-to', display_name: 'Đặng Văn Thủy Tổ', first_name: 'Thủy Tổ', surname: 'Đặng', gender: 1, generation: 1, is_living: false, birth_year: 1850, death_year: 1920, death_lunar: '12/3', biography: 'Thủy tổ dòng họ Đặng làng Kỷ Các.', privacy_level: 0, is_patrilineal: true },
    { id: 'bbbbbbbb-0002-4000-b000-000000000002', handle: 'nguyen-thi-tu', display_name: 'Nguyễn Thị Từ', first_name: 'Từ', surname: 'Nguyễn', gender: 2, generation: 1, is_living: false, birth_year: 1855, death_year: 1935, death_lunar: '8/7', biography: 'Vợ cụ Thủy Tổ.', privacy_level: 0, is_patrilineal: false },
    // Đời 2: 3 con + 2 dâu
    { id: 'bbbbbbbb-0011-4000-b000-000000000011', handle: 'dang-van-nhat', display_name: 'Đặng Văn Nhất', first_name: 'Nhất', surname: 'Đặng', gender: 1, generation: 2, is_living: false, birth_year: 1880, death_year: 1950, death_lunar: '15/1', biography: 'Con trưởng.', privacy_level: 0, is_patrilineal: true },
    { id: 'bbbbbbbb-0012-4000-b000-000000000012', handle: 'tran-thi-lan', display_name: 'Trần Thị Lan', first_name: 'Lan', surname: 'Trần', gender: 2, generation: 2, is_living: false, birth_year: 1885, death_year: 1960, death_lunar: '20/9', biography: 'Vợ ông Nhất.', privacy_level: 0, is_patrilineal: false },
    { id: 'bbbbbbbb-0013-4000-b000-000000000013', handle: 'dang-van-nhi', display_name: 'Đặng Văn Nhị', first_name: 'Nhị', surname: 'Đặng', gender: 1, generation: 2, is_living: false, birth_year: 1883, death_year: 1955, death_lunar: '5/11', biography: 'Con thứ.', privacy_level: 0, is_patrilineal: true },
    { id: 'bbbbbbbb-0014-4000-b000-000000000014', handle: 'le-thi-mai', display_name: 'Lê Thị Mai', first_name: 'Mai', surname: 'Lê', gender: 2, generation: 2, is_living: false, birth_year: 1888, death_year: 1965, death_lunar: '22/4', biography: 'Vợ ông Nhị.', privacy_level: 0, is_patrilineal: false },
    { id: 'bbbbbbbb-0015-4000-b000-000000000015', handle: 'dang-thi-ba', display_name: 'Đặng Thị Ba', first_name: 'Ba', surname: 'Đặng', gender: 2, generation: 2, is_living: false, birth_year: 1886, death_year: 1970, death_lunar: '3/6', biography: 'Con gái út.', privacy_level: 0, is_patrilineal: true },
    // Đời 3: 4 cháu
    { id: 'bbbbbbbb-0021-4000-b000-000000000021', handle: 'dang-van-tai', display_name: 'Đặng Văn Tài', first_name: 'Tài', surname: 'Đặng', gender: 1, generation: 3, is_living: false, birth_year: 1910, death_year: 1980, death_lunar: '18/2', biography: 'Cháu trưởng.', privacy_level: 0, is_patrilineal: true },
    { id: 'bbbbbbbb-0022-4000-b000-000000000022', handle: 'pham-thi-hoa', display_name: 'Phạm Thị Hoa', first_name: 'Hoa', surname: 'Phạm', gender: 2, generation: 3, is_living: false, birth_year: 1915, death_year: 1990, death_lunar: '7/10', biography: 'Vợ ông Tài.', privacy_level: 0, is_patrilineal: false },
    { id: 'bbbbbbbb-0023-4000-b000-000000000023', handle: 'dang-thi-lien', display_name: 'Đặng Thị Liên', first_name: 'Liên', surname: 'Đặng', gender: 2, generation: 3, is_living: false, birth_year: 1912, death_year: 1985, death_lunar: '25/8', biography: 'Con gái ông Nhất.', privacy_level: 0, is_patrilineal: true },
    { id: 'bbbbbbbb-0024-4000-b000-000000000024', handle: 'dang-van-duc', display_name: 'Đặng Văn Đức', first_name: 'Đức', surname: 'Đặng', gender: 1, generation: 3, is_living: false, birth_year: 1915, death_year: 1988, death_lunar: '10/5', biography: 'Con ông Nhị.', privacy_level: 0, is_patrilineal: true },
    // Đời 4: 4 chắt (còn sống)
    { id: 'bbbbbbbb-0031-4000-b000-000000000031', handle: 'dang-van-minh', display_name: 'Đặng Văn Minh', first_name: 'Minh', surname: 'Đặng', gender: 1, generation: 4, is_living: true, birth_year: 1945, biography: 'Trưởng nam đời 4.', privacy_level: 0, is_patrilineal: true },
    { id: 'bbbbbbbb-0032-4000-b000-000000000032', handle: 'nguyen-thi-hang', display_name: 'Nguyễn Thị Hằng', first_name: 'Hằng', surname: 'Nguyễn', gender: 2, generation: 4, is_living: true, birth_year: 1948, biography: 'Vợ ông Minh.', privacy_level: 0, is_patrilineal: false },
    { id: 'bbbbbbbb-0033-4000-b000-000000000033', handle: 'dang-van-hung', display_name: 'Đặng Văn Hùng', first_name: 'Hùng', surname: 'Đặng', gender: 1, generation: 4, is_living: true, birth_year: 1950, biography: 'Con thứ ông Tài.', privacy_level: 0, is_patrilineal: true },
    { id: 'bbbbbbbb-0034-4000-b000-000000000034', handle: 'dang-thi-phuong', display_name: 'Đặng Thị Phượng', first_name: 'Phượng', surname: 'Đặng', gender: 2, generation: 4, is_living: true, birth_year: 1947, biography: 'Con gái ông Đức.', privacy_level: 0, is_patrilineal: true },
    // Đời 5: 3 chút (còn sống)
    { id: 'bbbbbbbb-0041-4000-b000-000000000041', handle: 'dang-van-an', display_name: 'Đặng Văn An', first_name: 'An', surname: 'Đặng', gender: 1, generation: 5, is_living: true, birth_year: 1975, biography: 'Con ông Minh. Kỹ sư CNTT.', privacy_level: 0, is_patrilineal: true, occupation: 'Kỹ sư phần mềm' },
    { id: 'bbbbbbbb-0042-4000-b000-000000000042', handle: 'dang-thi-binh', display_name: 'Đặng Thị Bình', first_name: 'Bình', surname: 'Đặng', gender: 2, generation: 5, is_living: true, birth_year: 1978, biography: 'Con gái ông Minh.', privacy_level: 0, is_patrilineal: true, occupation: 'Giáo viên' },
    { id: 'bbbbbbbb-0043-4000-b000-000000000043', handle: 'dang-van-cuong', display_name: 'Đặng Văn Cường', first_name: 'Cường', surname: 'Đặng', gender: 1, generation: 5, is_living: true, birth_year: 1980, biography: 'Con ông Hùng.', privacy_level: 0, is_patrilineal: true, occupation: 'Bác sĩ' },
  ];
  for (const p of people) {
    await api('people', 'insert', p);
  }
  console.log(`  ✓ ${people.length} people inserted`);

  // ─── Families ───
  console.log('Seeding families...');
  const families = [
    { id: 'cccccccc-0001-4000-c000-000000000001', handle: 'thuy-to-tu', father_id: 'bbbbbbbb-0001-4000-b000-000000000001', mother_id: 'bbbbbbbb-0002-4000-b000-000000000002', marriage_date: '1878', sort_order: 1 },
    { id: 'cccccccc-0002-4000-c000-000000000002', handle: 'nhat-lan', father_id: 'bbbbbbbb-0011-4000-b000-000000000011', mother_id: 'bbbbbbbb-0012-4000-b000-000000000012', marriage_date: '1908', sort_order: 1 },
    { id: 'cccccccc-0003-4000-c000-000000000003', handle: 'nhi-mai', father_id: 'bbbbbbbb-0013-4000-b000-000000000013', mother_id: 'bbbbbbbb-0014-4000-b000-000000000014', marriage_date: '1912', sort_order: 2 },
    { id: 'cccccccc-0004-4000-c000-000000000004', handle: 'tai-hoa', father_id: 'bbbbbbbb-0021-4000-b000-000000000021', mother_id: 'bbbbbbbb-0022-4000-b000-000000000022', marriage_date: '1938', sort_order: 1 },
    { id: 'cccccccc-0005-4000-c000-000000000005', handle: 'minh-hang', father_id: 'bbbbbbbb-0031-4000-b000-000000000031', mother_id: 'bbbbbbbb-0032-4000-b000-000000000032', marriage_date: '1970', sort_order: 1 },
  ];
  for (const f of families) {
    await api('families', 'insert', f);
  }
  console.log(`  ✓ ${families.length} families inserted`);

  // ─── Children ───
  console.log('Seeding children...');
  const children = [
    // Đời 1 → Đời 2
    { id: 'dddddddd-0001-4000-d000-000000000001', family_id: 'cccccccc-0001-4000-c000-000000000001', person_id: 'bbbbbbbb-0011-4000-b000-000000000011', sort_order: 1 },
    { id: 'dddddddd-0002-4000-d000-000000000002', family_id: 'cccccccc-0001-4000-c000-000000000001', person_id: 'bbbbbbbb-0013-4000-b000-000000000013', sort_order: 2 },
    { id: 'dddddddd-0003-4000-d000-000000000003', family_id: 'cccccccc-0001-4000-c000-000000000001', person_id: 'bbbbbbbb-0015-4000-b000-000000000015', sort_order: 3 },
    // Đời 2 (Nhất + Lan) → Đời 3
    { id: 'dddddddd-0004-4000-d000-000000000004', family_id: 'cccccccc-0002-4000-c000-000000000002', person_id: 'bbbbbbbb-0021-4000-b000-000000000021', sort_order: 1 },
    { id: 'dddddddd-0005-4000-d000-000000000005', family_id: 'cccccccc-0002-4000-c000-000000000002', person_id: 'bbbbbbbb-0023-4000-b000-000000000023', sort_order: 2 },
    // Đời 2 (Nhị + Mai) → Đời 3
    { id: 'dddddddd-0006-4000-d000-000000000006', family_id: 'cccccccc-0003-4000-c000-000000000003', person_id: 'bbbbbbbb-0024-4000-b000-000000000024', sort_order: 1 },
    // Đời 3 (Tài + Hoa) → Đời 4
    { id: 'dddddddd-0007-4000-d000-000000000007', family_id: 'cccccccc-0004-4000-c000-000000000004', person_id: 'bbbbbbbb-0031-4000-b000-000000000031', sort_order: 1 },
    { id: 'dddddddd-0008-4000-d000-000000000008', family_id: 'cccccccc-0004-4000-c000-000000000004', person_id: 'bbbbbbbb-0033-4000-b000-000000000033', sort_order: 2 },
    // Đời 4 (Minh + Hằng) → Đời 5
    { id: 'dddddddd-0009-4000-d000-000000000009', family_id: 'cccccccc-0005-4000-c000-000000000005', person_id: 'bbbbbbbb-0041-4000-b000-000000000041', sort_order: 1 },
    { id: 'dddddddd-0010-4000-d000-000000000010', family_id: 'cccccccc-0005-4000-c000-000000000005', person_id: 'bbbbbbbb-0042-4000-b000-000000000042', sort_order: 2 },
  ];
  for (const c of children) {
    await api('children', 'insert', c);
  }
  console.log(`  ✓ ${children.length} children inserted`);

  // ─── Events ───
  console.log('Seeding events...');
  const events = [
    { id: 'eeeeeeee-0001-4000-e000-000000000001', title: 'Giỗ Cụ Thủy Tổ', event_type: 'gio', event_lunar: '12/3', person_id: 'bbbbbbbb-0001-4000-b000-000000000001', recurring: true, location: 'Nhà thờ họ' },
    { id: 'eeeeeeee-0002-4000-e000-000000000002', title: 'Giỗ Bà Thủy Tổ', event_type: 'gio', event_lunar: '8/7', person_id: 'bbbbbbbb-0002-4000-b000-000000000002', recurring: true, location: 'Nhà thờ họ' },
    { id: 'eeeeeeee-0003-4000-e000-000000000003', title: 'Giỗ Ông Nhất', event_type: 'gio', event_lunar: '15/1', person_id: 'bbbbbbbb-0011-4000-b000-000000000011', recurring: true, location: 'Nhà trưởng' },
    { id: 'eeeeeeee-0004-4000-e000-000000000004', title: 'Rằm tháng Bảy', event_type: 'le_tet', event_lunar: '15/7', recurring: true, location: 'Nhà thờ họ' },
    { id: 'eeeeeeee-0005-4000-e000-000000000005', title: 'Tết Nguyên Đán', event_type: 'le_tet', event_lunar: '1/1', recurring: true, location: 'Nhà thờ họ' },
  ];
  for (const e of events) {
    await api('events', 'insert', e);
  }
  console.log(`  ✓ ${events.length} events inserted`);

  // ─── Achievements ───
  console.log('Seeding achievements...');
  const achievements = [
    { id: 'ffffffff-0001-4000-f000-000000000001', person_id: 'bbbbbbbb-0041-4000-b000-000000000041', title: 'Tốt nghiệp Thạc sĩ CNTT', category: 'hoc_tap', year: 2002, description: 'Đại học Bách Khoa Hà Nội' },
    { id: 'ffffffff-0002-4000-f000-000000000002', person_id: 'bbbbbbbb-0042-4000-b000-000000000042', title: 'Giáo viên Giỏi cấp Tỉnh', category: 'su_nghiep', year: 2015, description: 'Sở GD&ĐT Hà Tĩnh' },
  ];
  for (const a of achievements) {
    await api('achievements', 'insert', a);
  }
  console.log(`  ✓ ${achievements.length} achievements inserted`);

  // ─── Clan Articles ───
  console.log('Seeding clan articles...');
  const articles = [
    { id: '11111111-0001-4000-1000-000000000001', title: 'Gia huấn dòng họ', content: 'Kính trên nhường dưới, giữ gìn nề nếp gia phong. Con cháu phải siêng năng học hành, hiếu thảo với cha mẹ.', category: 'gia_huan', sort_order: 1 },
    { id: '11111111-0002-4000-1000-000000000002', title: 'Quy ước họp họ', content: 'Họp họ tổ chức vào ngày Rằm tháng Giêng hàng năm tại nhà thờ họ. Mọi thành viên từ 18 tuổi trở lên đều có quyền tham dự và biểu quyết.', category: 'quy_uoc', sort_order: 1 },
  ];
  for (const a of articles) {
    await api('clan_articles', 'insert', a);
  }
  console.log(`  ✓ ${articles.length} clan articles inserted`);

  // ─── Mark migration as applied ───
  console.log('Marking migration 002 as applied...');
  await api('_migrations', 'insert', { name: '002-seed-demo-data.sql' });
  console.log('  ✓ Migration recorded');

  // ─── Verify ───
  console.log('\nVerifying...');
  const verify = await fetch(`${BASE_URL}/api/desktop-db`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ table: 'people', method: 'select', columns: 'id,display_name,generation', filters: [], order: [{ column: 'generation', ascending: true }] }),
  });
  const result = await verify.json();
  console.log(`  People: ${result.data?.length || 0} records`);
  if (result.data) {
    const byGen = {};
    for (const p of result.data) {
      byGen[p.generation] = (byGen[p.generation] || 0) + 1;
    }
    for (const [gen, count] of Object.entries(byGen)) {
      console.log(`    Đời ${gen}: ${count} người`);
    }
  }

  console.log('\n✅ Demo data seeded successfully!');
}

seed().catch(console.error);
