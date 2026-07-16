/**
 * @project AncestorTree
 * @file src/hooks/use-pathfinding.ts
 * @description React hook for relationship pathfinding between two people
 * @version 1.0.0
 * @updated 2026-03-09
 */

import { useMemo } from 'react';
import { useTreeData } from './use-families';
import { findRelationship } from '@/lib/pathfinding';
import type { RelationshipResult } from '@/lib/pathfinding';

export function useRelationship(
  personAId: string | null,
  personBId: string | null,
): { result: RelationshipResult | null; isLoading: boolean } {
  const { data: treeData, isLoading } = useTreeData();

  const result = useMemo(() => {
    if (!treeData || !personAId || !personBId) return null;
    return findRelationship(treeData, personAId, personBId);
  }, [treeData, personAId, personBId]);

  return { result, isLoading };
}
