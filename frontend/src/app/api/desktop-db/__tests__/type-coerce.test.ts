/**
 * @project AncestorTree
 * @file src/app/api/desktop-db/__tests__/type-coerce.test.ts
 * @description Unit tests for SQLite ↔ PostgreSQL type coercion utilities.
 *              Covers: boolean ↔ 0/1, JSONB ↔ TEXT, UUID generation.
 * @version 1.0.0
 * @updated 2026-02-26
 */

import { describe, it, expect } from 'vitest';
import {
  isBooleanColumn,
  coerceRowFromSqlite,
  coerceDataToSqlite,
  generateUUID,
} from '../type-coerce';

// ─── isBooleanColumn ────────────────────────────────────────────────────────

describe('isBooleanColumn', () => {
  it('returns true for people.is_living', () => {
    expect(isBooleanColumn('people', 'is_living')).toBe(true);
  });

  it('returns true for people.is_patrilineal', () => {
    expect(isBooleanColumn('people', 'is_patrilineal')).toBe(true);
  });

  it('returns true for events.recurring', () => {
    expect(isBooleanColumn('events', 'recurring')).toBe(true);
  });

  it('returns true for achievements.is_featured', () => {
    expect(isBooleanColumn('achievements', 'is_featured')).toBe(true);
  });

  it('returns true for cau_duong_pools.is_active', () => {
    expect(isBooleanColumn('cau_duong_pools', 'is_active')).toBe(true);
  });

  it('returns false for people.display_name', () => {
    expect(isBooleanColumn('people', 'display_name')).toBe(false);
  });

  it('returns false for unknown table', () => {
    expect(isBooleanColumn('nonexistent_table', 'is_living')).toBe(false);
  });
});

// ─── coerceRowFromSqlite ────────────────────────────────────────────────────

describe('coerceRowFromSqlite', () => {
  it('converts SQLite 1 → true for boolean column', () => {
    const row = coerceRowFromSqlite('people', { id: 'x', is_living: 1 });
    expect(row.is_living).toBe(true);
  });

  it('converts SQLite 0 → false for boolean column', () => {
    const row = coerceRowFromSqlite('people', { id: 'x', is_living: 0 });
    expect(row.is_living).toBe(false);
  });

  it('leaves non-boolean columns untouched', () => {
    const row = coerceRowFromSqlite('people', { id: 'abc', display_name: 'Đặng Văn A' });
    expect(row.display_name).toBe('Đặng Văn A');
  });

  it('parses JSONB text column in contributions.changes', () => {
    const json = JSON.stringify({ old: { name: 'A' }, new: { name: 'B' } });
    const row = coerceRowFromSqlite('contributions', { id: 'x', changes: json });
    expect(row.changes).toEqual({ old: { name: 'A' }, new: { name: 'B' } });
  });

  it('returns raw string if JSONB column has invalid JSON', () => {
    const row = coerceRowFromSqlite('contributions', { id: 'x', changes: 'broken{' });
    expect(row.changes).toBe('broken{');
  });

  it('handles undefined/null values gracefully', () => {
    const row = coerceRowFromSqlite('people', { id: 'x', is_living: null });
    expect(row.is_living).toBe(false); // null → false for boolean
  });
});

// ─── coerceDataToSqlite ─────────────────────────────────────────────────────

describe('coerceDataToSqlite', () => {
  it('converts true → 1 for boolean column', () => {
    const data = coerceDataToSqlite('people', { is_living: true });
    expect(data.is_living).toBe(1);
  });

  it('converts false → 0 for boolean column', () => {
    const data = coerceDataToSqlite('people', { is_living: false });
    expect(data.is_living).toBe(0);
  });

  it('converts object → JSON string for JSONB column', () => {
    const changes = { old: { name: 'A' } };
    const data = coerceDataToSqlite('contributions', { changes });
    expect(typeof data.changes).toBe('string');
    expect(JSON.parse(data.changes as string)).toEqual(changes);
  });

  it('leaves string JSONB values untouched', () => {
    const data = coerceDataToSqlite('contributions', { changes: 'already-string' });
    expect(data.changes).toBe('already-string');
  });

  it('passes through non-coerced columns unchanged', () => {
    const data = coerceDataToSqlite('people', {
      display_name: 'Đặng Đình An',
      generation: 5,
    });
    expect(data.display_name).toBe('Đặng Đình An');
    expect(data.generation).toBe(5);
  });
});

// ─── generateUUID ───────────────────────────────────────────────────────────

describe('generateUUID', () => {
  it('returns a valid UUID v4 string', () => {
    const uuid = generateUUID();
    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('generates unique values on successive calls', () => {
    const ids = new Set(Array.from({ length: 100 }, generateUUID));
    expect(ids.size).toBe(100);
  });
});
