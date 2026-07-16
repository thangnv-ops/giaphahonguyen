/**
 * @project AncestorTree
 * @file src/app/(main)/admin/import/page.tsx
 * @description Admin GEDCOM import wizard — upload + preview (DB insert planned for future sprint)
 * @version 1.1.0
 * @updated 2026-03-09
 */

'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth/auth-provider';
import { useTreeData } from '@/hooks/use-families';
import { prepareImport } from '@/lib/gedcom-import';
import type { ImportSummary } from '@/lib/gedcom-import';
import { Upload, FileText, CheckCircle, AlertCircle, AlertTriangle, Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

type Step = 'upload' | 'preview';

export default function AdminImportPage() {
  const { isEditor } = useAuth();
  const { data: treeData } = useTreeData();
  const [step, setStep] = useState<Step>('upload');
  const [fileName, setFileName] = useState('');
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isEditor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Bạn cần quyền biên tập viên để truy cập trang này</p>
            <Button asChild className="mt-4"><Link href="/">Về trang chủ</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.ged')) {
      toast.error('Vui lòng chọn file .ged (GEDCOM)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File quá lớn (tối đa 10MB)');
      return;
    }

    setIsProcessing(true);
    setFileName(file.name);

    try {
      const content = await file.text();
      const result = prepareImport(content, treeData || undefined);
      setSummary(result);
      setStep('preview');
    } catch {
      toast.error('Lỗi khi đọc file GEDCOM');
    } finally {
      setIsProcessing(false);
    }
  }, [treeData]);

  // Prototype: DB insert not yet implemented (XL effort — planned for future sprint)
  const isImportReady = false;

  const handleReset = () => {
    setStep('upload');
    setSummary(null);
    setFileName('');
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nhập dữ liệu GEDCOM</h1>
        <p className="text-muted-foreground">Import file .ged (GEDCOM 7.0 hoặc 5.5.1) vào hệ thống</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        <Badge variant={step === 'upload' ? 'default' : 'outline'}>1. Upload</Badge>
        <ArrowRight className="h-3 w-3 text-muted-foreground" />
        <Badge variant={step === 'preview' ? 'default' : 'outline'}>2. Xem trước</Badge>
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Chọn file GEDCOM
            </CardTitle>
            <CardDescription>
              Hỗ trợ GEDCOM 7.0 và 5.5.1. Tương thích FamilySearch, MyHeritage, Gramps, Ancestry.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".ged"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isProcessing}
                />
                <Button variant="outline" asChild disabled={isProcessing}>
                  <span>
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {isProcessing ? 'Đang xử lý...' : 'Chọn file .ged'}
                  </span>
                </Button>
              </label>
              <p className="text-xs text-muted-foreground mt-2">Tối đa 10MB</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Preview */}
      {step === 'preview' && summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Xem trước: {fileName}
            </CardTitle>
            <CardDescription>
              GEDCOM {summary.parseResult.header.version}
              {summary.parseResult.header.source ? ` — Nguồn: ${summary.parseResult.header.source}` : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-md border p-3 text-center">
                <p className="text-2xl font-bold">{summary.validation.stats.individualCount}</p>
                <p className="text-xs text-muted-foreground">Cá nhân</p>
              </div>
              <div className="rounded-md border p-3 text-center">
                <p className="text-2xl font-bold">{summary.validation.stats.familyCount}</p>
                <p className="text-xs text-muted-foreground">Gia đình</p>
              </div>
              <div className="rounded-md border p-3 text-center">
                <p className="text-2xl font-bold">{summary.validation.stats.duplicateCount}</p>
                <p className="text-xs text-muted-foreground">Trùng lặp</p>
              </div>
            </div>

            {/* Errors */}
            {summary.validation.errors.length > 0 && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-red-700 font-medium text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {summary.validation.errors.length} lỗi
                </div>
                <ul className="text-xs text-red-600 space-y-0.5 ml-6">
                  {summary.validation.errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}
                  {summary.validation.errors.length > 10 && (
                    <li>... và {summary.validation.errors.length - 10} lỗi khác</li>
                  )}
                </ul>
              </div>
            )}

            {/* Warnings */}
            {summary.validation.warnings.length > 0 && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-amber-700 font-medium text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  {summary.validation.warnings.length} cảnh báo
                </div>
                <ul className="text-xs text-amber-600 space-y-0.5 ml-6">
                  {summary.validation.warnings.slice(0, 5).map((w, i) => <li key={i}>{w}</li>)}
                  {summary.validation.warnings.length > 5 && (
                    <li>... và {summary.validation.warnings.length - 5} cảnh báo khác</li>
                  )}
                </ul>
              </div>
            )}

            {/* Duplicates */}
            {summary.validation.duplicates.length > 0 && (
              <div className="rounded-md border p-3 space-y-2">
                <p className="text-sm font-medium">Trùng lặp tiềm ẩn với dữ liệu hiện có:</p>
                <div className="space-y-1">
                  {summary.validation.duplicates.slice(0, 5).map((d, i) => (
                    <div key={i} className="text-xs flex items-center gap-2">
                      <Badge variant={d.level === 'HIGH' ? 'destructive' : 'secondary'} className="text-[10px]">
                        {Math.round(d.score.total * 100)}%
                      </Badge>
                      <span>{d.personA.display_name} ↔ {d.personB.display_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Valid indicator */}
            {summary.validation.valid && summary.validation.errors.length === 0 && (
              <div className="flex items-center gap-2 text-green-700 text-sm">
                <CheckCircle className="h-4 w-4" />
                File hợp lệ, sẵn sàng nhập dữ liệu
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset}>
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Quay lại
              </Button>
              <Button
                disabled={!isImportReady}
                title="Tính năng đang phát triển"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Nhập dữ liệu
                <Badge variant="secondary" className="ml-2 text-[10px]">Sắp ra mắt</Badge>
              </Button>
            </div>

            {!isImportReady && (
              <p className="text-xs text-muted-foreground">
                Chức năng nhập dữ liệu vào CSDL đang được phát triển. Hiện tại chỉ hỗ trợ xem trước và kiểm tra file GEDCOM.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
