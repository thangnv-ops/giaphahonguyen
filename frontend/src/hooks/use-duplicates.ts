/**
 * @project AncestorTree
 * @file src/hooks/use-duplicates.ts
 * @description React Query hook for duplicate detection (client-side)
 * @version 1.0.0
 * @updated 2026-03-09
 */

'use client';

import { useMemo } from 'react';
import { useTreeData } from './use-families';
import { findDuplicates } from '@/lib/duplicate-detection';
import type { DuplicatePair } from '@/types';

export function useDuplicates() {
  const { data: treeData, isLoading } = useTreeData();

  const duplicates = useMemo<DuplicatePair[]>(() => {
    if (!treeData) return [];
    return findDuplicates(treeData);
  }, [treeData]);

  return { data: duplicates, isLoading };
}
