/**
 * @project AncestorTree
 * @file src/app/(main)/relationship/page.tsx
 * @description Relationship finder page — select 2 people and find their connection
 * @version 1.0.0
 * @updated 2026-03-09
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchPeople } from '@/hooks/use-people';
import { useRelationship } from '@/hooks/use-pathfinding';
import { Search, X, Route, ArrowRight, GitBranchPlus, Loader2 } from 'lucide-react';
import type { Person } from '@/types';

// ─── PersonCombobox (reused pattern from people/new) ────────────────────────

interface PersonComboboxProps {
  label: string;
  selected: Person | null;
  onSelect: (person: Person | null) => void;
  excludeId?: string;
}

function PersonCombobox({ label, selected, onSelect, excludeId }: PersonComboboxProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const { data: results, isFetching } = useSearchPeople(query);

  const filtered = (results || []).filter((p) => p.id !== excludeId);

  const handleSelect = (person: Person) => {
    onSelect(person);
    setQuery('');
    setOpen(false);
  };

  const handleClear = () => {
    onSelect(null);
    setQuery('');
  };

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      {selected ? (
        <div className="flex items-center gap-2 p-2 rounded-md border bg-muted/50">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
              selected.gender === 1 ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
            }`}
          >
            {selected.display_name.slice(-1)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selected.display_name}</p>
            <p className="text-xs text-muted-foreground">Đời {selected.generation}</p>
          </div>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleClear}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Tìm ${label.toLowerCase()}...`}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(e.target.value.length >= 2);
              }}
              onFocus={() => query.length >= 2 && setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 200)}
              className="pl-9"
            />
          </div>
          {open && (
            <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto">
              {isFetching && (
                <p className="px-3 py-2 text-sm text-muted-foreground">Đang tìm...</p>
              )}
              {!isFetching && filtered.length === 0 && query.length >= 2 && (
                <p className="px-3 py-2 text-sm text-muted-foreground">Không tìm thấy</p>
              )}
              {filtered.map((person) => (
                <button
                  key={person.id}
                  type="button"
                  onMouseDown={() => handleSelect(person)}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-muted transition-colors"
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                      person.gender === 1
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-pink-100 text-pink-700'
                    }`}
                  >
                    {person.display_name.slice(-1)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{person.display_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Đời {person.generation}
                      {person.birth_year ? ` · ${person.birth_year}` : ''}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function RelationshipPage() {
  const [personA, setPersonA] = useState<Person | null>(null);
  const [personB, setPersonB] = useState<Person | null>(null);
  const { result, isLoading } = useRelationship(personA?.id ?? null, personB?.id ?? null);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Route className="h-6 w-6" />
          Tìm quan hệ giữa 2 thành viên
        </h1>
        <p className="text-muted-foreground">
          Chọn 2 thành viên bất kỳ để tìm mối quan hệ và tổ tiên chung
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chọn thành viên</CardTitle>
          <CardDescription>Nhập tên để tìm kiếm (tối thiểu 2 ký tự)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <PersonCombobox
              label="Người 1"
              selected={personA}
              onSelect={setPersonA}
              excludeId={personB?.id}
            />
            <PersonCombobox
              label="Người 2"
              selected={personB}
              onSelect={setPersonB}
              excludeId={personA?.id}
            />
          </div>
        </CardContent>
      </Card>

      {isLoading && personA && personB && (
        <Card>
          <CardContent className="py-8 flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Đang tìm quan hệ...
          </CardContent>
        </Card>
      )}

      {result && !isLoading && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kết quả</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Relationship description */}
            <div className="rounded-lg border p-4 bg-muted/30 space-y-2">
              <p className="text-lg font-semibold">{result.description}</p>
              {result.descriptionDetail && (
                <p className="text-sm text-muted-foreground">{result.descriptionDetail}</p>
              )}
            </div>

            {/* Path visualization */}
            {result.found && result.path.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">
                  Đường đi ({result.distance} bậc):
                </p>
                <div className="flex flex-wrap items-center gap-1">
                  {result.path.map((person, idx) => (
                    <div key={person.id} className="flex items-center gap-1">
                      <Link
                        href={`/people/${person.id}`}
                        className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-sm hover:bg-accent transition-colors"
                      >
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium ${
                            person.gender === 1 ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                          }`}
                        >
                          {person.display_name.slice(-1)}
                        </div>
                        {person.display_name}
                      </Link>
                      {idx < result.path.length - 1 && (
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LCA info */}
            {result.lca && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Tổ tiên chung:</span>
                <Link href={`/people/${result.lca.id}`} className="font-medium hover:underline">
                  {result.lca.display_name}
                </Link>
                <Badge variant="outline">Đời {result.lca.generation}</Badge>
              </div>
            )}

            {/* View on tree */}
            {result.found && personA && (
              <div className="pt-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/tree?root=${personA.id}`}>
                    <GitBranchPlus className="h-4 w-4 mr-1.5" />
                    Xem trên cây gia phả
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
