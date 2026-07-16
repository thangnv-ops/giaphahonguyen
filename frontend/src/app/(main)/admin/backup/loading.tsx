/**
 * @project AncestorTree
 * @file src/app/(main)/admin/backup/loading.tsx
 * @description Loading skeleton for the Backup & Restore page
 * @version 1.0.0
 * @updated 2026-02-28
 */

import { Skeleton } from '@/components/ui/skeleton';

export default function BackupLoading() {
  return (
    <div className="container max-w-2xl py-8 space-y-6">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-80" />
      <Skeleton className="h-40 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-56 rounded-xl" />
    </div>
  );
}
