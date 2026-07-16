/**
 * @project AncestorTree
 * @file src/app/(main)/relationship/error.tsx
 * @description Error boundary for relationship finder page
 * @version 1.0.0
 * @updated 2026-03-09
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function RelationshipError({ reset }: { reset: () => void }) {
  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardContent className="py-12 text-center space-y-4">
          <p className="text-muted-foreground">Đã xảy ra lỗi khi tải trang tìm quan hệ.</p>
          <Button onClick={reset} variant="outline">Thử lại</Button>
        </CardContent>
      </Card>
    </div>
  );
}
