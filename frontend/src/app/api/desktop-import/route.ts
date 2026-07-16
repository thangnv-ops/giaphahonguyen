/**
 * @project AncestorTree
 * @file src/app/api/desktop-import/route.ts
 * @description ZIP import engine for desktop mode.
 *              Reads manifest.json from ZIP, validates format, clears existing
 *              data and restores all tables. Profiles table is skipped (CTO Obs 3).
 * @version 1.1.0
 * @updated 2026-02-27
 * @security SEC-CRIT-03: column names whitelisted per table to prevent SQL injection
 * @security SEC-WARN-04: ZIP file size limit enforced (500MB max)
 */

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import os from 'os';
import AdmZip from 'adm-zip';
import { getDatabase, flushToDisk } from '../desktop-db/sqlite-db';

/** SEC-WARN-04: Maximum ZIP import file size (500 MB) */
const MAX_IMPORT_SIZE = 500 * 1024 * 1024;

const IMPORT_TABLES = [
  // Order matters for FK constraints
  'people',
  'families',
  'children',
  'contributions',
  'events',
  'media',
  'achievements',
  'fund_transactions',
  'scholarships',
  'clan_articles',
  'cau_duong_pools',
  'cau_duong_assignments',
] as const;

/**
 * SEC-CRIT-03: Per-table column allowlists.
 * Only whitelisted columns are included in INSERT statements.
 * Prevents SQL injection via malicious column names in imported manifest.
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
};

function guardDesktopOnly(): NextResponse | null {
  if (process.env.NEXT_PUBLIC_DESKTOP_MODE !== 'true' && process.env.DESKTOP_MODE !== 'true') {
    return NextResponse.json({ error: 'Desktop-only endpoint' }, { status: 404 });
  }
  return null;
}

export async function POST(request: NextRequest) {
  const guard = guardDesktopOnly();
  if (guard) return guard;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // SEC-WARN-04: Enforce ZIP file size limit
    if (file.size > MAX_IMPORT_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum import size is ${MAX_IMPORT_SIZE / 1024 / 1024}MB` },
        { status: 413 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const zip = new AdmZip(Buffer.from(arrayBuffer));

    // ── Read and validate manifest ─────────────────────────────────────────
    const manifestEntry = zip.getEntry('manifest.json');
    if (!manifestEntry) {
      return NextResponse.json({ error: 'Invalid ZIP: missing manifest.json' }, { status: 400 });
    }

    const manifest = JSON.parse(manifestEntry.getData().toString('utf-8'));
    if (!manifest.version || !manifest.tables) {
      return NextResponse.json({ error: 'Invalid manifest format' }, { status: 400 });
    }

    const db = await getDatabase();

    // ── Clear existing data (reverse FK order) ─────────────────────────────
    const deleteOrder = [...IMPORT_TABLES].reverse();
    for (const table of deleteOrder) {
      db.run(`DELETE FROM "${table}"`);
    }

    // ── Insert rows per table ──────────────────────────────────────────────
    let totalInserted = 0;
    const errors: string[] = [];

    for (const table of IMPORT_TABLES) {
      const rows = manifest.tables[table] as Record<string, unknown>[] | undefined;
      if (!rows || rows.length === 0) continue;

      const allowedColumns = TABLE_COLUMNS[table];

      for (const row of rows) {
        try {
          // SEC-CRIT-03: Filter to whitelisted columns only
          const columns = Object.keys(row).filter(c => allowedColumns?.has(c));
          if (columns.length === 0) continue;

          const values = columns.map(c => row[c]);
          const placeholders = columns.map(() => '?').join(', ');
          const sql = `INSERT OR IGNORE INTO "${table}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders})`;
          db.run(sql, values);
          totalInserted++;
        } catch (err) {
          errors.push(`${table}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }

    // ── Restore media files (if inline) ───────────────────────────────────
    let mediaRestored = 0;
    if (manifest.include_media === 'inline') {
      const mediaRoot = path.join(
        process.env.DESKTOP_DATA_DIR || path.join(os.homedir(), 'AncestorTree'),
        'media'
      );
      for (const entry of zip.getEntries()) {
        if (entry.entryName.startsWith('media/') && !entry.isDirectory) {
          const destPath = path.join(mediaRoot, entry.entryName.slice('media/'.length));
          const destDir = path.dirname(destPath);
          if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
          fs.writeFileSync(destPath, entry.getData());
          mediaRestored++;
        }
      }
    }

    flushToDisk();

    return NextResponse.json({
      ok: true,
      tables: Object.fromEntries(
        IMPORT_TABLES.map(t => [t, (manifest.tables[t] as unknown[] | undefined)?.length ?? 0])
      ),
      total_inserted: totalInserted,
      media_restored: mediaRestored,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Import failed' },
      { status: 500 }
    );
  }
}
