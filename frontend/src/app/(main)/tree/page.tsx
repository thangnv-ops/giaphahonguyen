/**
 * @project AncestorTree
 * @file src/app/(main)/tree/page.tsx
 * @description Family tree visualization page with GEDCOM export + elderly mode
 * @version 2.1.0
 * @updated 2026-03-09
 */

'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTreeData } from '@/hooks/use-families';
import { useElderly } from '@/contexts/elderly-context';
import { useAuth } from '@/components/auth/auth-provider';
import { generateGedcom, downloadGedcom } from '@/lib/gedcom-export';
import { ElderlyTreeView } from '@/components/tree/elderly-tree-view';
import { GitBranchPlus, Download, Loader2, List } from 'lucide-react';
import { toast } from 'sonner';

const FamilyTree = dynamic(
  () => import('@/components/tree/family-tree').then(m => ({ default: m.FamilyTree })),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[60vh] w-full rounded-lg" />,
  }
);

export default function TreePage() {
  const { data: treeData } = useTreeData();
  const { elderlyMode } = useElderly();
  const { isAdmin, isEditor } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const canExport = isAdmin || isEditor;

  const handleExport = () => {
    if (!treeData) {
      toast.error('Chưa có dữ liệu để xuất');
      return;
    }
    setIsExporting(true);
    try {
      const content = generateGedcom(treeData);
      downloadGedcom(content);
      toast.success('Xuất file GEDCOM thành công');
    } catch {
      toast.error('Lỗi khi xuất file');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {elderlyMode ? <List className="h-6 w-6" /> : <GitBranchPlus className="h-6 w-6" />}
            {elderlyMode ? 'Danh sách thành viên theo đời' : 'Cây Gia Phả'}
          </h1>
          <p className="text-muted-foreground">
            {elderlyMode
              ? 'Xem danh sách thành viên phân theo từng đời — nhấn vào tên để xem chi tiết'
              : 'Sơ đồ phả hệ trực quan - Click vào từng thành viên để xem chi tiết'}
          </p>
        </div>
        {canExport && !elderlyMode && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting || !treeData}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Xuất GEDCOM
          </Button>
        )}
      </div>

      {elderlyMode ? (
        <ElderlyTreeView />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hướng dẫn</CardTitle>
            <CardDescription className="space-y-1">
              <span className="block sm:inline">
                • <span className="text-blue-500">Viền xanh</span> = Nam
                • <span className="text-pink-500">Viền hồng</span> = Nữ
              </span>
              <span className="block sm:inline">
                • <span className="text-pink-400">Đường hồng</span> = Vợ chồng
                • † = Đã mất
              </span>
              <span className="block text-xs mt-1">
                Trên mobile: kéo để di chuyển, dùng nút +/- để zoom
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FamilyTree />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
