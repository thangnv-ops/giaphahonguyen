/**
 * @project AncestorTree
 * @file src/components/layout/elderly-toggle.tsx
 * @description Toggle button for elderly mode (larger fonts, simplified UI)
 * @version 1.0.0
 * @updated 2026-03-09
 */

'use client';

import { Button } from '@/components/ui/button';
import { useElderly } from '@/contexts/elderly-context';
import { Eye } from 'lucide-react';

export function ElderlyToggle() {
  const { elderlyMode, toggleElderlyMode } = useElderly();

  return (
    <Button
      variant={elderlyMode ? 'default' : 'ghost'}
      size="sm"
      onClick={toggleElderlyMode}
      title={elderlyMode ? 'Tắt chế độ hiển thị lớn' : 'Bật chế độ hiển thị lớn'}
      className="gap-1.5"
    >
      <Eye className="h-4 w-4" />
      <span className="hidden sm:inline text-xs">{elderlyMode ? 'Chữ lớn: BẬT' : 'Chữ lớn'}</span>
    </Button>
  );
}
