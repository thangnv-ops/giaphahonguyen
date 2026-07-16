/**
 * @project AncestorTree
 * @file src/lib/csv-export.ts
 * @description CSV export utility — UTF-8 BOM for Excel compatibility
 * @version 1.0.0
 * @updated 2026-03-09
 */

import type { TreeData } from './supabase-data';

const CSV_HEADERS = [
  'Họ tên', 'Giới tính', 'Đời', 'Chi', 'Năm sinh', 'Nơi sinh',
  'Năm mất', 'Còn sống', 'Nghề nghiệp', 'Tên cha', 'Tên mẹ',
];

function escapeCsv(value: string | number | undefined | null): string {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateCsv(data: TreeData): string {
  const { people, families, children } = data;

  // Build parent lookup: personId → { fatherName, motherName }
  const familyMap = new Map(families.map(f => [f.id, f]));
  const personNameMap = new Map(people.map(p => [p.id, p.display_name]));

  const childToParents = new Map<string, { fatherName: string; motherName: string }>();
  for (const c of children) {
    const family = familyMap.get(c.family_id);
    if (family) {
      childToParents.set(c.person_id, {
        fatherName: family.father_id ? (personNameMap.get(family.father_id) || '') : '',
        motherName: family.mother_id ? (personNameMap.get(family.mother_id) || '') : '',
      });
    }
  }

  // Filter out private people (privacy_level === 2)
  const visiblePeople = people.filter(p => p.privacy_level !== 2);

  const rows: string[] = [];
  rows.push(CSV_HEADERS.map(escapeCsv).join(','));

  for (const person of visiblePeople) {
    const parents = childToParents.get(person.id);
    const row = [
      person.display_name,
      person.gender === 1 ? 'Nam' : person.gender === 2 ? 'Nữ' : '',
      person.generation,
      person.chi ?? '',
      person.birth_year ?? '',
      person.birth_place ?? '',
      person.death_year ?? '',
      person.is_living ? 'Có' : 'Không',
      person.occupation ?? '',
      parents?.fatherName ?? '',
      parents?.motherName ?? '',
    ];
    rows.push(row.map(escapeCsv).join(','));
  }

  // UTF-8 BOM for Excel
  return '\uFEFF' + rows.join('\n') + '\n';
}

export function downloadCsv(content: string, filename?: string): void {
  const date = new Date().toISOString().slice(0, 10);
  const name = filename || `ancestortree-${date}.csv`;
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
