/**
 * @project AncestorTree
 * @file src/app/api/desktop-export/route.ts
 * @description ZIP export engine for desktop mode.
 *              Exports all 12 tables (skips profiles per CTO Obs 3) to a ZIP
 *              archive with manifest.json + optional media/ folder.
 *              Format per ADR-003: include_media = "skip" | "reference" | "inline"
 * @version 1.0.0
 * @updated 2026-02-26
 */

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import os from 'os';
import AdmZip from 'adm-zip';
import { getDatabase } from '../desktop-db/sqlite-db';

/** Tables to export (profiles skipped — CTO Obs 3: UUID remapping issue) */
const EXPORT_TABLES = [
  'people', 'families', 'children',
  'contributions', 'events', 'media',
  'achievements', 'fund_transactions', 'scholarships', 'clan_articles',
  'cau_duong_pools', 'cau_duong_assignments',
] as const;

type IncludeMedia = 'skip' | 'reference' | 'inline';

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
    const body = await request.json().catch(() => ({}));
    const includeMedia: IncludeMedia = body.include_media ?? 'reference';

    const db = await getDatabase();
    const zip = new AdmZip();

    // ── Export all tables ──────────────────────────────────────────────────
    const exportedData: Record<string, unknown[]> = {};
    for (const table of EXPORT_TABLES) {
      const result = db.exec(`SELECT * FROM "${table}"`);
      if (result.length > 0) {
        const { columns, values } = result[0];
        exportedData[table] = values.map(row => {
          const obj: Record<string, unknown> = {};
          columns.forEach((col, i) => { obj[col] = row[i]; });
          return obj;
        });
      } else {
        exportedData[table] = [];
      }
    }

    // ── Media handling ─────────────────────────────────────────────────────
    const mediaRoot = path.join(process.env.DESKTOP_DATA_DIR || path.join(os.homedir(), 'AncestorTree'), 'media');

    if (includeMedia === 'inline' && fs.existsSync(mediaRoot)) {
      // Embed all media files into ZIP under media/
      const walkDir = (dir: string, base: string) => {
        for (const entry of fs.readdirSync(dir)) {
          const full = path.join(dir, entry);
          const rel = path.join(base, entry);
          if (fs.statSync(full).isDirectory()) {
            walkDir(full, rel);
          } else {
            zip.addLocalFile(full, path.dirname(rel) === '.' ? '' : path.dirname(rel), path.basename(rel));
          }
        }
      };
      walkDir(mediaRoot, 'media');
    }

    // ── Build manifest ─────────────────────────────────────────────────────
    const manifest = {
      version: '1.0',
      app_version: process.env.npm_package_version || '1.0.0',
      exported_at: new Date().toISOString(),
      include_media: includeMedia,
      row_counts: Object.fromEntries(EXPORT_TABLES.map(t => [t, exportedData[t].length])),
      tables: exportedData,
    };

    zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest, null, 2), 'utf-8'));

    // ── Return ZIP ─────────────────────────────────────────────────────────
    const zipBuffer = zip.toBuffer();
    const filename = `giapha-${new Date().toISOString().slice(0, 10)}.zip`;

    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(zipBuffer.length),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Export failed' },
      { status: 500 }
    );
  }
}
