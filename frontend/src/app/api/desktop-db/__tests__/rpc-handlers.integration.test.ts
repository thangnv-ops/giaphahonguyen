/**
 * @project AncestorTree
 * @file src/app/api/desktop-db/__tests__/rpc-handlers.integration.test.ts
 * @description Integration tests for is_person_in_subtree RPC (DFS traversal).
 *              Verifies the family-tree subtree check used by the cây gia phả feature.
 * @version 1.0.0
 * @updated 2026-02-26
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { Database } from 'sql.js';
import { handleRpc } from '../rpc-handlers';
import { createTestDb, insertPerson, insertFamily, insertChild } from './test-helpers';

let db: Database;

beforeEach(async () => {
  db = await createTestDb();
});

/**
 * Test Family Tree:
 *
 *   [root] ─── fam-root ─── [child-1]
 *                        └── [child-2]
 *                                └── fam-child2 ─── [grandchild-1]
 */
function buildTestTree(database: Database) {
  insertPerson(database, 'root', { display_name: 'Tổ', generation: 1 });
  insertPerson(database, 'child-1', { display_name: 'Con 1', generation: 2 });
  insertPerson(database, 'child-2', { display_name: 'Con 2', generation: 2 });
  insertPerson(database, 'grandchild-1', { display_name: 'Cháu 1', generation: 3 });
  insertPerson(database, 'unrelated', { display_name: 'Người lạ', generation: 1 });

  insertFamily(database, 'fam-root', 'root', null);
  insertChild(database, 'fam-root', 'child-1');
  insertChild(database, 'fam-root', 'child-2');

  insertFamily(database, 'fam-child2', 'child-2', null);
  insertChild(database, 'fam-child2', 'grandchild-1');
}

// ─── is_person_in_subtree ───────────────────────────────────────────────────

describe('handleRpc — is_person_in_subtree', () => {
  beforeEach(() => {
    buildTestTree(db);
  });

  it('TC-RPC-001: root is in its own subtree', () => {
    const result = handleRpc(db, 'is_person_in_subtree', {
      root_id: 'root',
      target_id: 'root',
    });
    expect(result.error).toBeNull();
    expect(result.data).toBe(true);
  });

  it('TC-RPC-002: direct child is in root subtree', () => {
    const result = handleRpc(db, 'is_person_in_subtree', {
      root_id: 'root',
      target_id: 'child-1',
    });
    expect(result.error).toBeNull();
    expect(result.data).toBe(true);
  });

  it('TC-RPC-003: grandchild is in root subtree (depth-2 traversal)', () => {
    const result = handleRpc(db, 'is_person_in_subtree', {
      root_id: 'root',
      target_id: 'grandchild-1',
    });
    expect(result.error).toBeNull();
    expect(result.data).toBe(true);
  });

  it('TC-RPC-004: unrelated person is NOT in root subtree', () => {
    const result = handleRpc(db, 'is_person_in_subtree', {
      root_id: 'root',
      target_id: 'unrelated',
    });
    expect(result.error).toBeNull();
    expect(result.data).toBe(false);
  });

  it('TC-RPC-005: child is NOT an ancestor of root (not bidirectional)', () => {
    const result = handleRpc(db, 'is_person_in_subtree', {
      root_id: 'child-1',
      target_id: 'root',
    });
    expect(result.error).toBeNull();
    expect(result.data).toBe(false);
  });

  it('TC-RPC-006: grandchild NOT in sibling subtree', () => {
    const result = handleRpc(db, 'is_person_in_subtree', {
      root_id: 'child-1',
      target_id: 'grandchild-1',
    });
    expect(result.error).toBeNull();
    expect(result.data).toBe(false);
  });

  it('TC-RPC-007: returns false for nonexistent root_id', () => {
    const result = handleRpc(db, 'is_person_in_subtree', {
      root_id: 'nonexistent-id',
      target_id: 'child-1',
    });
    expect(result.error).toBeNull();
    expect(result.data).toBe(false);
  });

  it('TC-RPC-008: child is in parent subtree when mother_id is the parent', () => {
    insertPerson(db, 'mother', { display_name: 'Mẹ', generation: 1 });
    insertPerson(db, 'child-m', { display_name: 'Con', generation: 2 });
    insertFamily(db, 'fam-mother', null, 'mother');
    insertChild(db, 'fam-mother', 'child-m');

    const result = handleRpc(db, 'is_person_in_subtree', {
      root_id: 'mother',
      target_id: 'child-m',
    });
    expect(result.data).toBe(true);
  });

  it('TC-RPC-009: handles cycle-safe (no infinite loop)', async () => {
    // Create a "cycle" by making a person appear in two families — should not hang
    insertPerson(db, 'cyc-parent', { generation: 1 });
    insertPerson(db, 'cyc-child', { generation: 2 });

    insertFamily(db, 'fam-cyc-1', 'cyc-parent', null);
    insertChild(db, 'fam-cyc-1', 'cyc-child');
    insertFamily(db, 'fam-cyc-2', 'cyc-parent', null);
    insertChild(db, 'fam-cyc-2', 'cyc-child');

    const startTime = Date.now();
    const result = handleRpc(db, 'is_person_in_subtree', {
      root_id: 'cyc-parent',
      target_id: 'cyc-child',
    });
    const elapsed = Date.now() - startTime;

    expect(result.data).toBe(true);
    expect(elapsed).toBeLessThan(1000); // Must complete in <1s
  });
});

// ─── Unknown RPC ───────────────────────────────────────────────────────────

describe('handleRpc — unknown function', () => {
  it('TC-RPC-020: returns error for unknown function name', () => {
    const result = handleRpc(db, 'unknown_function', {});
    expect(result.error).not.toBeNull();
    expect(result.error?.message).toContain('unknown_function');
  });
});
