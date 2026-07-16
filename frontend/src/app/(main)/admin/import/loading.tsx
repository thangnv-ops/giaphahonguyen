/**
 * @project AncestorTree
 * @file src/app/(main)/admin/import/loading.tsx
 * @description Loading skeleton for GEDCOM import page
 * @version 1.0.0
 * @updated 2026-03-09
 */

import { Skeleton } from '@/components/ui/skeleton';

export default function ImportLoading() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
      <Skeleton className="h-48 rounded-lg" />
    </div>
  );
}
