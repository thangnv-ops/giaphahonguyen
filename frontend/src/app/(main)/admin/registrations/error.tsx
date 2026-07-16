/**
 * @project AncestorTree
 * @file src/app/(main)/admin/registrations/error.tsx
 * @description Error boundary for admin registrations
 * @version 1.0.0
 * @updated 2026-03-09
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function AdminRegistrationsError({ reset }: { reset: () => void }) {
  return (
    <div className="container mx-auto p-4">
      <Card className="border-destructive">
        <CardContent className="py-12 text-center">
          <p className="text-destructive mb-4">Lỗi khi tải danh sách đơn đăng ký</p>
          <Button onClick={reset} variant="outline">Thử lại</Button>
        </CardContent>
      </Card>
    </div>
  );
}
