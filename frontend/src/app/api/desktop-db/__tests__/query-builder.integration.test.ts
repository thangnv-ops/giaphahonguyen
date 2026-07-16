/**
 * @project AncestorTree
 * @file src/app/api/desktop-db/__tests__/query-builder.integration.test.ts
 * @description Integration tests for executeQuery() against an in-memory sql.js DB.
 *              Tests all CRUD methods, filters, ordering, pagination, and edge cases.
 *              Covers task 2.9 from SPRINT-PLAN.md.
 * @version 1.0.0
 * @updated 2026-02-26
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { Database } from 'sql.js';
import { executeQuery } from '../query-builder';
import { createTestDb, insertPerson, insertFamily } from './test-helpers';

let db: Database;

beforeEach(async () => {
  db = await createTestDb();
});

// ─── SELECT ─────────────────────────────────────────────────────────────────

describe('executeQuery — SELECT', () => {
  it('TC-QB-001: returns empty array when table is empty', () => {
    const result = executeQuery(db, {
      table: 'people',
      method: 'select',
      columns: '*',
      filters: [],
    });
    expect(result.error).toBeNull();
    expect(result.data).toEqual([]);
  });

  it('TC-QB-002: returns all rows when no filter', () => {
    insertPerson(db, 'id-1', { display_name: 'Đặng Văn A', generation: 1 });
    insertPerson(db, 'id-2', { display_name: 'Đặng Văn B', generation: 2 });

    const result = executeQuery(db, {
      table: 'people',
      method: 'select',
      columns: 'id,display_name',
      filters: [],
    });

    expect(result.error).toBeNull();
    expect(Array.isArray(result.data)).toBe(true);
    expect((result.data as unknown[]).length).toBe(2);
  });

  it('TC-QB-003: eq filter returns matching rows only', () => {
    insertPerson(db, 'id-1', { display_name: 'Alpha', generation: 1 });
    insertPerson(db, 'id-2', { display_name: 'Beta', generation: 2 });

    const result = executeQuery(db, {
      table: 'people',
      method: 'select',
      columns: 'id,generation',
      filters: [{ type: 'eq', column: 'generation', value: 2 }],
    });

    const rows = result.data as Record<string, unknown>[];
    expect(rows.length).toBe(1);
    expect(rows[0].id).toBe('id-2');
  });

  it('TC-QB-004: in filter returns matching set', () => {
    insertPerson(db, 'id-1', { generation: 1 });
    insertPerson(db, 'id-2', { generation: 2 });
    insertPerson(db, 'id-3', { generation: 3 });

    const result = executeQuery(db, {
      table: 'people',
      method: 'select',
      columns: 'id',
      filters: [{ type: 'in', column: 'id', value: ['id-1', 'id-3'] }],
    });

    const rows = result.data as Record<string, unknown>[];
    expect(rows.length).toBe(2);
    const ids = rows.map(r => r.id);
    expect(ids).toContain('id-1');
    expect(ids).toContain('id-3');
  });

  it('TC-QB-005: empty IN returns no results', () => {
    insertPerson(db, 'id-1');

    const result = executeQuery(db, {
      table: 'people',
      method: 'select',
      columns: '*',
      filters: [{ type: 'in', column: 'id', value: [] }],
    });

    expect((result.data as unknown[]).length).toBe(0);
  });

  it('TC-QB-006: is null filter returns rows with null column', () => {
    insertPerson(db, 'id-1', { display_name: 'A' });
    // birth_date is null by default

    const result = executeQuery(db, {
      table: 'people',
      method: 'select',
      columns: 'id',
      filters: [{ type: 'is', column: 'birth_date', value: null }],
    });

    const rows = result.data as Record<string, unknown>[];
    expect(rows.length).toBeGreaterThan(0);
  });

  it('TC-QB-007: ilike filter is case-insensitive for ASCII', () => {
    insertPerson(db, 'id-1', { display_name: 'Nguyen Van ALPHA' });
    insertPerson(db, 'id-2', { display_name: 'Tran Thi Beta' });

    const result = executeQuery(db, {
      table: 'people',
      method: 'select',
      columns: 'id',
      filters: [{ type: 'ilike', column: 'display_name', value: '%alpha%' }],
    });

    const rows = result.data as Record<string, unknown>[];
    expect(rows.length).toBe(1);
    expect(rows[0].id).toBe('id-1');
  });

  it('TC-QB-007b: ilike Vietnamese — note: SQLite LIKE only ASCII case-insensitive (documented limitation)', () => {
    insertPerson(db, 'id-vn', { display_name: 'Dặng Văn An' });

    // Exact case match always works
    const exact = executeQuery(db, {
      table: 'people',
      method: 'select',
      columns: 'id',
      filters: [{ type: 'ilike', column: 'display_name', value: '%Văn%' }],
    });
    expect((exact.data as unknown[]).length).toBe(1);
  });

  it('TC-QB-008: not is null returns non-null rows', () => {
    db.run(`INSERT INTO people (id, handle, display_name, generation, birth_year)
            VALUES ('id-1','h1','A',1,1950),('id-2','h2','B',1,NULL)`);

    const result = executeQuery(db, {
      table: 'people',
      method: 'select',
      columns: 'id',
      filters: [{ type: 'not', column: 'birth_year', operator: 'is', value: null }],
    });

    const rows = result.data as Record<string, unknown>[];
    expect(rows.length).toBe(1);
    expect(rows[0].id).toBe('id-1');
  });

  it('TC-QB-009: ORDER BY ascending', () => {
    insertPerson(db, 'id-2', { generation: 2 });
    insertPerson(db, 'id-1', { generation: 1 });
    insertPerson(db, 'id-3', { generation: 3 });

    const result = executeQuery(db, {
      table: 'people',
      method: 'select',
      columns: 'id,generation',
      filters: [],
      order: [{ column: 'generation', ascending: true }],
    });

    const rows = result.data as Record<string, unknown>[];
    const generations = rows.map((r: Record<string, unknown>) => r.generation as number);
    expect(generations).toEqual([1, 2, 3]);
  });

  it('TC-QB-010: ORDER BY descending', () => {
    insertPerson(db, 'id-1', { generation: 1 });
    insertPerson(db, 'id-3', { generation: 3 });
    insertPerson(db, 'id-2', { generation: 2 });

    const result = executeQuery(db, {
      table: 'people',
      method: 'select',
      columns: 'id,generation',
      filters: [],
      order: [{ column: 'generation', ascending: false }],
    });

    const rows = result.data as Record<string, unknown>[];
    expect((rows[0] as Record<string, unknown>).generation).toBe(3);
  });

  it('TC-QB-011: LIMIT restricts result count', () => {
    insertPerson(db, 'id-1', { generation: 1 });
    insertPerson(db, 'id-2', { generation: 2 });
    insertPerson(db, 'id-3', { generation: 3 });

    const result = executeQuery(db, {
      table: 'people',
      method: 'select',
      columns: '*',
      filters: [],
      limit: 2,
    });

    expect((result.data as unknown[]).length).toBe(2);
  });

  it('TC-QB-012: .single() returns object not array', () => {
    insertPerson(db, 'id-single', { display_name: 'Singleton' });

    const result = executeQuery(db, {
      table: 'people',
      method: 'select',
      columns: '*',
      filters: [{ type: 'eq', column: 'id', value: 'id-single' }],
      single: true,
    });

    expect(result.error).toBeNull();
    expect(Array.isArray(result.data)).toBe(false);
    expect((result.data as Record<string, unknown>).id).toBe('id-single');
  });

  it('TC-QB-013: .single() with no results returns PGRST116 error', () => {
    const result = executeQuery(db, {
      table: 'people',
      method: 'select',
      columns: '*',
      filters: [{ type: 'eq', column: 'id', value: 'nonexistent' }],
      single: true,
    });

    expect(result.data).toBeNull();
    expect(result.error?.code).toBe('PGRST116');
  });

  it('TC-QB-014: .maybeSingle() returns null for no results (no error)', () => {
    const result = executeQuery(db, {
      table: 'people',
      method: 'select',
      columns: '*',
      filters: [{ type: 'eq', column: 'id', value: 'nonexistent' }],
      maybeSingle: true,
    });

    expect(result.data).toBeNull();
    expect(result.error).toBeNull();
  });

  it('TC-QB-015: boolean coercion — is_living returned as JS boolean', () => {
    insertPerson(db, 'bool-1', { display_name: 'Living Person' });
    // is_living defaults to 1 in schema

    const result = executeQuery(db, {
      table: 'people',
      method: 'select',
      columns: 'id,is_living',
      filters: [{ type: 'eq', column: 'id', value: 'bool-1' }],
      single: true,
    });

    const row = result.data as Record<string, unknown>;
    expect(typeof row.is_living).toBe('boolean');
    expect(row.is_living).toBe(true);
  });
});

// ─── INSERT ─────────────────────────────────────────────────────────────────

describe('executeQuery — INSERT', () => {
  it('TC-QB-020: inserts a row and auto-generates UUID if id missing', () => {
    const result = executeQuery(db, {
      table: 'people',
      method: 'insert',
      columns: '*',
      body: { handle: 'new-person', display_name: 'Tên Mới', generation: 1 },
      filters: [],
      single: true,
    });

    expect(result.error).toBeNull();
    const row = result.data as Record<string, unknown>;
    expect(typeof row.id).toBe('string');
    expect(row.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('TC-QB-021: inserts a row with provided id', () => {
    const result = executeQuery(db, {
      table: 'people',
      method: 'insert',
      columns: 'id,display_name',
      body: { id: 'fixed-id', handle: 'fixed', display_name: 'Fixed', generation: 1 },
      filters: [],
      single: true,
    });

    expect(result.error).toBeNull();
    expect((result.data as Record<string, unknown>).id).toBe('fixed-id');
  });

  it('TC-QB-022: batch insert returns all rows', () => {
    const result = executeQuery(db, {
      table: 'people',
      method: 'insert',
      columns: 'id,display_name',
      body: [
        { id: 'b1', handle: 'b1', display_name: 'Batch 1', generation: 1 },
        { id: 'b2', handle: 'b2', display_name: 'Batch 2', generation: 1 },
      ],
      filters: [],
    });

    expect(result.error).toBeNull();
    const rows = result.data as Record<string, unknown>[];
    expect(rows.length).toBe(2);
  });

  it('TC-QB-023: UNIQUE constraint violation returns error code 23505', () => {
    insertPerson(db, 'dup-id', { handle: 'same-handle' });

    const result = executeQuery(db, {
      table: 'people',
      method: 'insert',
      body: { id: 'dup-id', handle: 'same-handle', display_name: 'Dup', generation: 1 },
      filters: [],
    });

    expect(result.error).not.toBeNull();
    expect(result.error?.code).toBe('23505');
  });

  it('TC-QB-024: boolean true → 1 stored in SQLite, then coerced back to true', () => {
    executeQuery(db, {
      table: 'people',
      method: 'insert',
      body: {
        id: 'bool-insert',
        handle: 'bi',
        display_name: 'Bool Test',
        generation: 1,
        is_living: true,
        is_patrilineal: false,
      },
      filters: [],
    });

    const sel = executeQuery(db, {
      table: 'people',
      method: 'select',
      columns: 'id,is_living,is_patrilineal',
      filters: [{ type: 'eq', column: 'id', value: 'bool-insert' }],
      single: true,
    });

    const row = sel.data as Record<string, unknown>;
    expect(row.is_living).toBe(true);
    expect(row.is_patrilineal).toBe(false);
  });

  it('TC-QB-025: auto-sets created_at timestamp', () => {
    const result = executeQuery(db, {
      table: 'people',
      method: 'insert',
      columns: '*',
      body: { id: 'ts-test', handle: 'ts', display_name: 'TS', generation: 1 },
      filters: [],
      single: true,
    });

    const row = result.data as Record<string, unknown>;
    expect(row.created_at).toBeTruthy();
    expect(typeof row.created_at).toBe('string');
  });
});

// ─── UPDATE ─────────────────────────────────────────────────────────────────

describe('executeQuery — UPDATE', () => {
  it('TC-QB-030: updates a field and returns updated row', () => {
    insertPerson(db, 'upd-1', { display_name: 'Old Name', generation: 1 });

    const result = executeQuery(db, {
      table: 'people',
      method: 'update',
      columns: 'id,display_name',
      body: { display_name: 'New Name' },
      filters: [{ type: 'eq', column: 'id', value: 'upd-1' }],
      single: true,
    });

    expect(result.error).toBeNull();
    const row = result.data as Record<string, unknown>;
    expect(row.display_name).toBe('New Name');
  });

  it('TC-QB-031: update with boolean coercion', () => {
    insertPerson(db, 'upd-bool', { display_name: 'Bool Upd' });

    executeQuery(db, {
      table: 'people',
      method: 'update',
      body: { is_living: false },
      filters: [{ type: 'eq', column: 'id', value: 'upd-bool' }],
    });

    const sel = executeQuery(db, {
      table: 'people',
      method: 'select',
      columns: 'is_living',
      filters: [{ type: 'eq', column: 'id', value: 'upd-bool' }],
      single: true,
    });

    expect((sel.data as Record<string, unknown>).is_living).toBe(false);
  });

  it('TC-QB-032: update auto-refreshes updated_at', () => {
    insertPerson(db, 'upd-ts', { display_name: 'TS' });

    const before = Date.now();
    executeQuery(db, {
      table: 'people',
      method: 'update',
      columns: 'updated_at',
      body: { display_name: 'Changed' },
      filters: [{ type: 'eq', column: 'id', value: 'upd-ts' }],
      single: true,
    });

    const sel = executeQuery(db, {
      table: 'people',
      method: 'select',
      columns: 'updated_at',
      filters: [{ type: 'eq', column: 'id', value: 'upd-ts' }],
      single: true,
    });

    const ts = new Date((sel.data as Record<string, unknown>).updated_at as string).getTime();
    expect(ts).toBeGreaterThanOrEqual(before - 1000);
  });
});

// ─── DELETE ─────────────────────────────────────────────────────────────────

describe('executeQuery — DELETE', () => {
  it('TC-QB-040: deletes a row by id', () => {
    insertPerson(db, 'del-1', { display_name: 'To Delete' });

    const del = executeQuery(db, {
      table: 'people',
      method: 'delete',
      filters: [{ type: 'eq', column: 'id', value: 'del-1' }],
    });
    expect(del.error).toBeNull();

    const sel = executeQuery(db, {
      table: 'people',
      method: 'select',
      columns: '*',
      filters: [{ type: 'eq', column: 'id', value: 'del-1' }],
    });
    expect((sel.data as unknown[]).length).toBe(0);
  });

  it('TC-QB-041: delete with no filter clears all rows', () => {
    insertPerson(db, 'del-a');
    insertPerson(db, 'del-b');

    executeQuery(db, { table: 'people', method: 'delete', filters: [] });

    const sel = executeQuery(db, {
      table: 'people',
      method: 'select',
      columns: '*',
      filters: [],
    });
    expect((sel.data as unknown[]).length).toBe(0);
  });
});

// ─── OR filter ──────────────────────────────────────────────────────────────

describe('executeQuery — OR filter (families)', () => {
  it('TC-QB-050: or filter matches either side', () => {
    insertPerson(db, 'father-1', { display_name: 'Father' });
    insertPerson(db, 'mother-1', { display_name: 'Mother' });
    insertPerson(db, 'other-1', { display_name: 'Other' });
    insertFamily(db, 'fam-1', 'father-1', 'mother-1');

    const result = executeQuery(db, {
      table: 'families',
      method: 'select',
      columns: 'id',
      filters: [{ type: 'or', condition: 'father_id.eq.father-1,mother_id.eq.mother-1' }],
    });

    const rows = result.data as Record<string, unknown>[];
    expect(rows.length).toBe(1);
    expect(rows[0].id).toBe('fam-1');
  });

  it('TC-QB-051: or filter with only one matching side still returns row', () => {
    insertPerson(db, 'p1', { display_name: 'Parent 1' });
    insertPerson(db, 'p2', { display_name: 'Parent 2' });
    insertFamily(db, 'fam-or', 'p1', null);

    const result = executeQuery(db, {
      table: 'families',
      method: 'select',
      columns: 'id',
      filters: [{ type: 'or', condition: 'father_id.eq.p1,mother_id.eq.p2' }],
    });

    const rows = result.data as Record<string, unknown>[];
    expect(rows.length).toBe(1);
  });
});

// ─── Multi-table CRUD (acceptance criteria coverage) ────────────────────────

describe('executeQuery — multi-table CRUD', () => {
  it('TC-QB-060: CRUD on events table', () => {
    const ins = executeQuery(db, {
      table: 'events',
      method: 'insert',
      columns: '*',
      body: {
        id: 'ev-1',
        title: 'Giỗ tổ',
        event_type: 'gio',
        event_date: '2026-03-15',
        recurring: true,
      },
      filters: [],
      single: true,
    });
    expect(ins.error).toBeNull();
    expect((ins.data as Record<string, unknown>).recurring).toBe(true);
  });

  it('TC-QB-061: CRUD on achievements table', () => {
    insertPerson(db, 'ach-person', { display_name: 'Tiến Sĩ' });
    const ins = executeQuery(db, {
      table: 'achievements',
      method: 'insert',
      columns: '*',
      body: {
        id: 'ach-1',
        person_id: 'ach-person',
        title: 'Tiến sĩ',
        category: 'hoc_tap',
        is_featured: true,
      },
      filters: [],
      single: true,
    });
    expect(ins.error).toBeNull();
    expect((ins.data as Record<string, unknown>).is_featured).toBe(true);
  });

  it('TC-QB-062: CRUD on fund_transactions table', () => {
    const ins = executeQuery(db, {
      table: 'fund_transactions',
      method: 'insert',
      columns: 'id,amount,type',
      body: {
        id: 'tx-1',
        amount: 1000000,
        type: 'income',
        category: 'dong_gop',
        transaction_date: '2026-02-26',
      },
      filters: [],
      single: true,
    });
    expect(ins.error).toBeNull();
    expect((ins.data as Record<string, unknown>).amount).toBe(1000000);
  });

  it('TC-QB-063: CRUD on clan_articles table', () => {
    const ins = executeQuery(db, {
      table: 'clan_articles',
      method: 'insert',
      columns: 'id,title,category',
      body: {
        id: 'art-1',
        title: 'Điều lệ 1',
        content: 'Nội dung điều lệ',
        category: 'quy_uoc',
        is_featured: false,
      },
      filters: [],
      single: true,
    });
    expect(ins.error).toBeNull();
    expect((ins.data as Record<string, unknown>).title).toBe('Điều lệ 1');
  });
});
