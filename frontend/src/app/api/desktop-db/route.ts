/**
 * @project AncestorTree
 * @file src/app/api/desktop-db/route.ts
 * @description Desktop SQLite database API route.
 *              Receives serialized Supabase queries from the client shim,
 *              translates to SQL via query-builder, executes against sql.js.
 * @version 1.0.0
 * @updated 2026-02-26
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, flushToDisk } from './sqlite-db';
import { executeQuery } from './query-builder';
import { handleRpc } from './rpc-handlers';

/** Guard: only allow in desktop mode */
function isDesktopMode(): boolean {
  return process.env.NEXT_PUBLIC_DESKTOP_MODE === 'true' ||
    process.env.DESKTOP_MODE === 'true';
}

export async function POST(request: NextRequest) {
  if (!isDesktopMode()) {
    return NextResponse.json(
      { data: null, error: { message: 'Desktop-only endpoint', code: 'DESKTOP_ONLY' } },
      { status: 404 }
    );
  }

  try {
    const payload = await request.json();
    const db = await getDatabase();

    // Handle RPC calls
    if (payload.method === 'rpc') {
      const result = handleRpc(db, payload.functionName, payload.params || {});
      return NextResponse.json(result);
    }

    // Handle CRUD queries
    const result = executeQuery(db, payload);

    // Flush to disk after write operations
    if (payload.method === 'insert' || payload.method === 'update' || payload.method === 'delete') {
      flushToDisk();
    }

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      {
        data: null,
        error: {
          message: err instanceof Error ? err.message : 'Desktop DB error',
          code: 'DESKTOP_DB_ERROR',
        },
      },
      { status: 500 }
    );
  }
}
