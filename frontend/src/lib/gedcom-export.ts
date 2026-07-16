/**
 * @project AncestorTree
 * @file src/lib/gedcom-export.ts
 * @description GEDCOM 7.0 export utility with Vietnamese extension tags
 * @version 2.0.0
 * @updated 2026-03-09
 */

import type { TreeData } from './supabase-data';
import type { Person, Family } from '@/types';

const GEDCOM_MONTHS = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];

function personXref(id: string): string {
  return `@I${id.replace(/-/g, '')}@`;
}

function familyXref(id: string): string {
  return `@F${id.replace(/-/g, '')}@`;
}

function formatGedcomDate(dateStr?: string, year?: number): string {
  if (dateStr) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return `${d.getDate()} ${GEDCOM_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    }
  }
  if (year) {
    return String(year);
  }
  return '';
}

/** GEDCOM 7.0 line builder — uses CONT for newlines only (CONC removed in 7.0, max line 4096) */
function gedcomLine(level: number, tag: string, value?: string): string {
  if (value == null) return `${level} ${tag}`;

  const textLines = value.split('\n');
  const output: string[] = [];

  for (let i = 0; i < textLines.length; i++) {
    if (i === 0) {
      output.push(`${level} ${tag} ${textLines[i]}`);
    } else {
      output.push(`${level + 1} CONT ${textLines[i]}`);
    }
  }

  return output.join('\n');
}

/** Split Vietnamese display_name into Given /Surname/ (last-space heuristic) */
function splitVietnameseName(person: Person): { given: string; surname: string } {
  if (person.surname) {
    const given = [person.first_name, person.middle_name].filter(Boolean).join(' ') || person.display_name;
    return { given, surname: person.surname };
  }
  const parts = person.display_name.trim().split(' ');
  if (parts.length <= 1) return { given: person.display_name, surname: '' };
  const surname = parts[0];
  const given = parts.slice(1).join(' ');
  return { given, surname };
}

function buildPersonRecord(
  person: Person,
  familyMap: Map<string, string[]>,
  childFamilyMap: Map<string, string[]>,
): string {
  const lines: string[] = [];
  const xref = personXref(person.id);

  lines.push(`0 ${xref} INDI`);

  // Name
  const { given, surname } = splitVietnameseName(person);
  lines.push(gedcomLine(1, 'NAME', `${given} /${surname}/`));
  if (given) lines.push(gedcomLine(2, 'GIVN', given));
  if (surname) lines.push(gedcomLine(2, 'SURN', surname));

  // Sex
  lines.push(gedcomLine(1, 'SEX', person.gender === 1 ? 'M' : person.gender === 2 ? 'F' : 'U'));

  // Birth
  const birthDate = formatGedcomDate(person.birth_date, person.birth_year);
  if (birthDate || person.birth_place) {
    lines.push('1 BIRT');
    if (birthDate) lines.push(gedcomLine(2, 'DATE', birthDate));
    if (person.birth_place) lines.push(gedcomLine(2, 'PLAC', person.birth_place));
  }

  // Death
  if (!person.is_living) {
    const deathDate = formatGedcomDate(person.death_date, person.death_year);
    if (deathDate || person.death_place) {
      lines.push('1 DEAT');
      if (deathDate) lines.push(gedcomLine(2, 'DATE', deathDate));
      if (person.death_place) lines.push(gedcomLine(2, 'PLAC', person.death_place));
    } else {
      lines.push('1 DEAT Y');
    }
  }

  // Occupation
  if (person.occupation) {
    lines.push(gedcomLine(1, 'OCCU', person.occupation));
  }

  // Notes (biography + notes)
  const noteText = [person.biography, person.notes].filter(Boolean).join('\n\n');
  if (noteText) {
    lines.push(gedcomLine(1, 'NOTE', noteText));
  }

  // Extension tags — generation and chi branch
  if (person.generation != null) {
    lines.push(gedcomLine(1, '_GENER', String(person.generation)));
  }
  if (person.chi != null) {
    lines.push(gedcomLine(1, '_CHI', String(person.chi)));
  }

  // Family links: as spouse/parent (FAMS)
  const spouseFamilies = familyMap.get(person.id) || [];
  for (const fid of spouseFamilies) {
    lines.push(gedcomLine(1, 'FAMS', familyXref(fid)));
  }

  // Family links: as child (FAMC)
  const childFamilies = childFamilyMap.get(person.id) || [];
  for (const fid of childFamilies) {
    lines.push(gedcomLine(1, 'FAMC', familyXref(fid)));
  }

  return lines.join('\n');
}

function buildFamilyRecord(
  family: Family,
  childrenIds: string[],
  peopleSet: Set<string>,
): string {
  const lines: string[] = [];
  const xref = familyXref(family.id);

  lines.push(`0 ${xref} FAM`);

  if (family.father_id && peopleSet.has(family.father_id)) {
    lines.push(gedcomLine(1, 'HUSB', personXref(family.father_id)));
  }
  if (family.mother_id && peopleSet.has(family.mother_id)) {
    lines.push(gedcomLine(1, 'WIFE', personXref(family.mother_id)));
  }

  // Marriage
  const marriageDate = formatGedcomDate(family.marriage_date);
  if (marriageDate || family.marriage_place) {
    lines.push('1 MARR');
    if (marriageDate) lines.push(gedcomLine(2, 'DATE', marriageDate));
    if (family.marriage_place) lines.push(gedcomLine(2, 'PLAC', family.marriage_place));
  }

  // Divorce
  if (family.divorce_date) {
    lines.push('1 DIV');
    lines.push(gedcomLine(2, 'DATE', formatGedcomDate(family.divorce_date)));
  }

  // Children (sorted by sort_order via data.children ordering)
  for (const childId of childrenIds) {
    if (peopleSet.has(childId)) {
      lines.push(gedcomLine(1, 'CHIL', personXref(childId)));
    }
  }

  return lines.join('\n');
}

export function generateGedcom(data: TreeData): string {
  // Filter out private people (privacy_level === 2) — PII fields (phone, email, etc.) NOT exported
  const people = data.people.filter(p => p.privacy_level !== 2);
  const peopleSet = new Set(people.map(p => p.id));

  // Build family lookup maps
  const familyMap = new Map<string, string[]>();
  const childFamilyMap = new Map<string, string[]>();
  const familyChildrenMap = new Map<string, string[]>();

  for (const family of data.families) {
    if (family.father_id && peopleSet.has(family.father_id)) {
      const existing = familyMap.get(family.father_id) || [];
      existing.push(family.id);
      familyMap.set(family.father_id, existing);
    }
    if (family.mother_id && peopleSet.has(family.mother_id)) {
      const existing = familyMap.get(family.mother_id) || [];
      existing.push(family.id);
      familyMap.set(family.mother_id, existing);
    }
  }

  for (const child of data.children) {
    if (peopleSet.has(child.person_id)) {
      const existing = childFamilyMap.get(child.person_id) || [];
      existing.push(child.family_id);
      childFamilyMap.set(child.person_id, existing);
    }
    const famChildren = familyChildrenMap.get(child.family_id) || [];
    famChildren.push(child.person_id);
    familyChildrenMap.set(child.family_id, famChildren);
  }

  // Build GEDCOM 7.0 content
  const now = new Date();
  const dateStr = `${now.getDate()} ${GEDCOM_MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  const sections: string[] = [];

  // Header — GEDCOM 7.0 format
  sections.push([
    '0 HEAD',
    '1 GEDC',
    '2 VERS 7.0',
    '1 SOUR AncestorTree',
    '2 VERS 2.6.0',
    '2 NAME Gia Pha Dien Tu',
    `1 DATE ${dateStr}`,
    '1 SUBM @SUB1@',
    '1 SCHMA',
    '2 TAG _GENER https://ancestortree.info/gedcom/generation',
    '2 TAG _CHI https://ancestortree.info/gedcom/chi-branch',
  ].join('\n'));

  // Submitter
  sections.push([
    '0 @SUB1@ SUBM',
    '1 NAME AncestorTree Export',
  ].join('\n'));

  // Individual records
  for (const person of people) {
    sections.push(buildPersonRecord(person, familyMap, childFamilyMap));
  }

  // Family records
  for (const family of data.families) {
    const hasVisibleParent =
      (family.father_id && peopleSet.has(family.father_id)) ||
      (family.mother_id && peopleSet.has(family.mother_id));
    if (!hasVisibleParent) continue;

    const childrenIds = familyChildrenMap.get(family.id) || [];
    sections.push(buildFamilyRecord(family, childrenIds, peopleSet));
  }

  // Trailer
  sections.push('0 TRLR');

  // GEDCOM 7.0: UTF-8 with BOM
  return '\uFEFF' + sections.join('\n') + '\n';
}

export interface GedcomValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateGedcom(content: string): GedcomValidationResult {
  const errors: string[] = [];
  const stripped = content.replace(/^\uFEFF/, '');

  if (!stripped.startsWith('0 HEAD')) {
    errors.push('Missing HEAD record');
  }
  if (!stripped.trimEnd().endsWith('0 TRLR')) {
    errors.push('Missing TRLR record');
  }

  const indiRefs = new Set<string>();
  const famRefs = new Set<string>();
  const lines = stripped.split('\n');

  for (const line of lines) {
    const indiMatch = line.match(/^0 (@I[^@]+@) INDI/);
    if (indiMatch) indiRefs.add(indiMatch[1]);

    const famMatch = line.match(/^0 (@F[^@]+@) FAM/);
    if (famMatch) famRefs.add(famMatch[1]);
  }

  for (const line of lines) {
    const husbMatch = line.match(/^1 HUSB (@I[^@]+@)/);
    if (husbMatch && !indiRefs.has(husbMatch[1])) {
      errors.push(`HUSB reference ${husbMatch[1]} not found`);
    }
    const wifeMatch = line.match(/^1 WIFE (@I[^@]+@)/);
    if (wifeMatch && !indiRefs.has(wifeMatch[1])) {
      errors.push(`WIFE reference ${wifeMatch[1]} not found`);
    }
    const chilMatch = line.match(/^1 CHIL (@I[^@]+@)/);
    if (chilMatch && !indiRefs.has(chilMatch[1])) {
      errors.push(`CHIL reference ${chilMatch[1]} not found`);
    }
    const famsMatch = line.match(/^1 FAMS (@F[^@]+@)/);
    if (famsMatch && !famRefs.has(famsMatch[1])) {
      errors.push(`FAMS reference ${famsMatch[1]} not found`);
    }
    const famcMatch = line.match(/^1 FAMC (@F[^@]+@)/);
    if (famcMatch && !famRefs.has(famcMatch[1])) {
      errors.push(`FAMC reference ${famcMatch[1]} not found`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function downloadGedcom(content: string, filename?: string): void {
  const date = new Date().toISOString().slice(0, 10);
  const name = filename || `ancestortree-${date}.ged`;
  const blob = new Blob([content], { type: 'text/x-gedcom;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
