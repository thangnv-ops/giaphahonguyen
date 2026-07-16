/**
 * @project AncestorTree
 * @file src/app/api/desktop-db/sqlite-db.ts
 * @description Singleton sql.js database with flush-to-disk persistence.
 *              CTO condition A: in-memory DB + flushToDisk() after every write.
 * @version 1.0.0
 * @updated 2026-02-26
 */

import initSqlJs, { type Database } from 'sql.js';
import path from 'path';
import fs from 'fs';
import os from 'os';

let db: Database | null = null;
let dbPromise: Promise<Database> | null = null;
let dbPath: string = '';

function getDataDir(): string {
  return process.env.DESKTOP_DATA_DIR || path.join(os.homedir(), 'AncestorTree');
}

function getDbPath(): string {
  if (!dbPath) {
    dbPath = path.join(getDataDir(), 'data', 'ancestortree.db');
  }
  return dbPath;
}

/** Get or create the singleton database instance (race-safe) */
export async function getDatabase(): Promise<Database> {
  if (db) return db;
  if (dbPromise) return dbPromise;

  dbPromise = initDatabase();
  try {
    db = await dbPromise;
    return db;
  } catch (err) {
    dbPromise = null; // Allow retry on failure
    throw err;
  }
}

async function initDatabase(): Promise<Database> {
  const SQL = await initSqlJs({
    locateFile: () => path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm'),
  });

  const filePath = getDbPath();
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  let database: Database;
  if (fs.existsSync(filePath)) {
    const buffer = fs.readFileSync(filePath);
    database = new SQL.Database(buffer);
  } else {
    database = new SQL.Database();
  }

  database.run('PRAGMA journal_mode = MEMORY');
  database.run('PRAGMA foreign_keys = ON');

  // Run migrations on init (CTO B-1: must run inside Next.js process, not Electron main)
  // Pass database explicitly since module-level `db` is not yet assigned at this point.
  applyMigrations(database);

  return database;
}

/**
 * Flush the in-memory database to disk.
 * Uses atomic write: write to .tmp then rename to prevent corruption.
 * Accepts optional database param for use during initDatabase() before
 * the module-level `db` is set.
 */
export function flushToDisk(database?: Database): void {
  const target = database ?? db;
  if (!target) return;

  const filePath = getDbPath();
  const tmpPath = filePath + '.tmp';

  const data = target.export();
  const buffer = Buffer.from(data);

  fs.writeFileSync(tmpPath, buffer);
  fs.renameSync(tmpPath, filePath);
}

/** Check if database file exists (for first-run detection) */
export function databaseExists(): boolean {
  return fs.existsSync(getDbPath());
}

/**
 * Apply pending SQL migrations (called internally from initDatabase).
 * Migration dir resolved via MIGRATIONS_DIR env (set by Electron server.ts)
 * with fallback to relative path for dev workflow.
 */
function applyMigrations(database: Database): void {
  // Create migrations tracking table
  database.run(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // CTO B-2: Resolve migrations dir from env (set by Electron server.ts)
  // - Dev: path.join(__dirname, '..', 'desktop', 'migrations') via MIGRATIONS_DIR
  // - Production: path.join(process.resourcesPath, 'migrations') via MIGRATIONS_DIR
  // - Fallback: relative path from Next.js cwd (dev only)
  const migrationsDirs = [
    process.env.MIGRATIONS_DIR,
    path.join(process.cwd(), '..', 'desktop', 'migrations'),
  ].filter(Boolean) as string[];

  for (const dir of migrationsDirs) {
    if (!fs.existsSync(dir)) continue;

    const migrationFiles = fs.readdirSync(dir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    if (migrationFiles.length === 0) continue;

    let applied = false;
    for (const file of migrationFiles) {
      const checkStmt = database.prepare('SELECT 1 FROM _migrations WHERE name = ?');
      checkStmt.bind([file]);
      const isApplied = checkStmt.step();
      checkStmt.free();

      if (!isApplied) {
        const sql = fs.readFileSync(path.join(dir, file), 'utf-8');
        database.exec(sql);
        database.run('INSERT INTO _migrations (name) VALUES (?)', [file]);
        applied = true;
      }
    }

    if (applied) flushToDisk(database);
    break; // Use first valid dir
  }
}
