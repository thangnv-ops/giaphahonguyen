/**
 * @project AncestorTree
 * @file src/lib/gedcom-import.ts
 * @description GEDCOM 7.0 / 5.5.1 import: parser, mapper, validator
 * @version 1.0.0
 * @updated 2026-03-09
 */

import type { Person, Family } from '@/types';
import type { TreeData } from './supabase-data';
import { findDuplicates } from './duplicate-detection';
import type { DuplicatePair } from '@/types';

// ─── Parser Types ───────────────────────────────────────────────────────────

export interface GedcomIndividual {
  xref: string;
  name: { given: string; surname: string; full: string };
  sex: 'M' | 'F' | 'U';
  birth: { date?: string; place?: string };
  death: { date?: string; place?: string };
  occupation?: string;
  note?: string;
  familyAsChild: string[];
  familyAsSpouse: string[];
}

export interface GedcomFamily {
  xref: string;
  husband?: string;
  wife?: string;
  children: string[];
  marriage: { date?: string; place?: string };
}

export interface GedcomHeader {
  version: string;
  source?: string;
  charset?: string;
}

export interface GedcomParseResult {
  header: GedcomHeader;
  individuals: GedcomIndividual[];
  families: GedcomFamily[];
  errors: string[];
}

// ─── Parser ─────────────────────────────────────────────────────────────────

interface GedcomLine {
  level: number;
  xref?: string;
  tag: string;
  value?: string;
}

function parseLine(raw: string): GedcomLine | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // GEDCOM line: LEVEL [XREF] TAG [VALUE]
  const match = trimmed.match(/^(\d+)\s+(?:(@[^@]+@)\s+)?(\S+)(?:\s+(.*))?$/);
  if (!match) return null;

  return {
    level: parseInt(match[1], 10),
    xref: match[2],
    tag: match[3],
    value: match[4],
  };
}

function collectContinuations(lines: GedcomLine[], startIdx: number, level: number): { text: string; nextIdx: number } {
  let text = lines[startIdx].value || '';
  let idx = startIdx + 1;

  while (idx < lines.length && lines[idx].level > level) {
    const line = lines[idx];
    if (line.tag === 'CONT') {
      text += '\n' + (line.value || '');
    } else if (line.tag === 'CONC') {
      // GEDCOM 5.5.1 continuation without newline
      text += (line.value || '');
    }
    idx++;
  }

  return { text, nextIdx: idx };
}

function parseGedcomDate(dateStr?: string): { date?: string; year?: number } {
  if (!dateStr) return {};

  // Try full date: DD MMM YYYY
  const fullMatch = dateStr.match(/(\d{1,2})\s+([A-Z]{3})\s+(\d{3,4})/);
  if (fullMatch) {
    const months: Record<string, string> = {
      JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
      JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12',
    };
    const month = months[fullMatch[2]] || '01';
    const day = fullMatch[1].padStart(2, '0');
    return { date: `${fullMatch[3]}-${month}-${day}`, year: parseInt(fullMatch[3], 10) };
  }

  // Year only
  const yearMatch = dateStr.match(/(\d{3,4})/);
  if (yearMatch) {
    return { year: parseInt(yearMatch[1], 10) };
  }

  return {};
}

const MAX_GEDCOM_SIZE = 10 * 1024 * 1024; // 10MB — defense-in-depth (OWASP A05)

export function parseGedcom(content: string): GedcomParseResult {
  const errors: string[] = [];

  if (content.length > MAX_GEDCOM_SIZE) {
    errors.push(`File quá lớn (${(content.length / 1024 / 1024).toFixed(1)}MB, tối đa 10MB)`);
    return {
      header: { version: 'unknown' },
      individuals: [],
      families: [],
      errors,
    };
  }

  // Strip BOM
  const stripped = content.replace(/^\uFEFF/, '');
  const rawLines = stripped.split(/\r?\n/);

  const gedcomLines: GedcomLine[] = [];
  for (let i = 0; i < rawLines.length; i++) {
    const parsed = parseLine(rawLines[i]);
    if (parsed) gedcomLines.push(parsed);
  }

  if (gedcomLines.length === 0) {
    return { header: { version: 'unknown' }, individuals: [], families: [], errors: ['File rỗng hoặc không phải định dạng GEDCOM'] };
  }

  // Parse header
  const header: GedcomHeader = { version: 'unknown' };
  let idx = 0;

  // Find HEAD
  if (gedcomLines[0]?.tag === 'HEAD') {
    idx = 1;
    while (idx < gedcomLines.length && gedcomLines[idx].level > 0) {
      const line = gedcomLines[idx];
      if (line.tag === 'VERS' && line.level === 2) {
        header.version = line.value || 'unknown';
      }
      if (line.tag === 'SOUR' && line.level === 1) {
        header.source = line.value;
      }
      if (line.tag === 'CHAR' && line.level === 1) {
        header.charset = line.value;
      }
      idx++;
    }
  }

  // Parse records
  const individuals: GedcomIndividual[] = [];
  const families: GedcomFamily[] = [];

  while (idx < gedcomLines.length) {
    const line = gedcomLines[idx];

    if (line.level === 0 && line.tag === 'INDI' && line.xref) {
      const indi = parseIndividual(gedcomLines, idx, line.xref, errors);
      individuals.push(indi.individual);
      idx = indi.nextIdx;
      continue;
    }

    if (line.level === 0 && line.tag === 'FAM' && line.xref) {
      const fam = parseFamilyRecord(gedcomLines, idx, line.xref);
      families.push(fam.family);
      idx = fam.nextIdx;
      continue;
    }

    idx++;
  }

  return { header, individuals, families, errors };
}

function parseIndividual(
  lines: GedcomLine[],
  startIdx: number,
  xref: string,
  errors: string[],
): { individual: GedcomIndividual; nextIdx: number } {
  const indi: GedcomIndividual = {
    xref,
    name: { given: '', surname: '', full: '' },
    sex: 'U',
    birth: {},
    death: {},
    familyAsChild: [],
    familyAsSpouse: [],
  };

  let idx = startIdx + 1;
  while (idx < lines.length && lines[idx].level > 0) {
    const line = lines[idx];

    switch (line.tag) {
      case 'NAME': {
        const nameStr = line.value || '';
        // Parse "Given /Surname/" format
        const nameMatch = nameStr.match(/^(.*?)\s*\/([^/]*)\//);
        if (nameMatch) {
          indi.name.given = nameMatch[1].trim();
          indi.name.surname = nameMatch[2].trim();
          indi.name.full = `${indi.name.surname} ${indi.name.given}`.trim();
        } else {
          indi.name.full = nameStr.trim();
        }
        // Check for GIVN/SURN sub-tags
        let j = idx + 1;
        while (j < lines.length && lines[j].level > line.level) {
          if (lines[j].tag === 'GIVN') indi.name.given = lines[j].value || '';
          if (lines[j].tag === 'SURN') indi.name.surname = lines[j].value || '';
          j++;
        }
        if (indi.name.surname && indi.name.given && !indi.name.full.includes(indi.name.surname)) {
          indi.name.full = `${indi.name.surname} ${indi.name.given}`;
        }
        idx = j;
        continue;
      }
      case 'SEX':
        indi.sex = (line.value === 'M' || line.value === 'F') ? line.value : 'U';
        break;
      case 'BIRT': {
        let j = idx + 1;
        while (j < lines.length && lines[j].level > line.level) {
          if (lines[j].tag === 'DATE') indi.birth.date = lines[j].value;
          if (lines[j].tag === 'PLAC') indi.birth.place = lines[j].value;
          j++;
        }
        idx = j;
        continue;
      }
      case 'DEAT': {
        let j = idx + 1;
        while (j < lines.length && lines[j].level > line.level) {
          if (lines[j].tag === 'DATE') indi.death.date = lines[j].value;
          if (lines[j].tag === 'PLAC') indi.death.place = lines[j].value;
          j++;
        }
        idx = j;
        continue;
      }
      case 'OCCU':
        indi.occupation = line.value;
        break;
      case 'NOTE': {
        const result = collectContinuations(lines, idx, line.level);
        indi.note = result.text;
        idx = result.nextIdx;
        continue;
      }
      case 'FAMC':
        if (line.value) indi.familyAsChild.push(line.value);
        break;
      case 'FAMS':
        if (line.value) indi.familyAsSpouse.push(line.value);
        break;
    }
    idx++;
  }

  if (!indi.name.full) {
    errors.push(`INDI ${xref}: tên trống`);
  }

  return { individual: indi, nextIdx: idx };
}

function parseFamilyRecord(
  lines: GedcomLine[],
  startIdx: number,
  xref: string,
): { family: GedcomFamily; nextIdx: number } {
  const family: GedcomFamily = {
    xref,
    children: [],
    marriage: {},
  };

  let idx = startIdx + 1;
  while (idx < lines.length && lines[idx].level > 0) {
    const line = lines[idx];

    switch (line.tag) {
      case 'HUSB':
        family.husband = line.value;
        break;
      case 'WIFE':
        family.wife = line.value;
        break;
      case 'CHIL':
        if (line.value) family.children.push(line.value);
        break;
      case 'MARR': {
        let j = idx + 1;
        while (j < lines.length && lines[j].level > line.level) {
          if (lines[j].tag === 'DATE') family.marriage.date = lines[j].value;
          if (lines[j].tag === 'PLAC') family.marriage.place = lines[j].value;
          j++;
        }
        idx = j;
        continue;
      }
    }
    idx++;
  }

  return { family, nextIdx: idx };
}

// ─── Mapper ─────────────────────────────────────────────────────────────────

export interface ImportMapping {
  people: Omit<Person, 'id' | 'created_at' | 'updated_at'>[];
  families: Omit<Family, 'id' | 'created_at' | 'updated_at'>[];
  children: { family_handle: string; person_handle: string; sort_order: number }[];
  xrefToHandle: Map<string, string>;
}

function xrefToHandle(xref: string): string {
  return xref.replace(/@/g, '').toLowerCase();
}

export function mapGedcomToAncestorTree(parseResult: GedcomParseResult): ImportMapping {
  const { individuals, families } = parseResult;

  const xrefMap = new Map<string, string>();
  for (const indi of individuals) {
    xrefMap.set(indi.xref, xrefToHandle(indi.xref));
  }
  for (const fam of families) {
    xrefMap.set(fam.xref, xrefToHandle(fam.xref));
  }

  // Auto-calculate generations via DFS
  // Build parent→child graph from families
  const childToParentXrefs = new Map<string, string[]>();
  for (const fam of families) {
    const parents: string[] = [];
    if (fam.husband) parents.push(fam.husband);
    if (fam.wife) parents.push(fam.wife);
    for (const childXref of fam.children) {
      const existing = childToParentXrefs.get(childXref) || [];
      childToParentXrefs.set(childXref, [...existing, ...parents]);
    }
  }

  // Find roots (no parents)
  const allXrefs = new Set(individuals.map(i => i.xref));
  const rootXrefs = [...allXrefs].filter(x => !childToParentXrefs.has(x));

  // BFS from roots to assign generations
  const generationMap = new Map<string, number>();
  const parentToChildXrefs = new Map<string, string[]>();
  for (const fam of families) {
    for (const childXref of fam.children) {
      if (fam.husband) {
        const list = parentToChildXrefs.get(fam.husband) || [];
        list.push(childXref);
        parentToChildXrefs.set(fam.husband, list);
      }
      if (fam.wife) {
        const list = parentToChildXrefs.get(fam.wife) || [];
        list.push(childXref);
        parentToChildXrefs.set(fam.wife, list);
      }
    }
  }

  const queue: Array<{ xref: string; gen: number }> = rootXrefs.map(x => ({ xref: x, gen: 1 }));
  while (queue.length > 0) {
    const { xref, gen } = queue.shift()!;
    if (generationMap.has(xref)) continue;
    generationMap.set(xref, gen);
    const childXrefs = parentToChildXrefs.get(xref) || [];
    for (const child of childXrefs) {
      if (!generationMap.has(child)) {
        queue.push({ xref: child, gen: gen + 1 });
      }
    }
  }
  // Assign gen 1 to anyone without a generation (isolated nodes)
  for (const indi of individuals) {
    if (!generationMap.has(indi.xref)) generationMap.set(indi.xref, 1);
  }

  // Map individuals → people
  const people: ImportMapping['people'] = individuals.map(indi => {
    const birth = parseGedcomDate(indi.birth.date);
    const death = parseGedcomDate(indi.death.date);
    const nameParts = indi.name.full.trim().split(/\s+/);
    const surname = indi.name.surname || (nameParts.length > 1 ? nameParts[0] : '');
    const firstName = indi.name.given || (nameParts.length > 1 ? nameParts[nameParts.length - 1] : indi.name.full);

    return {
      handle: xrefToHandle(indi.xref),
      display_name: indi.name.full || `Unknown (${indi.xref})`,
      first_name: firstName,
      surname,
      gender: indi.sex === 'M' ? 1 : indi.sex === 'F' ? 2 : 1, // U/unknown defaults to male
      generation: generationMap.get(indi.xref) || 1,
      birth_date: birth.date,
      birth_year: birth.year,
      birth_place: indi.birth.place,
      death_date: death.date,
      death_year: death.year,
      death_place: indi.death.place,
      is_living: !indi.death.date && !indi.death.place,
      is_patrilineal: true,
      occupation: indi.occupation,
      biography: indi.note,
      privacy_level: 1,
    } as ImportMapping['people'][0];
  });

  // Map families
  const mappedFamilies: ImportMapping['families'] = families.map(fam => {
    const marriage = parseGedcomDate(fam.marriage.date);
    return {
      handle: xrefToHandle(fam.xref),
      father_id: fam.husband ? xrefMap.get(fam.husband) : undefined,
      mother_id: fam.wife ? xrefMap.get(fam.wife) : undefined,
      marriage_date: marriage.date,
      marriage_place: fam.marriage.place,
      sort_order: 0,
    } as ImportMapping['families'][0];
  });

  // Map children
  const mappedChildren: ImportMapping['children'] = [];
  for (const fam of families) {
    const famHandle = xrefToHandle(fam.xref);
    for (let i = 0; i < fam.children.length; i++) {
      const childHandle = xrefMap.get(fam.children[i]);
      if (childHandle) {
        mappedChildren.push({
          family_handle: famHandle,
          person_handle: childHandle,
          sort_order: i + 1,
        });
      }
    }
  }

  return { people, families: mappedFamilies, children: mappedChildren, xrefToHandle: xrefMap };
}

// ─── Validator ──────────────────────────────────────────────────────────────

export interface ImportValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    individualCount: number;
    familyCount: number;
    duplicateCount: number;
  };
  duplicates: DuplicatePair[];
}

export function validateImport(
  parseResult: GedcomParseResult,
  mapping: ImportMapping,
  existingData?: TreeData,
): ImportValidation {
  const errors: string[] = [...parseResult.errors];
  const warnings: string[] = [];

  // Check for empty import
  if (parseResult.individuals.length === 0) {
    errors.push('Không tìm thấy dữ liệu cá nhân (INDI) trong file');
  }

  // Validate names and gender
  const unknownSexCount = parseResult.individuals.filter(i => i.sex !== 'M' && i.sex !== 'F').length;
  if (unknownSexCount > 0) {
    warnings.push(`${unknownSexCount} cá nhân không rõ giới tính (SEX U) — mặc định là Nam`);
  }
  for (const person of mapping.people) {
    if (!person.display_name || person.display_name.startsWith('Unknown')) {
      warnings.push(`"${person.handle}": tên không xác định`);
    }
  }

  // Check for orphan references
  const indiXrefs = new Set(parseResult.individuals.map(i => i.xref));
  for (const fam of parseResult.families) {
    if (fam.husband && !indiXrefs.has(fam.husband)) {
      errors.push(`FAM ${fam.xref}: HUSB ${fam.husband} không tồn tại`);
    }
    if (fam.wife && !indiXrefs.has(fam.wife)) {
      errors.push(`FAM ${fam.xref}: WIFE ${fam.wife} không tồn tại`);
    }
    for (const child of fam.children) {
      if (!indiXrefs.has(child)) {
        errors.push(`FAM ${fam.xref}: CHIL ${child} không tồn tại`);
      }
    }
  }

  // Duplicate check against existing data
  let duplicates: DuplicatePair[] = [];
  if (existingData && existingData.people.length > 0) {
    // Create fake TreeData combining existing + import for duplicate detection
    const importIds = new Set<string>();
    const importPeople: Person[] = mapping.people.map((p) => {
      const id = crypto.randomUUID();
      importIds.add(id);
      return {
        ...p,
        id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Person;
    });

    const combinedData: TreeData = {
      people: [...existingData.people, ...importPeople],
      families: existingData.families,
      children: existingData.children,
    };

    // Only keep duplicates that cross import/existing boundary
    const allDuplicates = findDuplicates(combinedData);
    duplicates = allDuplicates.filter(d =>
      (importIds.has(d.personA.id) && !importIds.has(d.personB.id)) ||
      (!importIds.has(d.personA.id) && importIds.has(d.personB.id))
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: {
      individualCount: parseResult.individuals.length,
      familyCount: parseResult.families.length,
      duplicateCount: duplicates.length,
    },
    duplicates,
  };
}

// ─── Import Summary ─────────────────────────────────────────────────────────

export interface ImportSummary {
  parseResult: GedcomParseResult;
  mapping: ImportMapping;
  validation: ImportValidation;
}

export function prepareImport(content: string, existingData?: TreeData): ImportSummary {
  const parseResult = parseGedcom(content);
  const mapping = mapGedcomToAncestorTree(parseResult);
  const validation = validateImport(parseResult, mapping, existingData);
  return { parseResult, mapping, validation };
}
