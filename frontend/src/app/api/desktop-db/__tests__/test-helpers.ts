/**
 * @project AncestorTree
 * @file src/app/api/desktop-db/__tests__/test-helpers.ts
 * @description Shared test utilities — creates a fresh in-memory sql.js Database
 *              with the full SQLite schema applied. Every test gets an isolated DB.
 * @version 1.0.0
 * @updated 2026-02-26
 */

import initSqlJs, { type Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

let SQL: Awaited<ReturnType<typeof initSqlJs>> | null = null;

async function getSqlJs() {
  if (SQL) return SQL;
  SQL = await initSqlJs({
    locateFile: () =>
      path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm'),
  });
  return SQL;
}

/** Load schema SQL from desktop/migrations */
function loadSchema(): string {
  const schemaPath = path.join(
    process.cwd(),
    '..',
    'desktop',
    'migrations',
    '001-initial-schema.sql',
  );
  return fs.readFileSync(schemaPath, 'utf-8');
}

/**
 * Create a fresh in-memory Database with the full schema applied.
 * Each call returns an independent isolated database — safe for parallel-ish tests.
 */
export async function createTestDb(): Promise<Database> {
  const SqlJs = await getSqlJs();
  const db = new SqlJs.Database();
  db.run('PRAGMA foreign_keys = ON');

  const schema = loadSchema();
  db.run(schema);

  return db;
}

/** Shorthand: insert a minimal person row and return its id */
export function insertPerson(
  db: Database,
  id: string,
  opts: { handle?: string; display_name?: string; generation?: number } = {},
): string {
  const handle = opts.handle ?? id; // use full id as handle to guarantee uniqueness
  const name = opts.display_name ?? `Người ${id.slice(0, 4)}`;
  const gen = opts.generation ?? 1;
  db.run(
    `INSERT INTO people (id, handle, display_name, generation) VALUES (?, ?, ?, ?)`,
    [id, handle, name, gen],
  );
  return id;
}

/** Insert a family relation and return family id */
export function insertFamily(
  db: Database,
  familyId: string,
  fatherId: string | null,
  motherId: string | null,
): string {
  db.run(
    `INSERT INTO families (id, handle, father_id, mother_id) VALUES (?, ?, ?, ?)`,
    [familyId, familyId, fatherId, motherId],
  );
  return familyId;
}

/** Insert a child->family relationship */
export function insertChild(db: Database, familyId: string, personId: string): void {
  const childId = `${familyId}-${personId}`.slice(0, 36);
  db.run(`INSERT INTO children (id, family_id, person_id) VALUES (?, ?, ?)`, [childId, familyId, personId]);
}
