/**
 * @project AncestorTree
 * @file src/lib/stats-calculator.ts
 * @description Detailed stats computation from TreeData for dashboard charts
 * @version 1.0.0
 * @updated 2026-03-09
 */

import type { TreeData } from './supabase-data';

export interface GenerationStat {
  generation: number;
  count: number;
  label: string;
}

export interface ChiStat {
  chi: number;
  count: number;
  label: string;
}

export interface GenderStat {
  name: string;
  value: number;
}

export interface LivingStat {
  name: string;
  value: number;
}

export interface DetailedStats {
  totalPeople: number;
  totalFamilies: number;
  totalGenerations: number;
  totalChi: number;
  livingCount: number;
  deceasedCount: number;
  avgChildrenPerFamily: number;
  childlessRate: number;
  generationStats: GenerationStat[];
  chiStats: ChiStat[];
  genderStats: GenderStat[];
  livingStats: LivingStat[];
}

export function calculateDetailedStats(data: TreeData): DetailedStats {
  const { people, families, children } = data;

  // Basic counts
  const totalPeople = people.length;
  const totalFamilies = families.length;
  const livingCount = people.filter(p => p.is_living).length;
  const deceasedCount = totalPeople - livingCount;

  // Generation stats
  const genMap = new Map<number, number>();
  for (const p of people) {
    genMap.set(p.generation, (genMap.get(p.generation) || 0) + 1);
  }
  const generations = [...genMap.keys()].sort((a, b) => a - b);
  const generationStats: GenerationStat[] = generations.map(gen => ({
    generation: gen,
    count: genMap.get(gen) || 0,
    label: `Đời ${gen}`,
  }));

  // Chi stats
  const chiMap = new Map<number, number>();
  for (const p of people) {
    if (p.chi != null) {
      chiMap.set(p.chi, (chiMap.get(p.chi) || 0) + 1);
    }
  }
  const chiKeys = [...chiMap.keys()].sort((a, b) => a - b);
  const chiStats: ChiStat[] = chiKeys.map(chi => ({
    chi,
    count: chiMap.get(chi) || 0,
    label: `Chi ${chi}`,
  }));

  // Gender stats
  const maleCount = people.filter(p => p.gender === 1).length;
  const femaleCount = people.filter(p => p.gender === 2).length;
  const genderStats: GenderStat[] = [
    { name: 'Nam', value: maleCount },
    { name: 'Nữ', value: femaleCount },
  ];

  // Living stats
  const livingStats: LivingStat[] = [
    { name: 'Còn sống', value: livingCount },
    { name: 'Đã mất', value: deceasedCount },
  ];

  // Average children per family
  const familiesWithChildren = new Set(children.map(c => c.family_id));
  const totalChildRelations = children.length;
  const avgChildrenPerFamily = familiesWithChildren.size > 0
    ? Math.round((totalChildRelations / familiesWithChildren.size) * 10) / 10
    : 0;

  // Childless rate: people who have no children entries as parent
  const familyMap = new Map(families.map(f => [f.id, f]));
  const parentsWithChildren = new Set<string>();
  for (const c of children) {
    const family = familyMap.get(c.family_id);
    if (family?.father_id) parentsWithChildren.add(family.father_id);
    if (family?.mother_id) parentsWithChildren.add(family.mother_id);
  }
  // Count people who could have children (adults, i.e., not the youngest generation)
  const maxGen = generations.length > 0 ? generations[generations.length - 1] : 0;
  const potentialParents = people.filter(p => p.generation < maxGen);
  const childlessCount = potentialParents.filter(p => !parentsWithChildren.has(p.id)).length;
  const childlessRate = potentialParents.length > 0
    ? Math.round((childlessCount / potentialParents.length) * 100)
    : 0;

  return {
    totalPeople,
    totalFamilies,
    totalGenerations: generations.length,
    totalChi: chiKeys.length,
    livingCount,
    deceasedCount,
    avgChildrenPerFamily,
    childlessRate,
    generationStats,
    chiStats,
    genderStats,
    livingStats,
  };
}
