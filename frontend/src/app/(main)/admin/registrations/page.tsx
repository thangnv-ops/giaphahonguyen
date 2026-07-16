/**
 * @project AncestorTree
 * @file src/app/(main)/admin/registrations/page.tsx
 * @description Admin page to review member registration requests
 * @version 1.0.0
 * @updated 2026-03-09
 */

'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { useRegistrations, useApproveRegistration, useRejectRegistration, useDeleteRegistration } from '@/hooks/use-registrations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { ClipboardList, Check, X, Trash2, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { getRelativeTime } from '@/lib/format-utils';
import Link from 'next/link';
import type { MemberRegistration } from '@/types';

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Chờ duyệt', variant: 'default' },
  approved: { label: 'Đã duyệt', variant: 'secondary' },
  rejected: { label: 'Từ chối', variant: 'destructive' },
};

export default function AdminRegistrationsPage() {
  const { isEditor, isAdmin } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [search, setSearch] = useState('');
  const { data: registrations, isLoading } = useRegistrations(statusFilter);
  const approveMutation = useApproveRegistration();
  const rejectMutation = useRejectRegistration();
  const deleteMutation = useDeleteRegistration();

  const [rejectTarget, setRejectTarget] = useState<MemberRegistration | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<MemberRegistration | null>(null);

  if (!isEditor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card><CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Bạn cần quyền biên tập viên để truy cập trang này</p>
          <Button asChild className="mt-4"><Link href="/">Về trang chủ</Link></Button>
        </CardContent></Card>
      </div>
    );
  }

  const filtered = (registrations || []).filter(r =>
    !search || r.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleApprove = async (reg: MemberRegistration) => {
    try {
      await approveMutation.mutateAsync({ id: reg.id });
      toast.success(`Đã duyệt ${reg.full_name}`);
    } catch {
      toast.error('Lỗi khi duyệt');
    }
  };

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    try {
      await rejectMutation.mutateAsync({ id: rejectTarget.id, reason: rejectReason });
      toast.success(`Đã từ chối ${rejectTarget.full_name}`);
      setRejectTarget(null);
      setRejectReason('');
    } catch {
      toast.error('Lỗi khi từ chối');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success('Đã xóa đơn đăng ký');
      setDeleteTarget(null);
    } catch {
      toast.error('Lỗi khi xóa');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="h-6 w-6" />
          Đơn đăng ký thành viên
        </h1>
        <p className="text-muted-foreground">Xét duyệt đơn ghi danh từ con cháu sống xa</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="pending">Chờ duyệt</SelectItem>
            <SelectItem value="approved">Đã duyệt</SelectItem>
            <SelectItem value="rejected">Từ chối</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {statusFilter === 'pending' ? 'Không có đơn chờ duyệt' : 'Không có kết quả'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(reg => (
            <Card key={reg.id}>
              <CardHeader className="pb-2 pt-3 px-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{reg.full_name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {reg.gender === 1 ? 'Nam' : 'Nữ'}
                      {reg.birth_year && ` · Sinh ${reg.birth_year}`}
                      {reg.birth_place && ` · ${reg.birth_place}`}
                    </p>
                  </div>
                  <Badge variant={STATUS_MAP[reg.status]?.variant ?? 'outline'}>
                    {STATUS_MAP[reg.status]?.label ?? reg.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-3 space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {reg.parent_name && (
                    <div><span className="text-muted-foreground">Cha/mẹ: </span>{reg.parent_name}</div>
                  )}
                  {reg.generation && (
                    <div><span className="text-muted-foreground">Đời: </span>{reg.generation}</div>
                  )}
                  {reg.chi && (
                    <div><span className="text-muted-foreground">Chi: </span>{reg.chi}</div>
                  )}
                  {reg.relationship && (
                    <div><span className="text-muted-foreground">Quan hệ: </span>{reg.relationship}</div>
                  )}
                  {reg.phone && (
                    <div><span className="text-muted-foreground">SĐT: </span>{reg.phone}</div>
                  )}
                  {reg.email && (
                    <div><span className="text-muted-foreground">Email: </span>{reg.email}</div>
                  )}
                </div>
                {reg.notes && (
                  <p className="text-xs text-muted-foreground border-t pt-2">{reg.notes}</p>
                )}
                {reg.reject_reason && (
                  <p className="text-xs text-red-500 border-t pt-2">Lý do từ chối: {reg.reject_reason}</p>
                )}

                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-[10px] text-muted-foreground">
                    {getRelativeTime(reg.created_at)}
                  </span>
                  <div className="flex gap-1.5">
                    {reg.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          className="h-7 text-xs"
                          onClick={() => handleApprove(reg)}
                          disabled={approveMutation.isPending}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Duyệt
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => { setRejectTarget(reg); setRejectReason(''); }}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Từ chối
                        </Button>
                      </>
                    )}
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget(reg)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reject dialog */}
      <AlertDialog open={!!rejectTarget} onOpenChange={open => { if (!open) setRejectTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Từ chối đơn đăng ký</AlertDialogTitle>
            <AlertDialogDescription>
              Từ chối đơn của <strong>{rejectTarget?.full_name}</strong>. Vui lòng ghi lý do.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="Lý do từ chối..."
            rows={3}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={!rejectReason.trim() || rejectMutation.isPending}
            >
              {rejectMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Từ chối
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa đơn đăng ký?</AlertDialogTitle>
            <AlertDialogDescription>
              Xóa vĩnh viễn đơn của <strong>{deleteTarget?.full_name}</strong>. Không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
