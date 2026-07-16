/**
 * @project AncestorTree
 * @file src/app/(main)/stats/page.tsx
 * @description Statistics dashboard with recharts visualizations
 * @version 1.0.0
 * @updated 2026-03-09
 */

'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTreeData } from '@/hooks/use-families';
import { calculateDetailedStats } from '@/lib/stats-calculator';
import { BarChart3, Users, Heart, Layers } from 'lucide-react';

// Dynamic import recharts to avoid SSR hydration issues (R-04)
const RechartsCharts = dynamic(() => import('./stats-charts'), {
  ssr: false,
  loading: () => <Skeleton className="h-[400px] w-full rounded-lg" />,
});

export default function StatsPage() {
  const { data: treeData, isLoading } = useTreeData();

  const stats = useMemo(() => {
    if (!treeData) return null;
    return calculateDetailedStats(treeData);
  }, [treeData]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
        <Skeleton className="h-[300px] rounded-lg" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Thống kê gia phả
        </h1>
        <p className="text-muted-foreground">
          Biểu đồ phân bố và số liệu tổng hợp
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              Tổng thành viên
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalPeople}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Layers className="h-4 w-4" />
              Số đời
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalGenerations}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Heart className="h-4 w-4" />
              Số gia đình
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalFamilies}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              TB con/gia đình
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.avgChildrenPerFamily}</p>
            <p className="text-xs text-muted-foreground">Tuyệt tự: {stats.childlessRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts (client-only) */}
      <RechartsCharts stats={stats} />
    </div>
  );
}
