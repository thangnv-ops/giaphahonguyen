/**
 * @project AncestorTree
 * @file src/lib/supabase-data-cau-duong.ts
 * @description Data layer cho tính năng Lịch Cầu đương
 *   - Quản lý nhóm xoay vòng (pools) và phân công (assignments)
 *   - Thuật toán DFS để xác định thứ tự xoay vòng theo cây gia phả
 *   - Tính tuổi âm và kiểm tra điều kiện đủ tư cách (đã lập gia đình, dưới 70 tuổi âm)
 * @version 1.0.0
 * @updated 2026-02-25
 */

import { supabase } from './supabase';
import type {
  CauDuongPool,
  CauDuongAssignment,
  CauDuongEligibleMember,
  CauDuongCeremonyType,
  CauDuongStatus,
  CAU_DUONG_CEREMONY_ORDER,
} from '@/types';
import type { Person } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Tính tuổi âm: năm hiện tại - năm sinh + 1
 * Nếu chưa có năm sinh → trả về 0 (không xác định)
 */
export function calcAgeLunar(birthYear: number | undefined | null, currentYear: number): number {
  if (!birthYear) return 0;
  return currentYear - birthYear + 1;
}

/**
 * Kiểm tra người này có đủ điều kiện làm Cầu đương không.
 * Điều kiện:
 *   - Nam giới (gender === 1)
 *   - Còn sống (is_living === true)
 *   - Đời >= min_generation
 *   - Tuổi âm < max_age_lunar (dưới 70)
 *   - Đã lập gia đình (có trong fatherIds — là cha trong bảng families)
 */
export function isEligibleForCauDuong(
  person: Person,
  fatherIds: Set<string>,
  minGeneration: number,
  maxAgeLunar: number,
  currentYear: number,
  requireMarried: boolean = true,
): boolean {
  if (person.gender !== 1) return false;
  if (!person.is_living) return false;
  if (person.generation < minGeneration) return false;
  if (requireMarried && !fatherIds.has(person.id)) return false; // chưa lập gia đình
  const age = calcAgeLunar(person.birth_year, currentYear);
  if (age === 0) return false; // không rõ năm sinh
  if (age >= maxAgeLunar) return false; // đã 70+ tuổi âm
  return true;
}

/**
 * DFS traversal từ một tổ tông, trả về danh sách UUID của con cháu
 * theo thứ tự gia phả (preorder DFS, sort_order từ nhỏ đến lớn).
 * Không bao gồm bản thân ancestor.
 */
export function buildDFSOrder(
  ancestorId: string,
  familiesByFatherId: Map<string, Array<{ id: string; sort_order: number }>>,
  childrenByFamilyId: Map<string, Array<{ person_id: string; sort_order: number }>>,
): string[] {
  const result: string[] = [];
  const visited = new Set<string>(); // tránh vòng lặp nếu có dữ liệu lỗi

  function dfs(personId: string): void {
    if (visited.has(personId)) return;
    visited.add(personId);

    const families = (familiesByFatherId.get(personId) || [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order);

    for (const family of families) {
      const children = (childrenByFamilyId.get(family.id) || [])
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order);

      for (const child of children) {
        result.push(child.person_id);
        dfs(child.person_id);
      }
    }
  }

  dfs(ancestorId);
  return result;
}

// ─── Pools CRUD ───────────────────────────────────────────────────────────────

export async function getCauDuongPools(): Promise<CauDuongPool[]> {
  const { data, error } = await supabase
    .from('cau_duong_pools')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getCauDuongPool(id: string): Promise<CauDuongPool | null> {
  const { data, error } = await supabase
    .from('cau_duong_pools')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function createCauDuongPool(
  input: Omit<CauDuongPool, 'id' | 'created_at' | 'updated_at'>,
): Promise<CauDuongPool> {
  const { data, error } = await supabase
    .from('cau_duong_pools')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCauDuongPool(
  id: string,
  input: Partial<Omit<CauDuongPool, 'id' | 'created_at' | 'updated_at'>>,
): Promise<CauDuongPool> {
  const { data, error } = await supabase
    .from('cau_duong_pools')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Assignments CRUD ─────────────────────────────────────────────────────────

export async function getCauDuongAssignments(
  poolId: string,
  year?: number,
): Promise<CauDuongAssignment[]> {
  let query = supabase
    .from('cau_duong_assignments')
    .select('*')
    .eq('pool_id', poolId)
    .order('year', { ascending: false })
    .order('ceremony_type', { ascending: true });

  if (year !== undefined) {
    query = query.eq('year', year);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createCauDuongAssignment(
  input: Omit<CauDuongAssignment, 'id' | 'created_at' | 'updated_at'>,
): Promise<CauDuongAssignment> {
  const { data, error } = await supabase
    .from('cau_duong_assignments')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCauDuongAssignment(
  id: string,
  input: Partial<Omit<CauDuongAssignment, 'id' | 'created_at' | 'updated_at'>>,
): Promise<CauDuongAssignment> {
  const { data, error } = await supabase
    .from('cau_duong_assignments')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Business Logic ───────────────────────────────────────────────────────────

/**
 * Lấy danh sách thành viên đủ điều kiện làm Cầu đương theo thứ tự DFS.
 * Kết quả bao gồm: thông tin người, vị trí DFS, tuổi âm, trạng thái gia đình.
 */
export async function getEligibleMembersInDFSOrder(
  poolId: string,
  currentYear: number,
): Promise<CauDuongEligibleMember[]> {
  // 1. Lấy config nhóm
  const pool = await getCauDuongPool(poolId);
  if (!pool) throw new Error('Không tìm thấy nhóm Cầu đương');

  // 2. Lấy tất cả dữ liệu cần thiết song song
  const [peopleRes, familiesRes, childrenRes] = await Promise.all([
    supabase.from('people').select('*'),
    supabase.from('families').select('id, father_id, sort_order'),
    supabase.from('children').select('family_id, person_id, sort_order'),
  ]);

  if (peopleRes.error) throw peopleRes.error;
  if (familiesRes.error) throw familiesRes.error;
  if (childrenRes.error) throw childrenRes.error;

  const allPeople = peopleRes.data as Person[];
  const allFamilies = familiesRes.data || [];
  const allChildren = childrenRes.data || [];

  // 3. Build lookup maps
  const peopleById = new Map<string, Person>(allPeople.map(p => [p.id, p]));

  // families grouped by father_id
  const familiesByFatherId = new Map<string, Array<{ id: string; sort_order: number }>>();
  for (const f of allFamilies) {
    if (!f.father_id) continue;
    const arr = familiesByFatherId.get(f.father_id) || [];
    arr.push({ id: f.id, sort_order: f.sort_order ?? 0 });
    familiesByFatherId.set(f.father_id, arr);
  }

  // children grouped by family_id
  const childrenByFamilyId = new Map<string, Array<{ person_id: string; sort_order: number }>>();
  for (const c of allChildren) {
    const arr = childrenByFamilyId.get(c.family_id) || [];
    arr.push({ person_id: c.person_id, sort_order: c.sort_order ?? 0 });
    childrenByFamilyId.set(c.family_id, arr);
  }

  // Set of person IDs that are fathers (đã lập gia đình)
  const fatherIds = new Set<string>(
    allFamilies.filter(f => f.father_id).map(f => f.father_id as string),
  );

  // 4. DFS từ tổ tông → danh sách UUID con cháu theo thứ tự gia phả
  const dfsOrder = buildDFSOrder(pool.ancestor_id, familiesByFatherId, childrenByFamilyId);

  // 5. Lọc eligible members
  const eligibleMap = new Map<string, { person: Person; ageLunar: number; isMarried: boolean }>();

  for (const personId of dfsOrder) {
    const person = peopleById.get(personId);
    if (!person) continue;

    if (isEligibleForCauDuong(person, fatherIds, pool.min_generation, pool.max_age_lunar, currentYear, pool.require_married)) {
      eligibleMap.set(personId, {
        person,
        ageLunar: calcAgeLunar(person.birth_year, currentYear),
        isMarried: fatherIds.has(person.id),
      });
    }
  }

  // 6. Áp dụng thứ tự: custom_order nếu có, ngược lại DFS order
  const customOrder = Array.isArray(pool.custom_order) ? pool.custom_order : null;
  let orderedIds: string[];

  if (customOrder && customOrder.length > 0) {
    // Custom order first, then append any eligible members not in custom list (new members)
    const inCustom = new Set(customOrder.filter(id => eligibleMap.has(id)));
    const notInCustom = dfsOrder.filter(id => eligibleMap.has(id) && !inCustom.has(id));
    orderedIds = [...customOrder.filter(id => eligibleMap.has(id)), ...notInCustom];
  } else {
    orderedIds = dfsOrder.filter(id => eligibleMap.has(id));
  }

  // 7. Đóng gói kết quả
  const result: CauDuongEligibleMember[] = [];
  let dfsIndex = 0;

  for (const personId of orderedIds) {
    const entry = eligibleMap.get(personId);
    if (!entry) continue;
    result.push({ ...entry, dfsIndex });
    dfsIndex++;
  }

  return result;
}

/**
 * Tìm người tiếp theo trong danh sách xoay vòng.
 * Logic:
 *   - Lấy danh sách đủ điều kiện (DFS order) hiện tại
 *   - Lấy rotation_index của lần phân công gần nhất
 *   - Người tiếp theo = (lastRotationIndex + 1) % total (xoay vòng)
 */
export async function getNextHostInRotation(
  poolId: string,
  currentYear: number,
): Promise<{ member: CauDuongEligibleMember; rotationIndex: number } | null> {
  const [eligibleList, pastAssignments] = await Promise.all([
    getEligibleMembersInDFSOrder(poolId, currentYear),
    supabase
      .from('cau_duong_assignments')
      .select('rotation_index, host_person_id, year, ceremony_type')
      .eq('pool_id', poolId)
      .not('rotation_index', 'is', null)
      .order('year', { ascending: false })
      .order('ceremony_type', { ascending: false })
      .limit(1),
  ]);

  if (eligibleList.length === 0) return null;

  const lastAssignment = pastAssignments.data?.[0];
  let nextIndex = 0;

  if (lastAssignment?.rotation_index !== null && lastAssignment?.rotation_index !== undefined) {
    nextIndex = (lastAssignment.rotation_index + 1) % eligibleList.length;
  }

  const member = eligibleList[nextIndex];
  if (!member) return null;

  return { member, rotationIndex: nextIndex };
}

/**
 * Tự động tạo phân công cho năm và lễ tiếp theo.
 * Tự động chọn người kế tiếp trong vòng xoay.
 */
export async function autoAssignNextCeremony(
  poolId: string,
  year: number,
  ceremonyType: CauDuongCeremonyType,
  createdBy: string,
  notes?: string,
): Promise<CauDuongAssignment> {
  const currentYear = new Date().getFullYear();
  const next = await getNextHostInRotation(poolId, currentYear);

  if (!next) throw new Error('Không có thành viên đủ điều kiện trong nhóm');

  return createCauDuongAssignment({
    pool_id: poolId,
    year,
    ceremony_type: ceremonyType,
    host_person_id: next.member.person.id,
    actual_host_person_id: undefined,
    status: 'scheduled',
    scheduled_date: undefined,
    actual_date: undefined,
    reason: undefined,
    notes: notes ?? undefined,
    rotation_index: next.rotationIndex,
    created_by: createdBy,
  });
}

/**
 * Cập nhật trạng thái: ủy quyền cho người khác
 */
export async function delegateCauDuong(
  assignmentId: string,
  actualHostPersonId: string,
  reason: string,
): Promise<CauDuongAssignment> {
  return updateCauDuongAssignment(assignmentId, {
    actual_host_person_id: actualHostPersonId,
    status: 'delegated',
    reason,
  });
}

/**
 * Cập nhật trạng thái: đổi ngày (sớm hoặc muộn hơn)
 */
export async function rescheduleCauDuong(
  assignmentId: string,
  actualDate: string,
  reason: string,
): Promise<CauDuongAssignment> {
  return updateCauDuongAssignment(assignmentId, {
    actual_date: actualDate,
    status: 'rescheduled',
    reason,
  });
}

/**
 * Đánh dấu hoàn thành
 */
export async function completeCauDuong(
  assignmentId: string,
  actualDate?: string,
  notes?: string,
): Promise<CauDuongAssignment> {
  return updateCauDuongAssignment(assignmentId, {
    status: 'completed',
    actual_date: actualDate ?? undefined,
    notes: notes ?? undefined,
  });
}

/**
 * Lấy lịch sử phân công có kèm thông tin người (join với people)
 */
export async function getCauDuongAssignmentsWithPeople(
  poolId: string,
  year?: number,
): Promise<Array<CauDuongAssignment & { host_person: Person | null; actual_host_person: Person | null }>> {
  const assignments = await getCauDuongAssignments(poolId, year);

  if (assignments.length === 0) return [];

  // Collect all person IDs needed
  const personIds = new Set<string>();
  for (const a of assignments) {
    if (a.host_person_id) personIds.add(a.host_person_id);
    if (a.actual_host_person_id) personIds.add(a.actual_host_person_id);
  }

  if (personIds.size === 0) return assignments.map(a => ({ ...a, host_person: null, actual_host_person: null }));

  const { data: people, error } = await supabase
    .from('people')
    .select('*')
    .in('id', Array.from(personIds));

  if (error) throw error;

  const peopleById = new Map<string, Person>((people || []).map(p => [p.id, p]));

  return assignments.map(a => ({
    ...a,
    host_person: a.host_person_id ? (peopleById.get(a.host_person_id) ?? null) : null,
    actual_host_person: a.actual_host_person_id
      ? (peopleById.get(a.actual_host_person_id) ?? null)
      : null,
  }));
}
