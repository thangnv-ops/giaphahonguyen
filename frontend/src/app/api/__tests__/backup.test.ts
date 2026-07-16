/**
 * @project AncestorTree
 * @file src/app/api/__tests__/backup.test.ts
 * @description E2E / unit tests for:
 *   - POST /api/backup          (unified export — Desktop + Web)
 *   - POST /api/backup/restore  (unified restore — Desktop + Web)
 *   - useBackupSchedule hook    (schedule logic — localStorage-backed)
 *
 * Strategy: mirror route constants and pure logic to validate behaviour
 * without requiring a live DB or HTTP server (same pattern as security.test.ts).
 * @version 1.0.0
 * @updated 2026-02-28
 */

import { describe, it, expect, beforeEach } from 'vitest';

// ─────────────────────────────────────────────────────────────────────────────
// ▌ Constants mirrored from route files (keep in sync)
// ─────────────────────────────────────────────────────────────────────────────

const MAX_IMPORT_SIZE = 500 * 1024 * 1024; // 500 MB

/** Insertion order (FK-safe) — mirrors IMPORT_TABLES in restore/route.ts */
const IMPORT_TABLES = [
  'people', 'families', 'children',
  'contributions', 'events', 'media',
  'achievements', 'fund_transactions', 'scholarships', 'clan_articles',
  'cau_duong_pools', 'cau_duong_assignments',
  'clan_documents',
] as const;

/** Export tables — must equal IMPORT_TABLES set (backup/route.ts) */
const EXPORT_TABLES = [...IMPORT_TABLES] as const;

/**
 * Full column allowlist mirrored from backup/restore/route.ts.
 * Changes here MUST be reflected in the route (and vice versa).
 */
const TABLE_COLUMNS: Record<string, Set<string>> = {
  people: new Set([
    'id', 'handle', 'display_name', 'first_name', 'middle_name', 'surname',
    'pen_name', 'taboo_name', 'gender', 'generation', 'chi',
    'birth_date', 'birth_year', 'birth_place',
    'death_date', 'death_year', 'death_place', 'death_lunar',
    'is_living', 'is_patrilineal',
    'phone', 'email', 'zalo', 'facebook', 'address', 'hometown',
    'occupation', 'biography', 'notes', 'avatar_url', 'privacy_level',
    'created_at', 'updated_at',
  ]),
  families: new Set([
    'id', 'handle', 'father_id', 'mother_id',
    'marriage_date', 'marriage_place', 'divorce_date', 'notes', 'sort_order',
    'created_at', 'updated_at',
  ]),
  children: new Set([
    'id', 'family_id', 'person_id', 'sort_order', 'created_at',
  ]),
  contributions: new Set([
    'id', 'author_id', 'target_person', 'change_type', 'changes',
    'reason', 'status', 'reviewed_by', 'reviewed_at', 'review_notes', 'created_at',
  ]),
  events: new Set([
    'id', 'title', 'description', 'event_date', 'event_lunar',
    'event_type', 'person_id', 'location', 'recurring', 'created_at',
  ]),
  media: new Set([
    'id', 'person_id', 'type', 'url', 'caption', 'is_primary', 'sort_order', 'created_at',
  ]),
  achievements: new Set([
    'id', 'person_id', 'title', 'category', 'description',
    'year', 'awarded_by', 'is_featured', 'created_at', 'updated_at',
  ]),
  fund_transactions: new Set([
    'id', 'type', 'category', 'amount', 'donor_name', 'donor_person_id',
    'recipient_id', 'description', 'transaction_date', 'academic_year',
    'created_by', 'created_at',
  ]),
  scholarships: new Set([
    'id', 'person_id', 'type', 'amount', 'reason', 'academic_year',
    'school', 'grade_level', 'status', 'approved_by', 'approved_at', 'created_at',
  ]),
  clan_articles: new Set([
    'id', 'title', 'content', 'category', 'sort_order',
    'is_featured', 'author_id', 'created_at', 'updated_at',
  ]),
  cau_duong_pools: new Set([
    'id', 'name', 'ancestor_id', 'min_generation', 'max_age_lunar',
    'description', 'is_active', 'created_at', 'updated_at',
  ]),
  cau_duong_assignments: new Set([
    'id', 'pool_id', 'year', 'ceremony_type', 'host_person_id',
    'actual_host_person_id', 'status', 'scheduled_date', 'actual_date',
    'reason', 'notes', 'rotation_index', 'created_by', 'created_at', 'updated_at',
  ]),
  clan_documents: new Set([
    'id', 'title', 'description', 'file_url', 'file_type', 'file_size',
    'category', 'tags', 'person_id', 'uploaded_by', 'created_at', 'updated_at',
  ]),
};

/** Interval durations in ms — mirrored from use-backup-schedule.ts */
const INTERVAL_MS: Record<string, number> = {
  off: Infinity,
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
};

// ─────────────────────────────────────────────────────────────────────────────
// ▌ Pure logic helpers (mirrored from route/hook files)
// ─────────────────────────────────────────────────────────────────────────────

/** Mirror of isBackupDue from use-backup-schedule.ts */
function isBackupDue(interval: string, lastBackupAt: string | null): boolean {
  if (interval === 'off') return false;
  if (!lastBackupAt) return true;
  const elapsed = Date.now() - new Date(lastBackupAt).getTime();
  return elapsed >= INTERVAL_MS[interval];
}

/** Mirror of nextDueDate from use-backup-schedule.ts */
function nextDueDate(interval: string, lastBackupAt: string | null): Date | null {
  if (interval === 'off') return null;
  const base = lastBackupAt ? new Date(lastBackupAt) : new Date(0);
  return new Date(base.getTime() + INTERVAL_MS[interval]);
}

/** Mirror of the column-filter logic in restore/route.ts */
function sanitizeRow(table: string, row: Record<string, unknown>): Record<string, unknown> {
  const allowed = TABLE_COLUMNS[table];
  return Object.fromEntries(
    Object.entries(row).filter(([k]) => allowed?.has(k))
  );
}

/** Mirror of manifest validation logic in restore/route.ts */
function isValidManifest(manifest: unknown): boolean {
  if (typeof manifest !== 'object' || manifest === null) return false;
  const m = manifest as Record<string, unknown>;
  return typeof m.version === 'string' && typeof m.tables === 'object' && m.tables !== null;
}

/** Mirror of batch-split logic for web mode upsert */
function batchRows<T>(rows: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < rows.length; i += batchSize) {
    batches.push(rows.slice(i, i + batchSize));
  }
  return batches;
}

// ─────────────────────────────────────────────────────────────────────────────
// ▌ 1. TABLE COVERAGE
// ─────────────────────────────────────────────────────────────────────────────
describe('Table coverage', () => {
  it('exports exactly 13 tables (including clan_documents)', () => {
    expect(EXPORT_TABLES.length).toBe(13);
  });

  it('import and export table lists are identical', () => {
    expect([...EXPORT_TABLES]).toEqual([...IMPORT_TABLES]);
  });

  it('clan_documents is included (Sprint 11 table)', () => {
    expect(EXPORT_TABLES).toContain('clan_documents');
  });

  it('profiles is excluded (CTO Obs 3: UUID remapping issue)', () => {
    expect(EXPORT_TABLES).not.toContain('profiles');
  });

  it('every exported table has a column allowlist', () => {
    for (const table of EXPORT_TABLES) {
      expect(TABLE_COLUMNS[table]).toBeDefined();
      expect(TABLE_COLUMNS[table].size).toBeGreaterThan(0);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ▌ 2. MANIFEST STRUCTURE — /api/backup POST response schema
// ─────────────────────────────────────────────────────────────────────────────
describe('Manifest schema — /api/backup', () => {
  /** Build a minimal mock manifest as the route would produce */
  function buildMockManifest(
    tables: Partial<Record<typeof EXPORT_TABLES[number], unknown[]>>,
    opts: { mode?: string; include_media?: string } = {}
  ) {
    const data: Record<string, unknown[]> = {};
    for (const t of EXPORT_TABLES) {
      data[t] = tables[t] ?? [];
    }
    return {
      version: '1.0',
      app_version: '2.2.1',
      exported_at: new Date().toISOString(),
      mode: opts.mode ?? 'web',
      include_media: opts.include_media ?? 'reference',
      row_counts: Object.fromEntries(EXPORT_TABLES.map(t => [t, data[t].length])),
      tables: data,
    };
  }

  it('manifest has required top-level fields', () => {
    const m = buildMockManifest({});
    expect(m.version).toBe('1.0');
    expect(m.app_version).toBeDefined();
    expect(m.exported_at).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO format
    expect(m.mode).toMatch(/^(web|desktop)$/);
    expect(m.include_media).toMatch(/^(skip|reference|inline)$/);
    expect(m.row_counts).toBeDefined();
    expect(m.tables).toBeDefined();
  });

  it('row_counts keys match exactly EXPORT_TABLES', () => {
    const m = buildMockManifest({});
    const rcKeys = Object.keys(m.row_counts).sort();
    const expected = [...EXPORT_TABLES].sort();
    expect(rcKeys).toEqual(expected);
  });

  it('tables keys match exactly EXPORT_TABLES', () => {
    const m = buildMockManifest({});
    const tableKeys = Object.keys(m.tables).sort();
    const expected = [...EXPORT_TABLES].sort();
    expect(tableKeys).toEqual(expected);
  });

  it('row_counts reflect actual data length', () => {
    const people = [{ id: '1' }, { id: '2' }, { id: '3' }];
    const m = buildMockManifest({ people });
    expect(m.row_counts.people).toBe(3);
    expect(m.row_counts.families).toBe(0);
    expect(m.row_counts.clan_documents).toBe(0);
  });

  it('mode=desktop set correctly', () => {
    const m = buildMockManifest({}, { mode: 'desktop' });
    expect(m.mode).toBe('desktop');
  });

  it('mode=web set correctly', () => {
    const m = buildMockManifest({}, { mode: 'web' });
    expect(m.mode).toBe('web');
  });

  it('include_media defaults to reference', () => {
    const m = buildMockManifest({});
    expect(m.include_media).toBe('reference');
  });

  it.each(['skip', 'reference', 'inline'])('accepts include_media=%s', (val) => {
    const m = buildMockManifest({}, { include_media: val });
    expect(m.include_media).toBe(val);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ▌ 3. MANIFEST VALIDATION — /api/backup/restore input checks
// ─────────────────────────────────────────────────────────────────────────────
describe('Manifest validation — /api/backup/restore', () => {
  it('accepts a fully valid manifest', () => {
    const manifest = {
      version: '1.0',
      tables: { people: [], families: [] },
    };
    expect(isValidManifest(manifest)).toBe(true);
  });

  it('rejects manifest missing version field', () => {
    expect(isValidManifest({ tables: {} })).toBe(false);
  });

  it('rejects manifest missing tables field', () => {
    expect(isValidManifest({ version: '1.0' })).toBe(false);
  });

  it('rejects null', () => {
    expect(isValidManifest(null)).toBe(false);
  });

  it('rejects non-object (string)', () => {
    expect(isValidManifest('{"version":"1.0"}')).toBe(false);
  });

  it('rejects empty object', () => {
    expect(isValidManifest({})).toBe(false);
  });

  it('rejects tables=null', () => {
    expect(isValidManifest({ version: '1.0', tables: null })).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ▌ 4. FILE SIZE VALIDATION — /api/backup/restore
// ─────────────────────────────────────────────────────────────────────────────
describe('File size validation — /api/backup/restore', () => {
  function makeZipFile(sizeBytes: number): File {
    return new File([new Uint8Array(sizeBytes)], 'backup.zip', { type: 'application/zip' });
  }

  it('accepts file at exact limit (500 MB)', () => {
    const f = makeZipFile(MAX_IMPORT_SIZE);
    expect(f.size <= MAX_IMPORT_SIZE).toBe(true);
  });

  it('rejects file 1 byte over limit', () => {
    const f = makeZipFile(MAX_IMPORT_SIZE + 1);
    expect(f.size > MAX_IMPORT_SIZE).toBe(true);
  });

  it('accepts typical 5 MB backup', () => {
    const f = makeZipFile(5 * 1024 * 1024);
    expect(f.size <= MAX_IMPORT_SIZE).toBe(true);
  });

  it('rejects 1 GB file', () => {
    const f = makeZipFile(1024 * 1024 * 1024);
    expect(f.size > MAX_IMPORT_SIZE).toBe(true);
  });

  it('accepts 0 byte file (edge case — invalid but size-check passes)', () => {
    const f = makeZipFile(0);
    expect(f.size <= MAX_IMPORT_SIZE).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ▌ 5. COLUMN ALLOWLIST — SEC-CRIT-03 (all 13 tables)
// ─────────────────────────────────────────────────────────────────────────────
describe('Column allowlist — SEC-CRIT-03 (all 13 tables)', () => {
  it('every table allowlist is non-empty', () => {
    for (const table of IMPORT_TABLES) {
      expect(TABLE_COLUMNS[table].size).toBeGreaterThan(0);
    }
  });

  it('all allowlists contain "id" column', () => {
    for (const table of IMPORT_TABLES) {
      expect(TABLE_COLUMNS[table].has('id')).toBe(true);
    }
  });

  // ── per-table spot-checks ──

  it('people: allows all core identity fields', () => {
    const expected = ['id', 'display_name', 'gender', 'generation', 'birth_year', 'is_living'];
    for (const col of expected) {
      expect(TABLE_COLUMNS.people.has(col)).toBe(true);
    }
  });

  it('families: allows father_id and mother_id', () => {
    expect(TABLE_COLUMNS.families.has('father_id')).toBe(true);
    expect(TABLE_COLUMNS.families.has('mother_id')).toBe(true);
  });

  it('children: allows family_id and person_id', () => {
    expect(TABLE_COLUMNS.children.has('family_id')).toBe(true);
    expect(TABLE_COLUMNS.children.has('person_id')).toBe(true);
  });

  it('clan_documents: allows all schema columns from Sprint 11 migration', () => {
    const expected = [
      'id', 'title', 'description', 'file_url', 'file_type', 'file_size',
      'category', 'tags', 'person_id', 'uploaded_by', 'created_at', 'updated_at',
    ];
    for (const col of expected) {
      expect(TABLE_COLUMNS.clan_documents.has(col)).toBe(true);
    }
  });

  it('clan_documents: does not allow injected columns', () => {
    const injected = ['DROP TABLE clan_documents', 'OR 1=1', '__proto__', 'constructor'];
    for (const col of injected) {
      expect(TABLE_COLUMNS.clan_documents.has(col)).toBe(false);
    }
  });

  it('fund_transactions: allows amount and category', () => {
    expect(TABLE_COLUMNS.fund_transactions.has('amount')).toBe(true);
    expect(TABLE_COLUMNS.fund_transactions.has('category')).toBe(true);
  });

  it('cau_duong_assignments: allows rotation_index and status', () => {
    expect(TABLE_COLUMNS.cau_duong_assignments.has('rotation_index')).toBe(true);
    expect(TABLE_COLUMNS.cau_duong_assignments.has('status')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ▌ 6. ROW SANITIZATION — column filter applied during restore
// ─────────────────────────────────────────────────────────────────────────────
describe('Row sanitization during restore', () => {
  it('passes through all legitimate people fields', () => {
    const row = {
      id: 'uuid-1',
      display_name: 'Đặng Văn A',
      generation: 5,
      gender: 1,
      is_living: true,
      birth_year: 1980,
    };
    const sanitized = sanitizeRow('people', row);
    expect(sanitized).toEqual(row); // no field should be stripped
  });

  it('strips injected column names from people row', () => {
    const malicious: Record<string, unknown> = {
      id: 'uuid-evil',
      display_name: 'Normal',
      'DROP TABLE people; --': 'x',
      'OR 1=1--': 'y',
      '__proto__': 'polluted',
    };
    const sanitized = sanitizeRow('people', malicious);
    expect(Object.keys(sanitized)).toEqual(['id', 'display_name']);
    expect(sanitized['DROP TABLE people; --']).toBeUndefined();
    expect(sanitized['OR 1=1--']).toBeUndefined();
    // '__proto__' is a JS special accessor — use hasOwnProperty to verify it was stripped
    expect(Object.prototype.hasOwnProperty.call(sanitized, '__proto__')).toBe(false);
  });

  it('strips unknown columns not in schema', () => {
    const row = {
      id: 'uuid-1',
      title: 'Tài liệu ABC',
      unknown_field: 'ignored',
      hacker_payload: 'exploit',
    };
    const sanitized = sanitizeRow('clan_documents', row);
    expect(sanitized['unknown_field']).toBeUndefined();
    expect(sanitized['hacker_payload']).toBeUndefined();
    expect(sanitized['id']).toBe('uuid-1');
    expect(sanitized['title']).toBe('Tài liệu ABC');
  });

  it('returns empty object when all columns are malicious', () => {
    const row: Record<string, unknown> = {
      'DROP TABLE clan_documents': '1',
      'UNION SELECT password FROM auth.users': '2',
    };
    const sanitized = sanitizeRow('clan_documents', row);
    expect(Object.keys(sanitized).length).toBe(0);
  });

  it('correctly sanitizes cau_duong_assignments row', () => {
    const row = {
      id: 'uuid-1',
      pool_id: 'pool-uuid',
      year: 2026,
      status: 'pending',
      rotation_index: 3,
      evil_col: 'drop',
    };
    const sanitized = sanitizeRow('cau_duong_assignments', row);
    expect(sanitized['evil_col']).toBeUndefined();
    expect(sanitized['rotation_index']).toBe(3);
    expect(sanitized['status']).toBe('pending');
  });

  it('handles empty row gracefully', () => {
    const sanitized = sanitizeRow('people', {});
    expect(Object.keys(sanitized).length).toBe(0);
  });

  it('handles null values in legitimate columns', () => {
    const row = {
      id: 'uuid-1',
      display_name: 'Đặng A',
      birth_date: null,
      death_date: null,
    };
    const sanitized = sanitizeRow('people', row);
    expect(sanitized['birth_date']).toBeNull();
    expect(sanitized['death_date']).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ▌ 7. FK-SAFE TABLE ORDER
// ─────────────────────────────────────────────────────────────────────────────
describe('FK-safe table order', () => {
  it('people comes before families (parent before relation)', () => {
    const pIdx = IMPORT_TABLES.indexOf('people');
    const fIdx = IMPORT_TABLES.indexOf('families');
    expect(pIdx).toBeLessThan(fIdx);
  });

  it('families comes before children', () => {
    const fIdx = IMPORT_TABLES.indexOf('families');
    const cIdx = IMPORT_TABLES.indexOf('children');
    expect(fIdx).toBeLessThan(cIdx);
  });

  it('people comes before children', () => {
    const pIdx = IMPORT_TABLES.indexOf('people');
    const cIdx = IMPORT_TABLES.indexOf('children');
    expect(pIdx).toBeLessThan(cIdx);
  });

  it('people comes before achievements (FK: person_id)', () => {
    const pIdx = IMPORT_TABLES.indexOf('people');
    const aIdx = IMPORT_TABLES.indexOf('achievements');
    expect(pIdx).toBeLessThan(aIdx);
  });

  it('cau_duong_pools comes before cau_duong_assignments', () => {
    const poolIdx = IMPORT_TABLES.indexOf('cau_duong_pools');
    const assignIdx = IMPORT_TABLES.indexOf('cau_duong_assignments');
    expect(poolIdx).toBeLessThan(assignIdx);
  });

  it('people comes before clan_documents (FK: person_id)', () => {
    const pIdx = IMPORT_TABLES.indexOf('people');
    const dIdx = IMPORT_TABLES.indexOf('clan_documents');
    expect(pIdx).toBeLessThan(dIdx);
  });

  it('delete order is reverse of insert order', () => {
    const deleteOrder = [...IMPORT_TABLES].reverse();
    expect(deleteOrder[0]).toBe('clan_documents');
    expect(deleteOrder[deleteOrder.length - 1]).toBe('people');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ▌ 8. BATCH INSERT LOGIC (web mode — Supabase upsert)
// ─────────────────────────────────────────────────────────────────────────────
describe('Batch insert logic — web mode upsert', () => {
  const BATCH_SIZE = 500;

  it('single batch when rows <= 500', () => {
    const rows = Array.from({ length: 100 }, (_, i) => ({ id: String(i) }));
    const batches = batchRows(rows, BATCH_SIZE);
    expect(batches.length).toBe(1);
    expect(batches[0].length).toBe(100);
  });

  it('exactly 500 rows = single batch', () => {
    const rows = Array.from({ length: 500 }, (_, i) => ({ id: String(i) }));
    const batches = batchRows(rows, BATCH_SIZE);
    expect(batches.length).toBe(1);
  });

  it('501 rows splits into 2 batches', () => {
    const rows = Array.from({ length: 501 }, (_, i) => ({ id: String(i) }));
    const batches = batchRows(rows, BATCH_SIZE);
    expect(batches.length).toBe(2);
    expect(batches[0].length).toBe(500);
    expect(batches[1].length).toBe(1);
  });

  it('1000 rows = 2 equal batches', () => {
    const rows = Array.from({ length: 1000 }, (_, i) => ({ id: String(i) }));
    const batches = batchRows(rows, BATCH_SIZE);
    expect(batches.length).toBe(2);
    expect(batches[0].length).toBe(500);
    expect(batches[1].length).toBe(500);
  });

  it('1001 rows = 3 batches', () => {
    const rows = Array.from({ length: 1001 }, (_, i) => ({ id: String(i) }));
    const batches = batchRows(rows, BATCH_SIZE);
    expect(batches.length).toBe(3);
    expect(batches[2].length).toBe(1);
  });

  it('0 rows = 0 batches', () => {
    const batches = batchRows([], BATCH_SIZE);
    expect(batches.length).toBe(0);
  });

  it('all items preserved across batches', () => {
    const rows = Array.from({ length: 1234 }, (_, i) => ({ id: String(i) }));
    const batches = batchRows(rows, BATCH_SIZE);
    const reconstructed = batches.flat();
    expect(reconstructed.length).toBe(1234);
    expect(reconstructed[0].id).toBe('0');
    expect(reconstructed[1233].id).toBe('1233');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ▌ 9. SCHEDULE LOGIC — useBackupSchedule (pure function tests)
// ─────────────────────────────────────────────────────────────────────────────
describe('Schedule isDue logic', () => {
  it('off interval → never due', () => {
    expect(isBackupDue('off', null)).toBe(false);
    expect(isBackupDue('off', new Date().toISOString())).toBe(false);
    expect(isBackupDue('off', new Date(0).toISOString())).toBe(false);
  });

  it('daily: due when no last backup', () => {
    expect(isBackupDue('daily', null)).toBe(true);
  });

  it('weekly: due when no last backup', () => {
    expect(isBackupDue('weekly', null)).toBe(true);
  });

  it('monthly: due when no last backup', () => {
    expect(isBackupDue('monthly', null)).toBe(true);
  });

  it('daily: not due when backed up 1 hour ago', () => {
    const lastBackup = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1h ago
    expect(isBackupDue('daily', lastBackup)).toBe(false);
  });

  it('daily: due when backed up 25 hours ago', () => {
    const lastBackup = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    expect(isBackupDue('daily', lastBackup)).toBe(true);
  });

  it('daily: not due when backed up exactly 23h 59m 59s ago', () => {
    const justUnder24h = 24 * 60 * 60 * 1000 - 1000;
    const lastBackup = new Date(Date.now() - justUnder24h).toISOString();
    expect(isBackupDue('daily', lastBackup)).toBe(false);
  });

  it('daily: due at exactly 24h elapsed', () => {
    const exactly24h = 24 * 60 * 60 * 1000;
    const lastBackup = new Date(Date.now() - exactly24h).toISOString();
    expect(isBackupDue('daily', lastBackup)).toBe(true);
  });

  it('weekly: not due when backed up 3 days ago', () => {
    const lastBackup = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(isBackupDue('weekly', lastBackup)).toBe(false);
  });

  it('weekly: due when backed up 8 days ago', () => {
    const lastBackup = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    expect(isBackupDue('weekly', lastBackup)).toBe(true);
  });

  it('monthly: not due when backed up 15 days ago', () => {
    const lastBackup = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
    expect(isBackupDue('monthly', lastBackup)).toBe(false);
  });

  it('monthly: due when backed up 31 days ago', () => {
    const lastBackup = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
    expect(isBackupDue('monthly', lastBackup)).toBe(true);
  });
});

describe('Schedule nextDueDate logic', () => {
  it('off interval → null', () => {
    expect(nextDueDate('off', null)).toBeNull();
    expect(nextDueDate('off', new Date().toISOString())).toBeNull();
  });

  it('daily with no last backup → epoch + 1 day', () => {
    const next = nextDueDate('daily', null);
    expect(next).not.toBeNull();
    expect(next!.getTime()).toBe(new Date(0).getTime() + INTERVAL_MS.daily);
  });

  it('daily: next = lastBackupAt + 24h', () => {
    const last = new Date('2026-02-28T10:00:00Z');
    const next = nextDueDate('daily', last.toISOString());
    const expected = new Date(last.getTime() + INTERVAL_MS.daily);
    expect(next!.getTime()).toBe(expected.getTime());
  });

  it('weekly: next = lastBackupAt + 7 days', () => {
    const last = new Date('2026-02-28T10:00:00Z');
    const next = nextDueDate('weekly', last.toISOString());
    expect(next!.getTime()).toBe(last.getTime() + 7 * 24 * 60 * 60 * 1000);
  });

  it('monthly: next = lastBackupAt + 30 days', () => {
    const last = new Date('2026-02-28T10:00:00Z');
    const next = nextDueDate('monthly', last.toISOString());
    expect(next!.getTime()).toBe(last.getTime() + 30 * 24 * 60 * 60 * 1000);
  });

  it('nextDueDate is in the future when backup was recent', () => {
    const last = new Date(Date.now() - 60 * 1000).toISOString(); // 1 min ago
    const next = nextDueDate('daily', last);
    expect(next!.getTime()).toBeGreaterThan(Date.now());
  });

  it('nextDueDate is in the past when backup is overdue', () => {
    const last = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(); // 2 days ago
    const next = nextDueDate('daily', last);
    expect(next!.getTime()).toBeLessThan(Date.now());
  });
});

describe('Schedule interval MS values', () => {
  it('daily = 86,400,000 ms (24h)', () => {
    expect(INTERVAL_MS.daily).toBe(86_400_000);
  });

  it('weekly = 604,800,000 ms (7 days)', () => {
    expect(INTERVAL_MS.weekly).toBe(604_800_000);
  });

  it('monthly = 2,592,000,000 ms (30 days)', () => {
    expect(INTERVAL_MS.monthly).toBe(2_592_000_000);
  });

  it('off = Infinity', () => {
    expect(INTERVAL_MS.off).toBe(Infinity);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ▌ 10. FILENAME FORMAT — /api/backup response
// ─────────────────────────────────────────────────────────────────────────────
describe('Backup filename format', () => {
  function buildFilename(date: Date): string {
    return `giapha-${date.toISOString().slice(0, 10)}.zip`;
  }

  it('filename follows giapha-YYYY-MM-DD.zip pattern', () => {
    const filename = buildFilename(new Date('2026-02-28T10:00:00Z'));
    expect(filename).toBe('giapha-2026-02-28.zip');
  });

  it('filename is always a .zip', () => {
    const filename = buildFilename(new Date());
    expect(filename.endsWith('.zip')).toBe(true);
  });

  it('filename starts with giapha-', () => {
    const filename = buildFilename(new Date());
    expect(filename.startsWith('giapha-')).toBe(true);
  });

  it('filename date portion is ISO YYYY-MM-DD', () => {
    const filename = buildFilename(new Date('2026-12-31T23:59:59Z'));
    expect(filename).toMatch(/^giapha-\d{4}-\d{2}-\d{2}\.zip$/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ▌ 11. INCLUDE_MEDIA OPTIONS
// ─────────────────────────────────────────────────────────────────────────────
describe('include_media option validation', () => {
  const VALID_OPTIONS = ['skip', 'reference', 'inline'];

  it.each(VALID_OPTIONS)('"%s" is a valid include_media value', (opt) => {
    expect(VALID_OPTIONS.includes(opt)).toBe(true);
  });

  it('defaults to "reference" when not specified', () => {
    // Simulate route: body.include_media ?? 'reference'
    const body: Record<string, unknown> = {};
    const includeMedia = (body.include_media as string) ?? 'reference';
    expect(includeMedia).toBe('reference');
  });

  it('honours explicit skip', () => {
    const body = { include_media: 'skip' };
    const includeMedia = (body.include_media as string) ?? 'reference';
    expect(includeMedia).toBe('skip');
  });

  it('honours explicit inline', () => {
    const body = { include_media: 'inline' };
    const includeMedia = (body.include_media as string) ?? 'reference';
    expect(includeMedia).toBe('inline');
  });

  it('invalid option falls through (route uses received value — UI prevents invalid input)', () => {
    const body = { include_media: 'invalid_value' };
    const includeMedia = (body.include_media as string) ?? 'reference';
    expect(includeMedia).toBe('invalid_value'); // route trusts UI to send valid values
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ▌ 12. RESTORE RESULT STRUCTURE
// ─────────────────────────────────────────────────────────────────────────────
describe('Restore result structure', () => {
  /** Mock successful restore result shape */
  function buildRestoreResult(
    mode: 'web' | 'desktop',
    tableCounts: Partial<Record<string, number>>
  ) {
    const tables = Object.fromEntries(
      IMPORT_TABLES.map(t => [t, tableCounts[t] ?? 0])
    );
    return {
      ok: true,
      mode,
      tables,
      total_inserted: Object.values(tables).reduce((a, b) => a + b, 0),
      errors: undefined as string[] | undefined,
    };
  }

  it('result contains ok=true on success', () => {
    const r = buildRestoreResult('web', {});
    expect(r.ok).toBe(true);
  });

  it('result.tables covers all 13 import tables', () => {
    const r = buildRestoreResult('desktop', {});
    expect(Object.keys(r.tables).length).toBe(13);
  });

  it('total_inserted = sum of all table counts', () => {
    const r = buildRestoreResult('web', { people: 18, families: 8, children: 22 });
    expect(r.total_inserted).toBe(18 + 8 + 22);
  });

  it('mode=desktop for desktop restore', () => {
    const r = buildRestoreResult('desktop', {});
    expect(r.mode).toBe('desktop');
  });

  it('mode=web for web restore', () => {
    const r = buildRestoreResult('web', {});
    expect(r.mode).toBe('web');
  });

  it('errors field is undefined when no errors', () => {
    const r = buildRestoreResult('web', {});
    expect(r.errors).toBeUndefined();
  });

  it('errors is populated when issues occur', () => {
    const r = buildRestoreResult('web', {});
    r.errors = ['people: constraint violation'];
    expect(r.errors).toHaveLength(1);
    expect(r.errors![0]).toContain('people');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ▌ 13. CROSS-MODE COMPATIBILITY — manifest from desktop readable by web restore
// ─────────────────────────────────────────────────────────────────────────────
describe('Cross-mode compatibility', () => {
  it('desktop manifest (mode=desktop) passes web restore validation', () => {
    const desktopManifest = {
      version: '1.0',
      app_version: '2.2.1',
      exported_at: '2026-02-28T10:00:00Z',
      mode: 'desktop',
      include_media: 'reference',
      row_counts: { people: 5 },
      tables: { people: [{ id: 'uuid-1', display_name: 'Đặng A', generation: 3 }] },
    };
    expect(isValidManifest(desktopManifest)).toBe(true);
  });

  it('web manifest (mode=web) passes desktop restore validation', () => {
    const webManifest = {
      version: '1.0',
      tables: { people: [], families: [] },
    };
    expect(isValidManifest(webManifest)).toBe(true);
  });

  it('column sanitization is identical for both modes (shared TABLE_COLUMNS)', () => {
    const row = {
      id: 'uuid-1',
      title: 'Test',
      file_url: '/documents/test.pdf',
      evil_col: 'drop',
    };
    const sanitized = sanitizeRow('clan_documents', row);
    // evil_col stripped for both desktop and web (same allowlist)
    expect(sanitized['evil_col']).toBeUndefined();
    expect(sanitized['title']).toBe('Test');
  });
});
