/**
 * @project AncestorTree
 * @file src/app/(main)/admin/export/page.tsx
 * @description Admin page for data export (GEDCOM 7.0, CSV, Markdown)
 * @version 1.1.0
 * @updated 2026-03-09
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth/auth-provider';
import { useTreeData } from '@/hooks/use-families';
import { generateGedcom, validateGedcom, downloadGedcom } from '@/lib/gedcom-export';
import { generateCsv, downloadCsv } from '@/lib/csv-export';
import { generateMarkdown, downloadMarkdown } from '@/lib/markdown-export';
import { Download, FileText, Loader2, CheckCircle, AlertCircle, Users, GitBranchPlus, Table, FileCode } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function AdminExportPage() {
  const { isEditor } = useAuth();
  const { data: treeData, isLoading: treeLoading } = useTreeData();
  const [isExporting, setIsExporting] = useState(false);
  const [preview, setPreview] = useState<{
    content: string;
    valid: boolean;
    errors: string[];
    indiCount: number;
    famCount: number;
  } | null>(null);

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

  const handlePreview = () => {
    if (!treeData) return;
    const content = generateGedcom(treeData);
    const validation = validateGedcom(content);
    const indiCount = (content.match(/^0 @I[^@]+@ INDI$/gm) || []).length;
    const famCount = (content.match(/^0 @F[^@]+@ FAM$/gm) || []).length;
    setPreview({ content, valid: validation.valid, errors: validation.errors, indiCount, famCount });
  };

  const handleExport = () => {
    if (!treeData) return;
    setIsExporting(true);
    try {
      const content = preview?.content || generateGedcom(treeData);
      downloadGedcom(content);
      toast.success('Xuất file GEDCOM 7.0 thành công');
    } catch {
      toast.error('Lỗi khi xuất file');
    } finally {
      setIsExporting(false);
    }
  };

  const peopleCount = treeData?.people.filter(p => p.privacy_level !== 2).length || 0;
  const familyCount = treeData?.families.length || 0;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Xuất dữ liệu</h1>
        <p className="text-muted-foreground">Xuất gia phả ra nhiều định dạng để chia sẻ hoặc sao lưu</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            GEDCOM 7.0
          </CardTitle>
          <CardDescription>
            Chuẩn quốc tế cho chia sẻ dữ liệu gia phả. Tương thích FamilySearch, MyHeritage, Gramps.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats */}
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{treeLoading ? '...' : `${peopleCount} thành viên`}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <GitBranchPlus className="h-4 w-4 text-muted-foreground" />
              <span>{treeLoading ? '...' : `${familyCount} gia đình`}</span>
            </div>
          </div>

          {/* Info */}
          <div className="rounded-md border p-3 text-sm space-y-1">
            <p><strong>Bao gồm:</strong> Tên, giới tính, ngày sinh/mất, nơi sinh/mất, nghề nghiệp, tiểu sử, đời, chi</p>
            <p><strong>Không bao gồm:</strong> SĐT, email, Zalo, Facebook, địa chỉ (bảo mật thông tin cá nhân)</p>
            <p><strong>Lọc:</strong> Thành viên có quyền riêng tư &quot;Nội bộ&quot; sẽ không được xuất</p>
            <p><strong>Extension tags:</strong> <code>_GENER</code> (đời), <code>_CHI</code> (chi)</p>
          </div>

          {/* Preview result */}
          {preview && (
            <div className="rounded-md border p-3 space-y-2">
              <div className="flex items-center gap-2">
                {preview.valid ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm font-medium">
                  {preview.valid ? 'File hợp lệ' : `${preview.errors.length} lỗi`}
                </span>
                <Badge variant="outline">{preview.indiCount} INDI</Badge>
                <Badge variant="outline">{preview.famCount} FAM</Badge>
                <Badge variant="outline">{(preview.content.length / 1024).toFixed(1)} KB</Badge>
              </div>
              {!preview.valid && (
                <ul className="text-xs text-red-600 space-y-1">
                  {preview.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePreview} disabled={treeLoading || !treeData}>
              Xem trước
            </Button>
            <Button onClick={handleExport} disabled={isExporting || treeLoading || !treeData}>
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Xuất GEDCOM
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* CSV Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Table className="h-5 w-5" />
            CSV (Excel)
          </CardTitle>
          <CardDescription>
            File bảng tính mở được bằng Excel, Google Sheets. Không chứa thông tin liên lạc.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border p-3 text-sm space-y-1">
            <p><strong>Bao gồm:</strong> Tên, giới tính, ngày sinh/mất, nơi sinh/mất, nghề nghiệp, đời, chi, cha, mẹ</p>
            <p><strong>Không bao gồm:</strong> SĐT, email, Zalo, Facebook, địa chỉ</p>
            <p><strong>Mã hóa:</strong> UTF-8 BOM (tương thích Excel tiếng Việt)</p>
          </div>
          <Button
            onClick={() => {
              if (!treeData) return;
              try {
                const csv = generateCsv(treeData);
                downloadCsv(csv);
                toast.success('Xuất file CSV thành công');
              } catch {
                toast.error('Lỗi khi xuất file CSV');
              }
            }}
            disabled={treeLoading || !treeData}
          >
            <Download className="h-4 w-4 mr-2" />
            Xuất CSV
          </Button>
        </CardContent>
      </Card>

      {/* Markdown Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            Markdown
          </CardTitle>
          <CardDescription>
            Văn bản có cấu trúc, nhóm theo đời. Dễ đọc, in ấn, lưu trữ.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border p-3 text-sm space-y-1">
            <p><strong>Bao gồm:</strong> Tên, giới tính, ngày sinh/mất, vợ/chồng, con, cha mẹ</p>
            <p><strong>Sắp xếp:</strong> Theo đời (generation), tên tiếng Việt</p>
            <p><strong>Định dạng:</strong> Markdown (.md) — mở bằng bất kỳ trình soạn thảo</p>
          </div>
          <Button
            onClick={() => {
              if (!treeData) return;
              try {
                const md = generateMarkdown(treeData);
                downloadMarkdown(md);
                toast.success('Xuất file Markdown thành công');
              } catch {
                toast.error('Lỗi khi xuất file Markdown');
              }
            }}
            disabled={treeLoading || !treeData}
          >
            <Download className="h-4 w-4 mr-2" />
            Xuất Markdown
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
