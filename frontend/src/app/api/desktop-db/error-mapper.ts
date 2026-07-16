/**
 * @project AncestorTree
 * @file src/app/api/desktop-db/error-mapper.ts
 * @description Map SQLite errors to Supabase/PostgREST error shapes.
 *              Data layer checks error.code === 'PGRST116' for "row not found".
 * @version 1.0.0
 * @updated 2026-02-26
 */

export interface SupabaseError {
  message: string;
  code?: string;
}

/** No rows returned for .single() query */
export function notFoundError(): SupabaseError {
  return {
    message: 'JSON object requested, multiple (or no) rows returned',
    code: 'PGRST116',
  };
}

/** Generic SQLite error wrapper */
export function sqliteError(err: unknown): SupabaseError {
  const message = err instanceof Error ? err.message : String(err);
  return {
    message: `SQLite error: ${message}`,
    code: 'SQLITE_ERROR',
  };
}

/** Unique constraint violation */
export function uniqueViolationError(detail: string): SupabaseError {
  return {
    message: `duplicate key value violates unique constraint: ${detail}`,
    code: '23505',
  };
}
