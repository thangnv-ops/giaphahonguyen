/**
 * @project AncestorTree
 * @file src/app/(main)/admin/feed/loading.tsx
 * @description Loading skeleton for admin feed moderation page
 * @version 1.0.0
 * @updated 2026-03-09
 */

import { Skeleton } from '@/components/ui/skeleton';

export default function AdminFeedLoading() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
      <div className="flex gap-3">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-10 flex-1 max-w-sm" />
      </div>
      {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-lg" />)}
    </div>
  );
}
