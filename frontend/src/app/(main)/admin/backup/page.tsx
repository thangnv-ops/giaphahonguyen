'use client';
/**
 * @project AncestorTree
 * @file src/app/(main)/admin/backup/page.tsx
 * @description Trang Sao lưu & Khôi phục — 1 click export, 1 click import,
 *              tự động sao lưu định kỳ. Hoạt động ở cả chế độ Desktop (SQLite)
 *              và Web (Supabase). Giao diện hoàn toàn bằng tiếng Việt.
 * @version 1.0.0
 * @updated 2026-02-28
 */

import { useState, useEffect, useRef } from 'react';
import {
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  DatabaseBackup,
  Clock,
  Info,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useBackupSchedule, type BackupInterval } from '@/hooks/use-backup-schedule';

type IncludeMedia = 'skip' | 'reference' | 'inline';

interface RestoreResult {
  total_inserted: number;
  tables: Record<string, number>;
  errors?: string[];
  mode?: string;
}

const TABLE_NAMES: Record<string, string> = {
  people: 'Thành viên',
  families: 'Gia đình',
  children: 'Con cái',
  contributions: 'Đề xuất',
  events: 'Sự kiện',
  media: 'Hình ảnh',
  achievements: 'Vinh danh',
  fund_transactions: 'Giao dịch quỹ',
  scholarships: 'Học bổng',
  clan_articles: 'Hương ước',
  cau_duong_pools: 'Nhóm cầu đương',
  cau_duong_assignments: 'Lịch cầu đương',
  clan_documents: 'Tài liệu',
};

const isDesktop = process.env.NEXT_PUBLIC_DESKTOP_MODE === 'true';

export default function BackupPage() {
  const [exporting, setExporting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState<RestoreResult | null>(null);
  const [includeMedia, setIncludeMedia] = useState<IncludeMedia>('reference');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoBackupTriggered = useRef(false);

  const {
    schedule,
    setSchedule,
    recordBackup,
    isDue,
    nextDue,
    intervalLabel,
    INTERVAL_LABELS,
  } = useBackupSchedule();

  // ── Auto-download when backup is due ──────────────────────────────────
  useEffect(() => {
    if (isDue && schedule.autoDownload && !autoBackupTriggered.current) {
      autoBackupTriggered.current = true;
      toast.info('Đã đến lịch sao lưu tự động, đang tải xuống…');
      handleExport(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDue, schedule.autoDownload]);

  // ── Export handler ─────────────────────────────────────────────────────
  async function handleExport(isAuto = false) {
    setExporting(true);
    try {
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ include_media: isAuto ? 'reference' : includeMedia }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Sao lưu thất bại');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const filename = `giapha-${new Date().toISOString().slice(0, 10)}.zip`;
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      recordBackup();
      toast.success('Sao lưu thành công! File đã được tải xuống.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sao lưu thất bại');
    } finally {
      setExporting(false);
    }
  }

  // ── Restore handler ────────────────────────────────────────────────────
  async function handleRestore(file: File) {
    if (!window.confirm(
      `Xác nhận khôi phục từ "${file.name}"?\n\nTOÀN BỘ dữ liệu hiện tại sẽ bị XÓA và thay thế bằng dữ liệu trong file sao lưu.\n\nHành động này KHÔNG THỂ hoàn tác.`
    )) return;

    setRestoring(true);
    setRestoreResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/backup/restore', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Khôi phục thất bại');
      setRestoreResult(data);
      toast.success(`Khôi phục thành công — ${data.total_inserted} bản ghi`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Khôi phục thất bại');
    } finally {
      setRestoring(false);
    }
  }

  const formatDate = (d: Date | null | string) => {
    if (!d) return '—';
    const dt = typeof d === 'string' ? new Date(d) : d;
    return dt.toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="container max-w-2xl py-8 space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <DatabaseBackup className="w-6 h-6" />
          Sao lưu &amp; Khôi phục
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Xuất toàn bộ dữ liệu gia phả ra một file ZIP duy nhất và khôi phục khi cần thiết.
        </p>
      </div>

      {/* ── Due notification ── */}
      {isDue && !schedule.autoDownload && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700">
          <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Đã đến lịch sao lưu {intervalLabel.toLowerCase()}
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
              Lần sao lưu gần nhất: {formatDate(schedule.lastBackupAt)}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => handleExport()} disabled={exporting}>
            <Download className="w-3 h-3 mr-1.5" />
            Sao lưu ngay
          </Button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 1 — SAO LƯU NGAY
      ══════════════════════════════════════════════════════════════════ */}
      <div className="rounded-xl border p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
            <Download className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Sao lưu ngay</h2>
            <p className="text-sm text-muted-foreground">
              Tải xuống toàn bộ dữ liệu gia phả dưới dạng 1 file ZIP.
            </p>
          </div>
        </div>

        {/* Media option (desktop only — web mode uses reference by default) */}
        {isDesktop && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Tùy chọn hình ảnh:</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                ['skip', 'Bỏ qua', 'Chỉ dữ liệu, không có ảnh'] as [IncludeMedia, string, string],
                ['reference', 'Liên kết', 'Lưu đường dẫn ảnh (khuyến nghị)'] as [IncludeMedia, string, string],
                ['inline', 'Nhúng ảnh', 'Đính kèm toàn bộ ảnh vào ZIP'] as [IncludeMedia, string, string],
              ]).map(([val, label, desc]) => (
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
        )}

        {!isDesktop && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-xs">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>Chế độ Web: ảnh được lưu dưới dạng đường dẫn (liên kết Supabase Storage).</span>
          </div>
        )}

        <Button
          onClick={() => handleExport()}
          disabled={exporting}
          className="w-full h-11 text-base"
          size="lg"
        >
          {exporting ? (
            <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Đang xuất dữ liệu…</>
          ) : (
            <><Download className="w-4 h-4 mr-2" />Xuất sao lưu</>
          )}
        </Button>

        {schedule.lastBackupAt && (
          <p className="text-xs text-center text-muted-foreground">
            Sao lưu gần nhất: {formatDate(schedule.lastBackupAt)}
          </p>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 2 — KHÔI PHỤC
      ══════════════════════════════════════════════════════════════════ */}
      <div className="rounded-xl border p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
            <Upload className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Khôi phục dữ liệu</h2>
            <p className="text-sm text-muted-foreground">
              Chọn file ZIP đã sao lưu trước đó để khôi phục toàn bộ dữ liệu.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Cảnh báo:</strong> Toàn bộ dữ liệu hiện tại sẽ bị <strong>xóa hoàn toàn</strong> và thay thế bằng dữ liệu trong file sao lưu. Hành động này không thể hoàn tác.
          </span>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip"
          className="sr-only"
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) handleRestore(f);
            e.target.value = '';
          }}
          disabled={restoring}
        />

        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={restoring}
          className="w-full h-11 text-base border-dashed"
          size="lg"
        >
          {restoring ? (
            <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Đang khôi phục…</>
          ) : (
            <><Upload className="w-4 h-4 mr-2" />Chọn file ZIP để khôi phục</>
          )}
        </Button>

        {/* Restore result */}
        {restoreResult && (
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Khôi phục thành công — {restoreResult.total_inserted} bản ghi
              {restoreResult.mode && (
                <Badge variant="outline" className="ml-auto text-xs">
                  {restoreResult.mode === 'desktop' ? 'Desktop' : 'Web'}
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {Object.entries(restoreResult.tables).map(([table, count]) => (
                <div key={table} className="flex justify-between text-xs py-0.5">
                  <span className="text-muted-foreground">{TABLE_NAMES[table] ?? table}</span>
                  <span className="font-mono font-medium">{count}</span>
                </div>
              ))}
            </div>
            {restoreResult.errors && restoreResult.errors.length > 0 && (
              <div className="text-xs text-amber-700 dark:text-amber-300 space-y-0.5">
                <p className="font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Cảnh báo:
                </p>
                {restoreResult.errors.slice(0, 5).map((e, i) => <p key={i}>{e}</p>)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 3 — TỰ ĐỘNG SAO LƯU
      ══════════════════════════════════════════════════════════════════ */}
      <div className="rounded-xl border p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Tự động sao lưu</h2>
            <p className="text-sm text-muted-foreground">
              Nhắc nhở hoặc tự động tải xuống file sao lưu theo lịch định kỳ.
            </p>
          </div>
        </div>

        {/* Interval selector */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Tần suất sao lưu:</p>
          <div className="grid grid-cols-4 gap-2">
            {(Object.entries(INTERVAL_LABELS) as [BackupInterval, string][]).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setSchedule({ interval: val })}
                className={`p-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                  schedule.interval === val
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                    : 'border-muted hover:border-muted-foreground/40'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Auto-download toggle */}
        {schedule.interval !== 'off' && (
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={schedule.autoDownload}
                onChange={e => setSchedule({ autoDownload: e.target.checked })}
              />
              <div className="w-10 h-6 rounded-full bg-muted peer-checked:bg-violet-500 transition-colors" />
              <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
            </div>
            <div>
              <p className="text-sm font-medium">Tự động tải xuống khi đến lịch</p>
              <p className="text-xs text-muted-foreground">
                File sẽ được tải xuống tự động khi bạn mở trang này và đã đến lịch sao lưu
              </p>
            </div>
          </label>
        )}

        {/* Status row */}
        {schedule.interval !== 'off' && (
          <div className="rounded-lg bg-muted/50 p-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lần sao lưu gần nhất</span>
              <span className="font-medium">{formatDate(schedule.lastBackupAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lần sao lưu tiếp theo</span>
              <span className="font-medium">
                {nextDue ? formatDate(nextDue) : '—'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Trạng thái</span>
              <Badge variant={isDue ? 'destructive' : 'secondary'} className="text-xs">
                {isDue ? 'Cần sao lưu' : 'Đã cập nhật'}
              </Badge>
            </div>
          </div>
        )}

        {schedule.interval === 'off' && (
          <p className="text-xs text-muted-foreground text-center">
            Chọn tần suất để bật tính năng tự động sao lưu.
          </p>
        )}
      </div>
    </div>
  );
}
