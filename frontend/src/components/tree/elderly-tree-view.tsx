/**
 * @project AncestorTree
 * @file src/components/tree/elderly-tree-view.tsx
 * @description Simplified tree view for elderly users — list grouped by generation
 * @version 1.0.0
 * @updated 2026-03-09
 */

'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTreeData } from '@/hooks/use-families';
import { Skeleton } from '@/components/ui/skeleton';
import type { Person } from '@/types';

interface GenerationGroup {
  generation: number;
  members: Array<{
    person: Person;
    fatherName?: string;
  }>;
}

export function ElderlyTreeView() {
  const { data: treeData, isLoading } = useTreeData();

  const groups = useMemo<GenerationGroup[]>(() => {
    if (!treeData) return [];

    const { people, families, children } = treeData;

    // Build father lookup: personId → fatherId
    const familyFatherMap = new Map<string, string>();
    for (const f of families) {
      if (f.father_id) familyFatherMap.set(f.id, f.father_id);
    }
    const personFatherMap = new Map<string, string>();
    for (const c of children) {
      const fatherId = familyFatherMap.get(c.family_id);
      if (fatherId) personFatherMap.set(c.person_id, fatherId);
    }

    // Person name lookup
    const nameMap = new Map<string, string>();
    for (const p of people) nameMap.set(p.id, p.display_name);

    // Group by generation
    const genMap = new Map<number, GenerationGroup['members']>();
    for (const person of people) {
      const gen = person.generation;
      const group = genMap.get(gen) || [];
      const fatherId = personFatherMap.get(person.id);
      group.push({
        person,
        fatherName: fatherId ? nameMap.get(fatherId) : undefined,
      });
      genMap.set(gen, group);
    }

    // Sort generations and members
    const sorted: GenerationGroup[] = [];
    const generations = [...genMap.keys()].sort((a, b) => a - b);
    for (const gen of generations) {
      const members = genMap.get(gen) || [];
      members.sort((a, b) => a.person.display_name.localeCompare(b.person.display_name, 'vi'));
      sorted.push({ generation: gen, members });
    }

    return sorted;
  }, [treeData]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Chưa có dữ liệu gia phả
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map(group => (
        <div key={group.generation}>
          <h3 className="text-lg font-bold mb-2 sticky top-0 bg-background py-1">
            Đời {group.generation}
            <Badge variant="outline" className="ml-2">{group.members.length} người</Badge>
          </h3>
          <div className="space-y-1.5">
            {group.members.map(({ person, fatherName }) => (
              <Link
                key={person.id}
                href={`/people/${person.id}`}
                className="flex items-center justify-between rounded-md border px-4 py-3 hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`text-lg font-medium ${person.gender === 1 ? 'text-blue-700' : 'text-pink-700'}`}>
                    {person.display_name}
                  </span>
                  {!person.is_living && <span className="text-muted-foreground">†</span>}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground shrink-0">
                  {person.birth_year && <span>{person.birth_year}</span>}
                  {person.death_year && <span>– {person.death_year}</span>}
                  {fatherName && <span className="hidden sm:inline">con {fatherName}</span>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
