/**
 * @project AncestorTree
 * @file src/hooks/use-fuzzy-search.ts
 * @description Fuse.js wrapper hook for client-side fuzzy search
 * @version 1.0.0
 * @updated 2026-03-09
 */

'use client';

import { useMemo } from 'react';
import Fuse, { type IFuseOptions } from 'fuse.js';
import type { Person } from '@/types';

const FUSE_OPTIONS: IFuseOptions<Person> = {
  keys: [
    { name: 'display_name', weight: 0.7 },
    { name: 'birth_place', weight: 0.2 },
    { name: 'occupation', weight: 0.1 },
  ],
  threshold: 0.3,
  includeScore: true,
  minMatchCharLength: 2,
};

/**
 * Fuzzy search hook for people list.
 * Returns filtered results when query is provided, full list otherwise.
 */
export function useFuzzySearch(people: Person[] | undefined, query: string): Person[] {
  const fuse = useMemo(() => {
    if (!people || people.length === 0) return null;
    return new Fuse(people, FUSE_OPTIONS);
  }, [people]);

  return useMemo(() => {
    if (!people) return [];
    if (!query || query.trim().length < 2 || !fuse) return people;
    return fuse.search(query.trim()).map(r => r.item);
  }, [people, query, fuse]);
}
