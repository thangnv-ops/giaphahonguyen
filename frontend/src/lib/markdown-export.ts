/**
 * @project AncestorTree
 * @file src/lib/markdown-export.ts
 * @description Markdown export — gia phả dạng văn bản grouped by generation
 * @version 1.0.0
 * @updated 2026-03-09
 */

import type { TreeData } from './supabase-data';

export function generateMarkdown(data: TreeData, clanName?: string): string {
  const { people, families, children } = data;

  // Build lookups
  const familyMap = new Map(families.map(f => [f.id, f]));
  const personMap = new Map(people.map(p => [p.id, p]));

  // Build parent lookup: personId → { fatherName, motherName }
  const childToParents = new Map<string, { fatherId?: string; motherId?: string }>();
  for (const c of children) {
    const family = familyMap.get(c.family_id);
    if (family) {
      childToParents.set(c.person_id, {
        fatherId: family.father_id,
        motherId: family.mother_id,
      });
    }
  }

  // Build bidirectional spouse lookup: personId → spouse names
  const spouseMap = new Map<string, string[]>();
  for (const family of families) {
    if (family.father_id && family.mother_id) {
      const motherName = personMap.get(family.mother_id)?.display_name;
      if (motherName) {
        const existing = spouseMap.get(family.father_id) || [];
        existing.push(motherName);
        spouseMap.set(family.father_id, existing);
      }
      const fatherName = personMap.get(family.father_id)?.display_name;
      if (fatherName) {
        const existing = spouseMap.get(family.mother_id) || [];
        existing.push(fatherName);
        spouseMap.set(family.mother_id, existing);
      }
    }
  }

  // Build children lookup: personId → children names (as father)
  const fatherChildrenMap = new Map<string, string[]>();
  for (const family of families) {
    if (!family.father_id) continue;
    const familyChildren = children
      .filter(c => c.family_id === family.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(c => personMap.get(c.person_id)?.display_name)
      .filter(Boolean) as string[];
    if (familyChildren.length > 0) {
      const existing = fatherChildrenMap.get(family.father_id) || [];
      fatherChildrenMap.set(family.father_id, [...existing, ...familyChildren]);
    }
  }

  // Filter and group by generation
  const visiblePeople = people.filter(p => p.privacy_level !== 2);
  const genMap = new Map<number, typeof visiblePeople>();
  for (const p of visiblePeople) {
    const group = genMap.get(p.generation) || [];
    group.push(p);
    genMap.set(p.generation, group);
  }

  const generations = [...genMap.keys()].sort((a, b) => a - b);

  const lines: string[] = [];
  const title = clanName || 'Gia phả';
  lines.push(`# ${title}`);
  lines.push('');
  lines.push(`> Xuất ngày ${new Date().toISOString().slice(0, 10)} — AncestorTree`);
  lines.push('');

  for (const gen of generations) {
    const members = genMap.get(gen) || [];
    members.sort((a, b) => a.display_name.localeCompare(b.display_name, 'vi'));

    const genLabel = gen === generations[0] ? `Đời ${gen} (Thủy tổ)` : `Đời ${gen}`;
    lines.push(`## ${genLabel}`);
    lines.push('');

    for (const person of members) {
      const years = [person.birth_year, person.death_year].filter(Boolean).join('–');
      const nameWithYears = years ? `${person.display_name} (${years})` : person.display_name;
      lines.push(`### ${nameWithYears}`);
      lines.push('');

      lines.push(`- Giới tính: ${person.gender === 1 ? 'Nam' : 'Nữ'}`);

      if (person.birth_place) lines.push(`- Nơi sinh: ${person.birth_place}`);
      if (!person.is_living) lines.push(`- Đã mất${person.death_place ? `: ${person.death_place}` : ''}`);

      // Spouse
      const spouses = spouseMap.get(person.id);
      if (spouses && spouses.length > 0) {
        const label = person.gender === 1 ? 'Vợ' : 'Chồng';
        lines.push(`- ${label}: ${spouses.join(', ')}`);
      }

      // Children
      const personChildren = fatherChildrenMap.get(person.id);
      if (personChildren && personChildren.length > 0) {
        lines.push(`- Con: ${personChildren.join(', ')}`);
      }

      // Parents
      const parents = childToParents.get(person.id);
      if (parents) {
        const fatherName = parents.fatherId ? personMap.get(parents.fatherId)?.display_name : undefined;
        const motherName = parents.motherId ? personMap.get(parents.motherId)?.display_name : undefined;
        if (fatherName) lines.push(`- Cha: ${fatherName}`);
        if (motherName) lines.push(`- Mẹ: ${motherName}`);
      }

      if (person.occupation) lines.push(`- Nghề nghiệp: ${person.occupation}`);

      lines.push('');
    }
  }

  return lines.join('\n');
}

export function downloadMarkdown(content: string, filename?: string): void {
  const date = new Date().toISOString().slice(0, 10);
  const name = filename || `gia-pha-${date}.md`;
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
