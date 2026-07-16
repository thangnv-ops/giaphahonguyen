/**
 * @project AncestorTree
 * @file src/lib/duplicate-detection.ts
 * @description Duplicate detection with composite scoring and Vietnamese name comparison
 * @version 1.0.0
 * @updated 2026-03-09
 */

import type { Person, DuplicateScore, DuplicatePair } from '@/types';
import type { TreeData } from './supabase-data';

// ─── Vietnamese Name Utilities ───────────────────────────────────────────────

/** Remove Vietnamese diacritics: NFD decompose → strip combining marks → lowercase */
function removeDiacritics(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/** Split Vietnamese name: first word = Họ, last word = Tên, middle = Đệm */
function splitName(displayName: string): { ho: string; dem: string; ten: string } {
  const parts = displayName.trim().split(/\s+/);
  if (parts.length === 0) return { ho: '', dem: '', ten: '' };
  if (parts.length === 1) return { ho: parts[0], dem: '', ten: '' };
  if (parts.length === 2) return { ho: parts[0], dem: '', ten: parts[1] };
  return {
    ho: parts[0],
    dem: parts.slice(1, -1).join(' '),
    ten: parts[parts.length - 1],
  };
}

/** Levenshtein distance */
function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= a.length; i++) matrix[i] = [i];
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }
  return matrix[a.length][b.length];
}

/** Compare two Vietnamese names with weighted scoring: Tên 0.5, Họ 0.3, Đệm 0.2 */
function compareNames(nameA: string, nameB: string): number {
  const a = splitName(nameA);
  const b = splitName(nameB);

  const normA = { ho: removeDiacritics(a.ho), dem: removeDiacritics(a.dem), ten: removeDiacritics(a.ten) };
  const normB = { ho: removeDiacritics(b.ho), dem: removeDiacritics(b.dem), ten: removeDiacritics(b.ten) };

  function partScore(pa: string, pb: string): number {
    if (!pa && !pb) return 1;
    if (!pa || !pb) return 0.5;
    const maxLen = Math.max(pa.length, pb.length);
    if (maxLen === 0) return 1;
    return 1 - levenshtein(pa, pb) / maxLen;
  }

  const tenScore = partScore(normA.ten, normB.ten);
  const hoScore = partScore(normA.ho, normB.ho);
  const demScore = partScore(normA.dem, normB.dem);

  return tenScore * 0.5 + hoScore * 0.3 + demScore * 0.2;
}

// ─── Scoring Functions ───────────────────────────────────────────────────────

function scoreBirthYear(a: Person, b: Person): number {
  if (!a.birth_year || !b.birth_year) return 0.5; // neutral if unknown
  const diff = Math.abs(a.birth_year - b.birth_year);
  if (diff > 10) return -1; // veto signal
  return Math.max(0, 1 - diff / 10);
}

function scoreGeneration(a: Person, b: Person): number {
  const diff = Math.abs(a.generation - b.generation);
  if (diff === 0) return 1;
  if (diff === 1) return 0.5;
  return 0;
}

// ─── Main Detection ─────────────────────────────────────────────────────────

export function findDuplicates(data: TreeData): DuplicatePair[] {
  const { people, families, children } = data;

  // Build father lookup: personId → fatherId
  const personFatherMap = new Map<string, string>();
  const familyFatherMap = new Map<string, string>();
  for (const f of families) {
    if (f.father_id) familyFatherMap.set(f.id, f.father_id);
  }
  for (const c of children) {
    const fatherId = familyFatherMap.get(c.family_id);
    if (fatherId) personFatherMap.set(c.person_id, fatherId);
  }

  // Blocking: group by surname (first word, normalized)
  const blocks = new Map<string, Person[]>();
  for (const p of people) {
    const { ho } = splitName(p.display_name);
    const key = removeDiacritics(ho) || '__unknown__';
    const group = blocks.get(key) || [];
    group.push(p);
    blocks.set(key, group);
  }

  const pairs: DuplicatePair[] = [];

  for (const group of blocks.values()) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i];
        const b = group[j];

        // Veto: gender mismatch
        if (a.gender !== b.gender) continue;

        // Veto: generation diff > 1 (blocking strategy)
        if (Math.abs(a.generation - b.generation) > 1) continue;

        // Veto: birth year diff > 10
        const birthYearScore = scoreBirthYear(a, b);
        if (birthYearScore === -1) continue;

        // Calculate scores
        const nameScore = compareNames(a.display_name, b.display_name);

        // Father score
        let fatherScore = 0.5; // neutral default
        const fatherA = personFatherMap.get(a.id);
        const fatherB = personFatherMap.get(b.id);
        if (fatherA && fatherB) {
          fatherScore = fatherA === fatherB ? 1.0 : 0.0;
        }

        const generationScore = scoreGeneration(a, b);
        const genderScore = 1.0; // passed veto

        const total =
          nameScore * 0.30 +
          fatherScore * 0.25 +
          birthYearScore * 0.20 +
          generationScore * 0.15 +
          genderScore * 0.10;

        if (total < 0.60) continue;

        const score: DuplicateScore = {
          name: nameScore,
          father: fatherScore,
          birthYear: birthYearScore,
          generation: generationScore,
          gender: genderScore,
          total,
        };

        pairs.push({
          personA: a,
          personB: b,
          score,
          level: total >= 0.85 ? 'HIGH' : 'MEDIUM',
        });
      }
    }
  }

  // Sort by score descending
  pairs.sort((a, b) => b.score.total - a.score.total);

  return pairs;
}
