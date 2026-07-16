'use client';
/**
 * @project AncestorTree
 * @file src/app/(main)/admin/import-export/page.tsx
 * @description Admin page for ZIP export and import of desktop data.
 *              Desktop mode only. Allows full backup/restore of all 12 tables.
 * @version 1.0.0
 * @updated 2026-02-26
 */

import { useState } from 'react';
import { Download, Upload, AlertTriangle, CheckCircle2, FileArchive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type IncludeMedia = 'skip' | 'reference' | 'inline';

interface ImportResult {
  total_inserted: number;
  tables: Record<string, number>;
  errors?: string[];
}

export default function ImportExportPage() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [includeMedia, setIncludeMedia] = useState<IncludeMedia>('reference');

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/desktop-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ include_media: includeMedia }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Export thất bại');
      }
      // Trigger download
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const filename = `giapha-${new Date().toISOString().slice(0, 10)}.zip`;
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      toast.success('Xuất dữ liệu thành công!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export thất bại');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (file: File) => {
    if (!window.confirm(`Xác nhận nhập dữ liệu từ "${file.name}"?\n\nTOÀN BỘ dữ liệu hiện tại sẽ bị xóa và thay thế.`)) return;
    setImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/desktop-import', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import thất bại');
      setImportResult(data);
      toast.success(`Nhập thành công ${data.total_inserted} bản ghi`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import thất bại');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="container max-w-2xl py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileArchive className="w-6 h-6" /> Xuất / Nhập dữ liệu
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Sao lưu và khôi phục toàn bộ dữ liệu gia phả dưới dạng file ZIP.
        </p>
      </div>

      {/* Export section */}
      <div className="rounded-xl border p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
            <Download className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Xuất dữ liệu</h2>
            <p className="text-sm text-muted-foreground">Tải về file ZIP chứa toàn bộ gia phả.</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Tuỳ chọn media:</p>
          <div className="grid grid-cols-3 gap-2">
            {([
              ['skip', 'Bỏ qua', 'Chỉ dữ liệu, không có ảnh'],
              ['reference', 'Tham chiếu', 'Lưu đường dẫn ảnh (mặc định)'],
              ['inline', 'Nhúng ảnh', 'Đính kèm toàn bộ ảnh vào ZIP'],
            ] as [IncludeMedia, string, string][]).map(([val, label, desc]) => (
              <button
                key={val}
                onClick={() => setIncludeMedia(val)}
                className={`flex flex-col p-3 rounded-lg border-2 text-left transition-all ${
                  includeMedia === val
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-muted hover:border-muted-foreground/40'
                }`}
              >
                <span className="font-medium text-sm">{label}</span>
                <span className="text-xs text-muted-foreground mt-0.5">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        <Button onClick={handleExport} disabled={exporting} className="w-full">
          <Download className="w-4 h-4 mr-2" />
          {exporting ? 'Đang xuất...' : 'Xuất dữ liệu'}
        </Button>
      </div>

      {/* Import section */}
      <div className="rounded-xl border p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
            <Upload className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Nhập dữ liệu</h2>
            <p className="text-sm text-muted-foreground">Khôi phục từ file ZIP đã xuất trước đó.</p>
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>Toàn bộ dữ liệu hiện tại sẽ bị <strong>xóa</strong> và thay thế bằng dữ liệu trong file.</span>
        </div>

        <label className="block">
          <input
            type="file"
            accept=".zip"
            className="sr-only"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleImport(f); e.target.value = ''; }}
            disabled={importing}
          />
          <Button asChild variant="outline" disabled={importing} className="w-full cursor-pointer">
            <span>
              <Upload className="w-4 h-4 mr-2" />
              {importing ? 'Đang nhập...' : 'Chọn file ZIP để nhập'}
            </span>
          </Button>
        </label>

        {/* Import result */}
        {importResult && (
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4" /> Nhập thành công — {importResult.total_inserted} bản ghi
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {Object.entries(importResult.tables).map(([table, count]) => (
                <div key={table} className="flex justify-between">
                  <span>{table}</span>
                  <span className="font-mono">{count}</span>
                </div>
              ))}
            </div>
            {importResult.errors && importResult.errors.length > 0 && (
              <div className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                <p className="font-medium">Cảnh báo:</p>
                {importResult.errors.slice(0, 3).map((e, i) => <p key={i}>{e}</p>)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
