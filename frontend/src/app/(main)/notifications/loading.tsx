/**
 * @project AncestorTree
 * @file src/app/(main)/notifications/loading.tsx
 * @description Loading skeleton for notifications page
 * @version 1.0.0
 * @updated 2026-03-09
 */

import { Skeleton } from '@/components/ui/skeleton';

export default function NotificationsLoading() {
  return (
    <div className="container mx-auto p-4 max-w-2xl space-y-6">
      <Skeleton className="h-8 w-48" />
      {[1, 2, 3, 4, 5].map(i => (
        <Skeleton key={i} className="h-20 rounded-lg" />
      ))}
    </div>
  );
}
