/**
 * @project AncestorTree
 * @file src/app/api/backup/restore/route.ts
 * @description Unified restore API — imports a ZIP backup file into the database.
 *              Works in both Desktop (SQLite) and Web (Supabase service-role) modes.
 *              DESTRUCTIVE: clears all table data before restoring from manifest.
 * @version 1.0.0
 * @updated 2026-02-28
 * @security SEC-CRIT-03: column names whitelisted per table (prevents SQL injection)
 * @security SEC-WARN-04: ZIP file size limited to 500 MB
 */

import { NextRequest, NextResponse } from 'next/server';
import AdmZip from 'adm-zip';

/** 500 MB max import file */
const MAX_IMPORT_SIZE = 500 * 1024 * 1024;

/** FK-safe insert order; delete order is reversed */
const IMPORT_TABLES = [
  'people', 'families', 'children',
  'contributions', 'events', 'media',
  'achievements', 'fund_transactions', 'scholarships', 'clan_articles',
  'cau_duong_pools', 'cau_duong_assignments',
  'clan_documents',
] as const;

/**
 * Per-table column allowlists (SEC-CRIT-03).
 * Only whitelisted columns are included in INSERT statements to prevent
 * SQL injection via malicious column names in an imported manifest.
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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'Không tìm thấy file' }, { status: 400 });
    }

    // SEC-WARN-04: Enforce file size limit
    if (file.size > MAX_IMPORT_SIZE) {
      return NextResponse.json(
        { error: `File quá lớn. Giới hạn tối đa là ${MAX_IMPORT_SIZE / 1024 / 1024} MB` },
        { status: 413 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const zip = new AdmZip(Buffer.from(arrayBuffer));

    // ── Validate manifest ──────────────────────────────────────────────────
    const manifestEntry = zip.getEntry('manifest.json');
    if (!manifestEntry) {
      return NextResponse.json(
        { error: 'File không hợp lệ: thiếu manifest.json' },
        { status: 400 }
      );
    }

    const manifest = JSON.parse(manifestEntry.getData().toString('utf-8'));
    if (!manifest.version || !manifest.tables) {
      return NextResponse.json(
        { error: 'Định dạng manifest không hợp lệ' },
        { status: 400 }
      );
    }

    const isDesktop =
      process.env.DESKTOP_MODE === 'true' ||
      process.env.NEXT_PUBLIC_DESKTOP_MODE === 'true';

    let totalInserted = 0;
    const errors: string[] = [];
    const deleteOrder = [...IMPORT_TABLES].reverse();

    // ══════════════════════════════════════════════════════════════════════
    // DESKTOP MODE — SQLite
    // ══════════════════════════════════════════════════════════════════════
    if (isDesktop) {
      const { getDatabase, flushToDisk } = await import('../../desktop-db/sqlite-db');
      const db = await getDatabase();

      // Clear in reverse FK order
      for (const table of deleteOrder) {
        try { db.run(`DELETE FROM "${table}"`); } catch { /* table may not exist */ }
      }

      // Insert rows
      for (const table of IMPORT_TABLES) {
        const rows = manifest.tables[table] as Record<string, unknown>[] | undefined;
        if (!rows || rows.length === 0) continue;
        const allowed = TABLE_COLUMNS[table];
        for (const row of rows) {
          try {
            const cols = Object.keys(row).filter(c => allowed?.has(c));
            if (cols.length === 0) continue;
            const vals = cols.map(c => row[c]);
            const placeholders = cols.map(() => '?').join(', ');
            db.run(
              `INSERT OR IGNORE INTO "${table}" (${cols.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders})`,
              vals
            );
            totalInserted++;
          } catch (err) {
            errors.push(`${table}: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
      }

      // Restore inline media files
      let mediaRestored = 0;
      if (manifest.include_media === 'inline') {
        const path = await import('path');
        const fs = await import('fs');
        const os = await import('os');
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
        mode: 'desktop',
        tables: Object.fromEntries(
          IMPORT_TABLES.map(t => [t, (manifest.tables[t] as unknown[] | undefined)?.length ?? 0])
        ),
        total_inserted: totalInserted,
        media_restored: mediaRestored,
        errors: errors.length > 0 ? errors : undefined,
      });

    // ══════════════════════════════════════════════════════════════════════
    // WEB MODE — Supabase service role
    // ══════════════════════════════════════════════════════════════════════
    } else {
      const { createServiceRoleClient } = await import('@/lib/supabase');
      const supabase = createServiceRoleClient();

      // Clear in reverse FK order
      for (const table of deleteOrder) {
        try {
          await supabase.from(table).delete().not('id', 'is', null);
        } catch { /* ignore — table may be empty */ }
      }

      // Insert rows using allowlist
      for (const table of IMPORT_TABLES) {
        const rows = manifest.tables[table] as Record<string, unknown>[] | undefined;
        if (!rows || rows.length === 0) continue;
        const allowed = TABLE_COLUMNS[table];

        // Filter each row to whitelisted columns only
        const sanitized = rows.map(row =>
          Object.fromEntries(
            Object.entries(row).filter(([k]) => allowed?.has(k))
          )
        ).filter(row => Object.keys(row).length > 0);

        if (sanitized.length === 0) continue;

        // Upsert in batches of 500 to avoid payload limits
        const BATCH = 500;
        for (let i = 0; i < sanitized.length; i += BATCH) {
          const batch = sanitized.slice(i, i + BATCH);
          const { error } = await supabase.from(table).upsert(batch, { onConflict: 'id' });
          if (error) {
            errors.push(`${table}: ${error.message}`);
          } else {
            totalInserted += batch.length;
          }
        }
      }

      return NextResponse.json({
        ok: true,
        mode: 'web',
        tables: Object.fromEntries(
          IMPORT_TABLES.map(t => [t, (manifest.tables[t] as unknown[] | undefined)?.length ?? 0])
        ),
        total_inserted: totalInserted,
        errors: errors.length > 0 ? errors : undefined,
      });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Khôi phục thất bại' },
      { status: 500 }
    );
  }
}
