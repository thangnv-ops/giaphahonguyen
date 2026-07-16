/**
 * @project AncestorTree
 * @file src/app/(main)/admin/registrations/loading.tsx
 * @description Loading skeleton for admin registrations
 * @version 1.0.0
 * @updated 2026-03-09
 */

import { Skeleton } from '@/components/ui/skeleton';

export default function AdminRegistrationsLoading() {
  return (
    <div className="container mx-auto p-4 max-w-4xl space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
      </div>
    </div>
  );
}
