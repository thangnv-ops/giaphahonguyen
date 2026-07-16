/**
 * @project AncestorTree
 * @file src/app/(main)/feed/loading.tsx
 * @description Loading skeleton for feed page
 * @version 1.0.0
 * @updated 2026-03-09
 */

import { Skeleton } from '@/components/ui/skeleton';

export default function FeedLoading() {
  return (
    <div className="container mx-auto p-4 max-w-2xl space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
      <Skeleton className="h-32 rounded-lg" />
      {[1, 2, 3].map(i => (
        <Skeleton key={i} className="h-48 rounded-lg" />
      ))}
    </div>
  );
}
