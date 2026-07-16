'use client';
/**
 * @project AncestorTree
 * @file src/app/(main)/setup/page.tsx
 * @description First-run wizard for desktop mode.
 *              Shown automatically when no people exist in the local database.
 *              Steps: Welcome → Import or Start Fresh → Done
 * @version 1.0.0
 * @updated 2026-02-26
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TreePine, Upload, Plus, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type Step = 'welcome' | 'choice' | 'importing' | 'done';

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('welcome');
  const [importResult, setImportResult] = useState<{ total_inserted?: number } | null>(null);

  // Redirect to home if not in desktop mode
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DESKTOP_MODE !== 'true') {
      router.replace('/');
    }
  }, [router]);

  const handleImport = async (file: File) => {
    setStep('importing');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/desktop-import', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import thất bại');
      setImportResult(data);
      setStep('done');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import thất bại');
      setStep('choice');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImport(file);
  };

  const handleStartFresh = () => {
    setStep('done');
  };

  const handleFinish = () => {
    router.replace('/tree');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">

        {/* Step: Welcome */}
        {step === 'welcome' && (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <TreePine className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Gia Phả Điện Tử</h1>
              <p className="text-muted-foreground">
                Chào mừng! Đây là lần đầu tiên bạn sử dụng ứng dụng.
              </p>
            </div>
            <Button size="lg" className="w-full" onClick={() => setStep('choice')}>
              Bắt đầu <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Step: Choice */}
        {step === 'choice' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Bạn muốn làm gì?</h2>
              <p className="text-muted-foreground text-sm">
                Nhập dữ liệu từ file backup hoặc bắt đầu nhập liệu mới.
              </p>
            </div>

            <div className="grid gap-3">
              {/* Import option */}
              <label className="relative cursor-pointer group">
                <input
                  type="file"
                  accept=".zip"
                  className="sr-only"
                  onChange={handleFileChange}
                />
                <div className="flex items-start gap-4 p-4 rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all">
                  <div className="mt-0.5 w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                    <Upload className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-semibold">Nhập từ file backup</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Khôi phục dữ liệu từ file <code className="text-xs bg-muted px-1 py-0.5 rounded">.zip</code> đã xuất trước đó.
                    </p>
                  </div>
                </div>
              </label>

              {/* Start fresh option */}
              <button
                onClick={handleStartFresh}
                className="flex items-start gap-4 p-4 rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all text-left"
              >
                <div className="mt-0.5 w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold">Bắt đầu mới</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Tạo gia phả mới từ đầu. Bạn có thể thêm thành viên sau.
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step: Importing */}
        {step === 'importing' && (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">Đang nhập dữ liệu...</h2>
              <p className="text-sm text-muted-foreground">Vui lòng chờ trong giây lát.</p>
            </div>
          </div>
        )}

        {/* Step: Done */}
        {step === 'done' && (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <CheckCircle2 className="w-20 h-20 text-emerald-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Sẵn sàng!</h2>
              {importResult ? (
                <p className="text-muted-foreground">
                  Đã nhập <span className="font-semibold text-foreground">{importResult.total_inserted}</span> bản ghi thành công.
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Ứng dụng đã được thiết lập. Bắt đầu thêm thành viên vào gia phả.
                </p>
              )}
            </div>
            <Button size="lg" className="w-full" onClick={handleFinish}>
              Vào ứng dụng <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}
