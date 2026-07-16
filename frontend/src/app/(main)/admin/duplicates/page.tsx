/**
 * @project AncestorTree
 * @file src/app/(main)/admin/duplicates/page.tsx
 * @description Admin duplicate detection review page
 * @version 1.0.0
 * @updated 2026-03-09
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/components/auth/auth-provider';
import { useDuplicates } from '@/hooks/use-duplicates';
import { Users, ExternalLink, X, AlertTriangle, CheckCircle } from 'lucide-react';
import type { DuplicatePair } from '@/types';

const DISMISSED_KEY = 'ancestortree_dismissed_duplicates';

function getDismissedPairs(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const stored = localStorage.getItem(DISMISSED_KEY);
    return new Set(stored ? JSON.parse(stored) : []);
  } catch {
    return new Set();
  }
}

function saveDismissedPairs(pairs: Set<string>) {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...pairs]));
}

function pairKey(pair: DuplicatePair): string {
  return [pair.personA.id, pair.personB.id].sort().join('_');
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-16 text-muted-foreground">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-emerald-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right">{pct}%</span>
    </div>
  );
}

function PersonCard({ person }: { person: DuplicatePair['personA'] }) {
  return (
    <div className="flex-1 min-w-0 space-y-1">
      <p className="font-medium text-sm truncate">{person.display_name}</p>
      <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
        <span>Đời {person.generation}</span>
        {person.birth_year && <span>· Sinh {person.birth_year}</span>}
        {person.gender === 1 ? <span>· Nam</span> : <span>· Nữ</span>}
      </div>
      <Button variant="ghost" size="sm" className="h-7 text-xs px-2" asChild>
        <Link href={`/people/${person.id}`}>
          <ExternalLink className="h-3 w-3 mr-1" />Xem chi tiết
        </Link>
      </Button>
    </div>
  );
}

export default function AdminDuplicatesPage() {
  const { isEditor } = useAuth();
  const { data: duplicates, isLoading } = useDuplicates();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    setDismissed(getDismissedPairs());
  }, []);

  const handleDismiss = useCallback((pair: DuplicatePair) => {
    const key = pairKey(pair);
    setDismissed(prev => {
      const next = new Set(prev);
      next.add(key);
      saveDismissedPairs(next);
      return next;
    });
  }, []);

  if (!isEditor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Bạn cần quyền biên tập viên để truy cập trang này</p>
            <Button asChild className="mt-4"><Link href="/">Về trang chủ</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const visiblePairs = (duplicates || []).filter(p => !dismissed.has(pairKey(p)));
  const highCount = visiblePairs.filter(p => p.level === 'HIGH').length;
  const mediumCount = visiblePairs.filter(p => p.level === 'MEDIUM').length;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Phát hiện trùng lặp</h1>
        <p className="text-muted-foreground">Phát hiện thành viên có thể bị nhập trùng</p>
      </div>

      {/* Summary */}
      <div className="flex gap-3 text-sm">
        {isLoading ? (
          <Skeleton className="h-6 w-32" />
        ) : visiblePairs.length === 0 ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>Không tìm thấy cặp trùng lặp nào</span>
          </div>
        ) : (
          <>
            <Badge variant="destructive">{highCount} nghi ngờ cao</Badge>
            <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">{mediumCount} trung bình</Badge>
          </>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-lg" />)}
        </div>
      )}

      {/* Pairs */}
      {!isLoading && visiblePairs.length > 0 && (
        <div className="space-y-3">
          {visiblePairs.map(pair => {
            const pct = Math.round(pair.score.total * 100);
            return (
              <Card key={pairKey(pair)} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={pair.level === 'HIGH' ? 'destructive' : 'outline'}
                        className={pair.level === 'MEDIUM' ? 'bg-yellow-50 text-yellow-800 border-yellow-200' : ''}
                      >
                        {pair.level === 'HIGH' ? <AlertTriangle className="h-3 w-3 mr-1" /> : null}
                        {pct}%
                      </Badge>
                      <CardTitle className="text-sm font-medium">
                        {pair.personA.display_name} ↔ {pair.personB.display_name}
                      </CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleDismiss(pair)}
                    >
                      <X className="h-3 w-3 mr-1" />Bỏ qua
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-4">
                    <PersonCard person={pair.personA} />
                    <div className="flex items-center">
                      <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <PersonCard person={pair.personB} />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <ScoreBar label="Tên" value={pair.score.name} />
                    <ScoreBar label="Cha" value={pair.score.father} />
                    <ScoreBar label="Năm sinh" value={pair.score.birthYear} />
                    <ScoreBar label="Đời" value={pair.score.generation} />
                    <ScoreBar label="Giới" value={pair.score.gender} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Info */}
      <Card>
        <CardContent className="py-4">
          <CardDescription className="text-xs space-y-1">
            <p><strong>Cách tính điểm:</strong> Tên (30%) + Cha (25%) + Năm sinh (20%) + Đời (15%) + Giới tính (10%)</p>
            <p><strong>Ngưỡng:</strong> Cao ≥ 85%, Trung bình 60-84%. Dưới 60% được ẩn tự động.</p>
            <p><strong>Loại trừ:</strong> Khác giới tính hoặc chênh năm sinh &gt; 10 năm.</p>
            <p>Các cặp đã &quot;Bỏ qua&quot; được lưu trên trình duyệt này. Xóa dữ liệu trình duyệt để hiện lại.</p>
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
