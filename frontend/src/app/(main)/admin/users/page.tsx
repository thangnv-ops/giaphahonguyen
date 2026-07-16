/**
 * @project AncestorTree
 * @file src/app/(main)/admin/users/page.tsx
 * @description User management page — role + tree mapping + bulk actions (FR-507~509)
 * @version 4.0.0
 * @updated 2026-03-02
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  useProfiles,
  useUpdateUserRole,
  useUpdateLinkedPerson,
  useUpdateEditRootPerson,
  useSuspendUser,
  useUnsuspendUser,
  useDeleteUser,
  useVerifyUser,
} from '@/hooks/use-profiles';
import { useSearchPeople, usePerson } from '@/hooks/use-people';
import { useAuth } from '@/components/auth/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Users,
  ArrowLeft,
  Shield,
  ShieldCheck,
  UserCog,
  Loader2,
  CheckCircle,
  Link2,
  Search,
  X,
  GitBranch,
  Clock,
  Ban,
  Trash2,
  CheckSquare,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import type { UserRole } from '@/types';
import type { Person, Profile } from '@/types';

// ─── Role config ──────────────────────────────────────────────────────────────

const roleLabels: Record<UserRole, { label: string; color: string; description: string }> = {
  admin: {
    label: 'Quản trị viên',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    description: 'Toàn quyền quản trị hệ thống',
  },
  editor: {
    label: 'Biên tập viên',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    description: 'Thêm, sửa, xóa dữ liệu thành viên',
  },
  viewer: {
    label: 'Người xem',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    description: 'Chỉ xem thông tin, không chỉnh sửa',
  },
};

// ─── PersonCombobox ───────────────────────────────────────────────────────────

interface PersonComboboxProps {
  label: string;
  hint?: string;
  selected: Person | null;
  onSelect: (person: Person | null) => void;
  excludeId?: string;
}

function PersonCombobox({ label, hint, selected, onSelect, excludeId }: PersonComboboxProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const { data: results, isFetching } = useSearchPeople(query);

  const filtered = (results || []).filter((p) => p.id !== excludeId);

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {selected ? (
        <div className="flex items-center gap-2 p-2 rounded-md border bg-muted/50">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
              selected.gender === 1 ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
            }`}
          >
            {selected.display_name.slice(-1)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selected.display_name}</p>
            <p className="text-xs text-muted-foreground">Đời {selected.generation}</p>
          </div>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={() => onSelect(null)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Tìm ${label.toLowerCase()}...`}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(e.target.value.length > 0);
            }}
            onFocus={() => query.length > 0 && setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            className="pl-9"
          />
          {open && (
            <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-52 overflow-y-auto">
              {isFetching ? (
                <p className="p-3 text-sm text-muted-foreground">Đang tìm...</p>
              ) : filtered.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">Không tìm thấy</p>
              ) : (
                filtered.map((person) => (
                  <button
                    key={person.id}
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent transition-colors"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onSelect(person);
                      setQuery('');
                      setOpen(false);
                    }}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                        person.gender === 1 ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                      }`}
                    >
                      {person.display_name.slice(-1)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{person.display_name}</p>
                      <p className="text-xs text-muted-foreground">Đời {person.generation}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── PersonName — small inline loader for showing a person's name by ID ──────

function PersonName({ personId }: { personId?: string }) {
  const { data: person, isLoading } = usePerson(personId);
  if (!personId) return <span className="text-muted-foreground text-xs">—</span>;
  if (isLoading) return <span className="text-xs text-muted-foreground">...</span>;
  if (!person) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span className="text-xs font-medium truncate max-w-[120px] block">{person.display_name}</span>
  );
}

// ─── TreeMappingDialog ────────────────────────────────────────────────────────

interface TreeMappingDialogProps {
  user: Profile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function TreeMappingDialog({ user, open, onOpenChange }: TreeMappingDialogProps) {
  const { data: initialLinked } = usePerson(user.linked_person);
  const { data: initialEditRoot } = usePerson(user.edit_root_person_id);

  const [linkedPerson, setLinkedPerson] = useState<Person | null>(null);
  const [editRootPerson, setEditRootPerson] = useState<Person | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Initialise selections from current profile values when dialog opens (ISS-09)
  // Wait for BOTH queries to resolve before initializing
  const linkedReady = initialLinked !== undefined || !user.linked_person;
  const editRootReady = initialEditRoot !== undefined || !user.edit_root_person_id;
  if (open && !initialized && linkedReady && editRootReady) {
    setLinkedPerson(initialLinked ?? null);
    setEditRootPerson(initialEditRoot ?? null);
    setInitialized(true);
  }

  const handleClose = () => {
    setInitialized(false);
    onOpenChange(false);
  };

  const updateLinked = useUpdateLinkedPerson();
  const updateEditRoot = useUpdateEditRootPerson();

  const handleSave = async () => {
    try {
      await Promise.all([
        updateLinked.mutateAsync({ userId: user.user_id, personId: linkedPerson?.id ?? null }),
        updateEditRoot.mutateAsync({ userId: user.user_id, personId: editRootPerson?.id ?? null }),
      ]);
      toast.success(`Đã lưu cài đặt cây cho ${user.full_name || user.email}`);
      handleClose();
    } catch (err) {
      toast.error('Lỗi khi lưu cài đặt');
      console.error(err);
    }
  };

  const isSaving = updateLinked.isPending || updateEditRoot.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Gắn vào cây gia phả
          </DialogTitle>
          <DialogDescription>
            <strong>{user.full_name || user.email}</strong>
            {' '}— Liên kết tài khoản với thành viên trong cây.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <PersonCombobox
            label="Thành viên tương ứng"
            hint="Người này là ai trong cây gia phả? Họ có thể tự sửa hồ sơ của mình."
            selected={linkedPerson}
            onSelect={setLinkedPerson}
          />

          {user.role === 'editor' && (
            <PersonCombobox
              label="Phạm vi sửa (tùy chọn)"
              hint="Chỉ sửa được người này và toàn bộ con cháu. Để trống = sửa toàn bộ cây."
              selected={editRootPerson}
              onSelect={setEditRootPerson}
            />
          )}

          {user.role !== 'editor' && (
            <p className="text-xs text-muted-foreground bg-muted rounded-md p-3">
              Phạm vi sửa chỉ áp dụng cho vai trò <strong>Biên tập viên</strong>.
              Hiện tại người dùng này là <strong>{roleLabels[user.role].label}</strong>.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Lưu cài đặt
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const { profile: currentProfile } = useAuth();
  const { data: profiles, isLoading, error } = useProfiles();
  const updateRole = useUpdateUserRole();
  const suspendMutation = useSuspendUser();
  const unsuspendMutation = useUnsuspendUser();
  const deleteMutation = useDeleteUser();
  const verifyMutation = useVerifyUser();

  const [showUnverifiedOnly, setShowUnverifiedOnly] = useState(false);
  const [suspendDialog, setSuspendDialog] = useState<{ open: boolean; user: Profile } | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: Profile } | null>(null);

  // Bulk selection state
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkSuspendDialog, setBulkSuspendDialog] = useState(false);
  const [bulkSuspendReason, setBulkSuspendReason] = useState('');
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const unverifiedCount = useMemo(
    () => (profiles ?? []).filter((p) => !p.is_verified).length,
    [profiles],
  );

  const displayedProfiles = useMemo(
    () => showUnverifiedOnly ? (profiles ?? []).filter((p) => !p.is_verified) : (profiles ?? []),
    [profiles, showUnverifiedOnly],
  );

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    userId: string;
    currentRole: UserRole;
    newRole: UserRole;
    userName: string;
  } | null>(null);

  const [mappingUser, setMappingUser] = useState<Profile | null>(null);

  const handleRoleChange = (userId: string, newRole: UserRole, currentRole: UserRole, userName: string) => {
    if (newRole === currentRole) return;
    setConfirmDialog({ open: true, userId, currentRole, newRole, userName });
  };

  const confirmRoleChange = async () => {
    if (!confirmDialog) return;
    try {
      await updateRole.mutateAsync({ userId: confirmDialog.userId, role: confirmDialog.newRole });
      toast.success(`Đã cập nhật quyền cho ${confirmDialog.userName}`);
    } catch (err) {
      toast.error('Lỗi khi cập nhật quyền');
      console.error(err);
    } finally {
      setConfirmDialog(null);
    }
  };

  const confirmSuspend = async () => {
    if (!suspendDialog) return;
    try {
      await suspendMutation.mutateAsync({
        userId: suspendDialog.user.user_id,
        reason: suspendReason.trim() || undefined,
      });
      toast.success(`Đã khoá tài khoản ${suspendDialog.user.full_name || suspendDialog.user.email}`);
    } catch (err) {
      toast.error('Lỗi khi khoá tài khoản');
      console.error(err);
    } finally {
      setSuspendDialog(null);
      setSuspendReason('');
    }
  };

  const confirmUnsuspend = async (user: Profile) => {
    try {
      await unsuspendMutation.mutateAsync(user.user_id);
      toast.success(`Đã mở khoá tài khoản ${user.full_name || user.email}`);
    } catch (err) {
      toast.error('Lỗi khi mở khoá tài khoản');
      console.error(err);
    }
  };

  const confirmDelete = async () => {
    if (!deleteDialog) return;
    try {
      await deleteMutation.mutateAsync(deleteDialog.user.user_id);
      toast.success(`Đã xoá tài khoản ${deleteDialog.user.full_name || deleteDialog.user.email}`);
    } catch (err) {
      toast.error('Lỗi khi xoá tài khoản');
      console.error(err);
    } finally {
      setDeleteDialog(null);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const isSelf = (user: Profile) => user.user_id === currentProfile?.user_id;

  // Selectable users = displayed profiles minus self
  const selectableUsers = useMemo(
    () => displayedProfiles.filter((u) => !isSelf(u)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [displayedProfiles, currentProfile],
  );

  const allSelected = selectableUsers.length > 0 && selectableUsers.every((u) => selectedUsers.has(u.user_id));
  const someSelected = selectableUsers.some((u) => selectedUsers.has(u.user_id));

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(selectableUsers.map((u) => u.user_id)));
    }
  }, [allSelected, selectableUsers]);

  const toggleSelectUser = useCallback((userId: string) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }, []);

  // Get selected profile objects for display
  const selectedProfiles = useMemo(
    () => (profiles ?? []).filter((p) => selectedUsers.has(p.user_id)),
    [profiles, selectedUsers],
  );
  const selectedUnverifiedCount = selectedProfiles.filter((p) => !p.is_verified).length;
  const selectedActiveCount = selectedProfiles.filter((p) => !p.is_suspended).length;

  // Bulk action handlers
  const handleBulkVerify = async () => {
    setBulkProcessing(true);
    const targets = selectedProfiles.filter((p) => !p.is_verified);
    const results = await Promise.allSettled(
      targets.map((p) => verifyMutation.mutateAsync({ userId: p.user_id, verified: true })),
    );
    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;
    if (succeeded > 0) toast.success(`Đã duyệt ${succeeded} tài khoản`);
    if (failed > 0) toast.error(`Lỗi khi duyệt ${failed} tài khoản`);
    setSelectedUsers(new Set());
    setBulkProcessing(false);
  };

  const handleBulkSuspend = async () => {
    setBulkProcessing(true);
    const targets = selectedProfiles.filter((p) => !p.is_suspended);
    const results = await Promise.allSettled(
      targets.map((p) =>
        suspendMutation.mutateAsync({ userId: p.user_id, reason: bulkSuspendReason.trim() || undefined }),
      ),
    );
    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;
    if (succeeded > 0) toast.success(`Đã khoá ${succeeded} tài khoản`);
    if (failed > 0) toast.error(`Lỗi khi khoá ${failed} tài khoản`);
    setSelectedUsers(new Set());
    setBulkSuspendDialog(false);
    setBulkSuspendReason('');
    setBulkProcessing(false);
  };

  const handleBulkDelete = async () => {
    setBulkProcessing(true);
    const results = await Promise.allSettled(
      selectedProfiles.map((p) => deleteMutation.mutateAsync(p.user_id)),
    );
    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;
    if (succeeded > 0) toast.success(`Đã xoá ${succeeded} tài khoản`);
    if (failed > 0) toast.error(`Lỗi khi xoá ${failed} tài khoản`);
    setSelectedUsers(new Set());
    setBulkDeleteDialog(false);
    setBulkProcessing(false);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quản trị
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <UserCog className="h-6 w-6" />
              Quản lý người dùng
            </h1>
            <p className="text-muted-foreground">Phân quyền, gắn tài khoản vào cây gia phả</p>
          </div>
        </div>
      </div>

      {/* Role Legend */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Cấp độ phân quyền
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(Object.entries(roleLabels) as [UserRole, typeof roleLabels[UserRole]][]).map(([role, info]) => (
              <div key={role} className="flex items-start gap-3 p-3 rounded-lg border">
                <Badge className={info.color}>{info.label}</Badge>
                <span className="text-sm text-muted-foreground">{info.description}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Danh sách người dùng
          </CardTitle>
          <CardDescription>
            {isLoading ? 'Đang tải...' : `${profiles?.length || 0} người dùng đã đăng ký`}
            {unverifiedCount > 0 && !isLoading && (
              <span className="ml-2 text-amber-600">({unverifiedCount} chờ xác nhận)</span>
            )}
          </CardDescription>
          {unverifiedCount > 0 && (
            <Button
              variant={showUnverifiedOnly ? 'default' : 'outline'}
              size="sm"
              className="w-fit"
              onClick={() => setShowUnverifiedOnly(!showUnverifiedOnly)}
            >
              <Clock className="h-3.5 w-3.5 mr-1.5" />
              {showUnverifiedOnly ? 'Hiện tất cả' : `Chờ xác nhận (${unverifiedCount})`}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-9 w-32" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="py-8 text-center text-destructive">
              <p>Lỗi khi tải danh sách: {error.message}</p>
              <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                Thử lại
              </Button>
            </div>
          ) : displayedProfiles.length > 0 ? (
            <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Chọn tất cả"
                    />
                  </TableHead>
                  <TableHead>Người dùng</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="hidden lg:table-cell">Cây gia phả</TableHead>
                  <TableHead className="hidden md:table-cell">Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedProfiles.map((user) => (
                  <TableRow key={user.id} className={selectedUsers.has(user.user_id) ? 'bg-accent/50' : ''}>
                    <TableCell>
                      {isSelf(user) ? (
                        <div className="w-4" />
                      ) : (
                        <Checkbox
                          checked={selectedUsers.has(user.user_id)}
                          onCheckedChange={() => toggleSelectUser(user.user_id)}
                          aria-label={`Chọn ${user.full_name || user.email}`}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback>
                            {(user.full_name || user.email).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium flex items-center gap-1.5">
                            {user.full_name || 'Chưa cập nhật'}
                            {user.is_suspended && (
                              <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4">
                                Đã khoá
                              </Badge>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground sm:hidden">{user.email}</p>
                          {user.is_suspended && user.suspension_reason && (
                            <p className="text-xs text-destructive mt-0.5 truncate max-w-[180px]">
                              {user.suspension_reason}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{user.email}</TableCell>
                    <TableCell>
                      {isSelf(user) ? (
                        <Badge className={roleLabels[user.role].color}>
                          {roleLabels[user.role].label}
                        </Badge>
                      ) : (
                        <Select
                          value={user.role}
                          onValueChange={(value) =>
                            handleRoleChange(
                              user.user_id,
                              value as UserRole,
                              user.role,
                              user.full_name || user.email,
                            )
                          }
                        >
                          <SelectTrigger className="w-[140px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">
                              <span className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-red-500" />
                                Quản trị viên
                              </span>
                            </SelectItem>
                            <SelectItem value="editor">
                              <span className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-blue-500" />
                                Biên tập viên
                              </span>
                            </SelectItem>
                            <SelectItem value="viewer">
                              <span className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-gray-500" />
                                Người xem
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.is_verified ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Đã xác nhận
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600 border-amber-300">
                          <Clock className="h-3 w-3 mr-1" />
                          Chờ duyệt
                        </Badge>
                      )}
                    </TableCell>
                    {/* Tree mapping column */}
                    <TableCell className="hidden lg:table-cell">
                      <div className="space-y-0.5">
                        {user.linked_person ? (
                          <div className="flex items-center gap-1 text-xs">
                            <Link2 className="h-3 w-3 text-green-600 shrink-0" />
                            <PersonName personId={user.linked_person} />
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Chưa gắn</span>
                        )}
                        {user.edit_root_person_id && (
                          <div className="flex items-center gap-1 text-xs text-blue-600">
                            <GitBranch className="h-3 w-3 shrink-0" />
                            <PersonName personId={user.edit_root_person_id} />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{formatDate(user.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Verify button — only for unverified users */}
                        {!isSelf(user) && !user.is_verified && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2.5 text-green-600 border-green-200 hover:bg-green-50"
                            onClick={async () => {
                              try {
                                await verifyMutation.mutateAsync({ userId: user.user_id, verified: true });
                                toast.success(`Đã duyệt tài khoản ${user.full_name || user.email}`);
                              } catch {
                                toast.error('Lỗi khi duyệt tài khoản');
                              }
                            }}
                            disabled={verifyMutation.isPending}
                            title="Duyệt tài khoản"
                          >
                            {verifyMutation.isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <>
                                <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                                Duyệt
                              </>
                            )}
                          </Button>
                        )}

                        {/* Tree mapping button */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setMappingUser(user)}
                          title="Gắn vào cây gia phả"
                          disabled={isSelf(user)}
                        >
                          <Link2 className="h-3.5 w-3.5" />
                        </Button>

                        {/* Suspend / unsuspend button */}
                        {!isSelf(user) && (
                          user.is_suspended ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 text-green-600 border-green-200 hover:bg-green-50"
                              onClick={() => confirmUnsuspend(user)}
                              disabled={unsuspendMutation.isPending}
                              title="Mở khoá tài khoản"
                            >
                              {unsuspendMutation.isPending ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <ShieldCheck className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 text-amber-600 border-amber-200 hover:bg-amber-50"
                              onClick={() => { setSuspendReason(''); setSuspendDialog({ open: true, user }); }}
                              title="Khoá tài khoản"
                            >
                              <Ban className="h-3.5 w-3.5" />
                            </Button>
                          )
                        )}

                        {/* Delete button */}
                        {!isSelf(user) && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive border-destructive/30 hover:bg-destructive/10"
                            onClick={() => setDeleteDialog({ open: true, user })}
                            title="Xoá tài khoản"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}

                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Bulk action bar */}
            {selectedUsers.size > 0 && (
              <div className="sticky bottom-4 mt-4 mx-auto w-fit flex items-center gap-3 rounded-lg border bg-background px-4 py-3 shadow-lg">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CheckSquare className="h-4 w-4 text-primary" />
                  Đã chọn {selectedUsers.size} người dùng
                </div>
                <div className="h-5 w-px bg-border" />
                {selectedUnverifiedCount > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-green-600 border-green-200 hover:bg-green-50"
                    onClick={handleBulkVerify}
                    disabled={bulkProcessing}
                  >
                    {bulkProcessing ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Duyệt ({selectedUnverifiedCount})
                  </Button>
                )}
                {selectedActiveCount > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-amber-600 border-amber-200 hover:bg-amber-50"
                    onClick={() => { setBulkSuspendReason(''); setBulkSuspendDialog(true); }}
                    disabled={bulkProcessing}
                  >
                    <Ban className="h-3.5 w-3.5 mr-1.5" />
                    Khoá ({selectedActiveCount})
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => setBulkDeleteDialog(true)}
                  disabled={bulkProcessing}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Xoá ({selectedUsers.size})
                </Button>
                <div className="h-5 w-px bg-border" />
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8"
                  onClick={() => setSelectedUsers(new Set())}
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Bỏ chọn
                </Button>
              </div>
            )}
            </>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Chưa có người dùng nào đăng ký</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm role change dialog */}
      <AlertDialog open={confirmDialog?.open} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận thay đổi quyền</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn thay đổi quyền của <strong>{confirmDialog?.userName}</strong> từ{' '}
              <Badge className={roleLabels[confirmDialog?.currentRole || 'viewer'].color}>
                {roleLabels[confirmDialog?.currentRole || 'viewer'].label}
              </Badge>{' '}
              sang{' '}
              <Badge className={roleLabels[confirmDialog?.newRole || 'viewer'].color}>
                {roleLabels[confirmDialog?.newRole || 'viewer'].label}
              </Badge>
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleChange} disabled={updateRole.isPending}>
              {updateRole.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Xác nhận
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Suspend dialog */}
      <AlertDialog
        open={suspendDialog?.open}
        onOpenChange={(open) => { if (!open) { setSuspendDialog(null); setSuspendReason(''); } }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-amber-600" />
              Khoá tài khoản
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tài khoản <strong>{suspendDialog?.user.full_name || suspendDialog?.user.email}</strong> sẽ bị khoá.
              Người dùng sẽ bị đăng xuất và không thể đăng nhập cho đến khi được mở khoá.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-1 py-2">
            <Label htmlFor="suspend-reason" className="text-sm font-medium">
              Lý do khoá (tùy chọn)
            </Label>
            <Textarea
              id="suspend-reason"
              className="mt-1.5"
              placeholder="Nhập lý do khoá tài khoản..."
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              rows={2}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSuspend}
              disabled={suspendMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {suspendMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Ban className="h-4 w-4 mr-2" />
                  Khoá tài khoản
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete dialog */}
      <AlertDialog
        open={deleteDialog?.open}
        onOpenChange={(open) => { if (!open) setDeleteDialog(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Xoá tài khoản vĩnh viễn
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tài khoản <strong>{deleteDialog?.user.full_name || deleteDialog?.user.email}</strong> sẽ bị xoá hoàn toàn.
              Hành động này <strong>không thể hoàn tác</strong> — mọi dữ liệu liên kết cũng sẽ bị xoá.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xoá...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xoá tài khoản
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk suspend dialog */}
      <AlertDialog
        open={bulkSuspendDialog}
        onOpenChange={(open) => { if (!open) { setBulkSuspendDialog(false); setBulkSuspendReason(''); } }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-amber-600" />
              Khoá hàng loạt — {selectedActiveCount} tài khoản
            </AlertDialogTitle>
            <AlertDialogDescription>
              Các tài khoản sau sẽ bị khoá và không thể đăng nhập:
              <span className="block mt-2 text-sm font-medium text-foreground max-h-24 overflow-y-auto">
                {selectedProfiles.filter((p) => !p.is_suspended).map((p) => p.full_name || p.email).join(', ')}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-1 py-2">
            <Label htmlFor="bulk-suspend-reason" className="text-sm font-medium">
              Lý do khoá (tùy chọn)
            </Label>
            <Textarea
              id="bulk-suspend-reason"
              className="mt-1.5"
              placeholder="Nhập lý do khoá tài khoản..."
              value={bulkSuspendReason}
              onChange={(e) => setBulkSuspendReason(e.target.value)}
              rows={2}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkProcessing}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkSuspend}
              disabled={bulkProcessing}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {bulkProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Ban className="h-4 w-4 mr-2" />
                  Khoá {selectedActiveCount} tài khoản
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete dialog */}
      <AlertDialog
        open={bulkDeleteDialog}
        onOpenChange={(open) => { if (!open) setBulkDeleteDialog(false); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Xoá hàng loạt — {selectedUsers.size} tài khoản
            </AlertDialogTitle>
            <AlertDialogDescription>
              Các tài khoản sau sẽ bị <strong>xoá vĩnh viễn</strong>. Hành động này không thể hoàn tác.
              <span className="block mt-2 text-sm font-medium text-foreground max-h-24 overflow-y-auto">
                {selectedProfiles.map((p) => p.full_name || p.email).join(', ')}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkProcessing}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={bulkProcessing}
              className="bg-destructive hover:bg-destructive/90"
            >
              {bulkProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xoá...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xoá {selectedUsers.size} tài khoản
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Tree mapping dialog */}
      {mappingUser && (
        <TreeMappingDialog
          user={mappingUser}
          open={!!mappingUser}
          onOpenChange={(open) => { if (!open) setMappingUser(null); }}
        />
      )}
    </div>
  );
}
