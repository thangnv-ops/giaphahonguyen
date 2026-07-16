/**
 * @project AncestorTree
 * @file src/app/api/desktop-db/rpc-handlers.ts
 * @description RPC function handlers for desktop mode.
 *              Implements is_person_in_subtree (DFS via CTE).
 * @version 1.0.0
 * @updated 2026-02-26
 */

import type { Database } from 'sql.js';

/**
 * Check if target_id is in the subtree rooted at root_id.
 * Uses iterative DFS through families/children tables.
 */
function isPersonInSubtree(
  db: Database,
  rootId: string,
  targetId: string,
): boolean {
  if (rootId === targetId) return true;

  // BFS through family tree using parameterized queries
  const visited = new Set<string>();
  const queue = [rootId];

  const familyStmt = db.prepare(
    'SELECT id FROM families WHERE father_id = ? OR mother_id = ?'
  );
  const childStmt = db.prepare(
    'SELECT person_id FROM children WHERE family_id = ?'
  );

  try {
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      // Find families where this person is a parent
      familyStmt.bind([currentId, currentId]);
      const familyIds: string[] = [];
      while (familyStmt.step()) {
        const row = familyStmt.getAsObject() as Record<string, unknown>;
        familyIds.push(row.id as string);
      }

      for (const familyId of familyIds) {
        // Find children in this family
        childStmt.bind([familyId]);
        while (childStmt.step()) {
          const childRow = childStmt.getAsObject() as Record<string, unknown>;
          const childId = childRow.person_id as string;
          if (childId === targetId) return true;
          if (!visited.has(childId)) {
            queue.push(childId);
          }
        }
      }
    }
  } finally {
    familyStmt.free();
    childStmt.free();
  }

  return false;
}

export interface RpcResult {
  data: unknown;
  error: { message: string; code?: string } | null;
}

/** Dispatch RPC function call */
export function handleRpc(
  db: Database,
  functionName: string,
  params: Record<string, unknown>,
): RpcResult {
  switch (functionName) {
    case 'is_person_in_subtree': {
      const rootId = params.root_id as string;
      const targetId = params.target_id as string;
      if (!rootId || !targetId) {
        return { data: null, error: { message: 'Missing root_id or target_id' } };
      }
      const result = isPersonInSubtree(db, rootId, targetId);
      return { data: result, error: null };
    }

    default:
      return {
        data: null,
        error: { message: `Unknown RPC function: ${functionName}` },
      };
  }
}
