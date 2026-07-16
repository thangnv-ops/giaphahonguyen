/**
 * @project AncestorTree
 * @file src/app/(main)/admin/backup/error.tsx
 * @description Error boundary for the Backup & Restore admin page
 * @version 1.0.0
 * @updated 2026-02-28
 */

'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function BackupError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[BackupPage]', error);
  }, [error]);

  return (
    <div className="container max-w-2xl py-16 flex flex-col items-center gap-4 text-center">
      <AlertTriangle className="w-12 h-12 text-destructive" />
      <h2 className="text-xl font-semibold">Đã xảy ra lỗi</h2>
      <p className="text-sm text-muted-foreground max-w-md">
        {error.message || 'Không thể tải trang Sao lưu & Khôi phục. Vui lòng thử lại.'}
      </p>
      <Button onClick={reset} variant="outline">Thử lại</Button>
    </div>
  );
}
