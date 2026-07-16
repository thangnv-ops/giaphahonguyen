/**
 * @project AncestorTree
 * @file src/app/(main)/admin/cau-duong/page.tsx
 * @description Admin: Quản lý Lịch Cầu đương — tạo pool, phân công, ủy quyền, đổi ngày
 * @version 1.0.0
 * @updated 2026-02-25
 */

'use client';

import { useState } from 'react';
import {
  useCauDuongPools,
  useCreateCauDuongPool,
  useUpdateCauDuongPool,
  useCauDuongAssignments,
  useAutoAssignNextCeremony,
  useCreateCauDuongAssignment,
  useUpdateCauDuongAssignment,
  useEligibleMembers,
  useNextHostInRotation,
} from '@/hooks/use-cau-duong';
import { usePeople } from '@/hooks/use-people';
import { useAuth } from '@/components/auth/auth-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  RotateCcw, Plus, Pencil, Zap, UserCheck, CalendarClock, CheckCircle2, Lock,
  ArrowUp, ArrowDown, ListRestart,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  CAU_DUONG_CEREMONY_LABELS,
  CAU_DUONG_CEREMONY_ORDER,
  type CauDuongPool,
  type CauDuongCeremonyType,
  type CauDuongStatus,
} from '@/types';

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => currentYear - 1 + i);

const STATUS_LABELS: Record<CauDuongStatus, string> = {
  scheduled: 'Đã phân công',
  completed: 'Đã hoàn thành',
  delegated: 'Đã ủy quyền',
  rescheduled: 'Đổi ngày',
  cancelled: 'Đã hủy',
};

// ─── Pool Form ────────────────────────────────────────────────────────────────

function PoolForm({
  pool,
  people,
  onSubmit,
  isPending,
}: {
  pool?: CauDuongPool;
  people: { id: string; display_name: string; generation?: number }[];
  onSubmit: (data: {
    name: string;
    ancestor_id: string;
    min_generation: number;
    max_age_lunar: number;
    require_married: boolean;
    description?: string;
  }) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState(pool?.name || '');
  const [ancestorId, setAncestorId] = useState(pool?.ancestor_id || '');
  const [minGen, setMinGen] = useState(pool?.min_generation?.toString() || '12');
  const [maxAge, setMaxAge] = useState(pool?.max_age_lunar?.toString() || '70');
  const [requireMarried, setRequireMarried] = useState(pool?.require_married ?? true);
  const [description, setDescription] = useState(pool?.description || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !ancestorId) {
      toast.error('Vui lòng điền tên nhóm và chọn tổ tông');
      return;
    }
    onSubmit({
      name: name.trim(),
      ancestor_id: ancestorId,
      min_generation: parseInt(minGen) || 1,
      max_age_lunar: parseInt(maxAge) || 70,
      require_married: requireMarried,
      description: description.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Tên nhóm *</Label>
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nhánh ông Đặng Đình Nhân"
        />
      </div>
      <div>
        <Label>Tổ tông (gốc nhóm) *</Label>
        <Select value={ancestorId} onValueChange={setAncestorId}>
          <SelectTrigger><SelectValue placeholder="Chọn tổ tông" /></SelectTrigger>
          <SelectContent>
            {people.map(p => (
              <SelectItem key={p.id} value={p.id}>
                {p.display_name} {p.generation ? `(Đời ${p.generation})` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Đời tối thiểu</Label>
          <Input
            type="number"
            value={minGen}
            onChange={e => setMinGen(e.target.value)}
            min={1}
          />
        </div>
        <div>
          <Label>Tuổi âm tối đa (dưới)</Label>
          <Input
            type="number"
            value={maxAge}
            onChange={e => setMaxAge(e.target.value)}
            min={1}
            max={120}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="require-married"
          checked={requireMarried}
          onChange={e => setRequireMarried(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
        />
        <Label htmlFor="require-married" className="font-normal cursor-pointer">
          Chỉ nam giới đã lập gia đình (có vợ con trong hệ thống)
        </Label>
      </div>
      <div>
        <Label>Mô tả</Label>
        <Textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={2}
          placeholder="Xoay vòng các nam giới đã lập gia đình, dưới 70 tuổi âm..."
        />
      </div>
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Đang lưu...' : (pool ? 'Cập nhật' : 'Tạo nhóm')}
      </Button>
    </form>
  );
}

// ─── Delegation / Reschedule / Complete dialogs ───────────────────────────────

function DelegateDialog({
  assignmentId,
  eligibleMembers,
  onConfirm,
  isPending,
}: {
  assignmentId: string;
  eligibleMembers: { person: { id: string; display_name: string } }[];
  onConfirm: (actualHostId: string, reason: string) => void;
  isPending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [actualHostId, setActualHostId] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actualHostId) { toast.error('Chọn người thực hiện thay'); return; }
    onConfirm(actualHostId, reason);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserCheck className="h-3.5 w-3.5 mr-1" />
          Ủy quyền
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ủy quyền Cầu đương</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Người thực hiện thay *</Label>
            <Select value={actualHostId} onValueChange={setActualHostId}>
              <SelectTrigger><SelectValue placeholder="Chọn thành viên" /></SelectTrigger>
              <SelectContent>
                {eligibleMembers.map(m => (
                  <SelectItem key={m.person.id} value={m.person.id}>
                    {m.person.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Lý do</Label>
            <Textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={2}
              placeholder="Đi công tác xa..."
            />
          </div>
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? 'Đang lưu...' : 'Xác nhận ủy quyền'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RescheduleDialog({
  assignmentId,
  onConfirm,
  isPending,
}: {
  assignmentId: string;
  onConfirm: (actualDate: string, reason: string) => void;
  isPending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) { toast.error('Chọn ngày thực hiện'); return; }
    onConfirm(date, reason);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarClock className="h-3.5 w-3.5 mr-1" />
          Đổi ngày
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đổi ngày thực hiện</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Ngày thực hiện *</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <Label>Lý do</Label>
            <Textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={2}
              placeholder="Bận việc gia đình..."
            />
          </div>
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? 'Đang lưu...' : 'Xác nhận đổi ngày'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Assign Dialog ────────────────────────────────────────────────────────────

function AssignDialog({
  ceremonyLabel,
  eligibleMembers,
  defaultPersonId,
  onConfirm,
  isPending,
}: {
  ceremonyLabel: string;
  eligibleMembers: { person: { id: string; display_name: string; generation?: number }; ageLunar: number }[];
  defaultPersonId?: string;
  onConfirm: (personId: string) => void;
  isPending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState('');

  // Reset selection when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setSelectedId(defaultPersonId || eligibleMembers[0]?.person.id || '');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) { toast.error('Chọn người thực hiện'); return; }
    onConfirm(selectedId);
    setOpen(false);
  };

  const selectedMember = eligibleMembers.find(m => m.person.id === selectedId);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Zap className="h-3.5 w-3.5 mr-1" />
          Phân công
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Phân công {ceremonyLabel}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Người thực hiện *</Label>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn thành viên" />
              </SelectTrigger>
              <SelectContent>
                {eligibleMembers.map((m, idx) => (
                  <SelectItem key={m.person.id} value={m.person.id}>
                    {idx + 1}. {m.person.display_name}
                    {m.person.generation ? ` (Đời ${m.person.generation})` : ''}
                    {m.ageLunar > 0 ? ` — ${m.ageLunar} tuổi` : ''}
                    {m.person.id === defaultPersonId ? ' ← mặc định' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedMember && selectedMember.person.id === defaultPersonId && (
              <p className="text-xs text-muted-foreground mt-1">
                Người tiếp theo trong vòng xoay
              </p>
            )}
          </div>
          <Button type="submit" disabled={isPending || !selectedId} className="w-full">
            {isPending ? 'Đang lưu...' : `Phân công cho ${selectedMember?.person.display_name ?? '...'}`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Assignment Dialog ──────────────────────────────────────────────────

function EditAssignmentDialog({
  assignment,
  eligibleMembers,
  allPeople,
  onConfirm,
  isPending,
}: {
  assignment: { id: string; host_person_id?: string; host_person?: { display_name: string } | null };
  eligibleMembers: { person: { id: string; display_name: string; generation?: number }; ageLunar: number }[];
  allPeople: { id: string; display_name: string; generation?: number }[];
  onConfirm: (hostPersonId: string) => void;
  isPending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState('');

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setSelectedId(assignment.host_person_id ?? '');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) { toast.error('Chọn người thực hiện'); return; }
    onConfirm(selectedId);
    setOpen(false);
  };

  // Show eligible members first, then all people as fallback
  const selectedName = eligibleMembers.find(m => m.person.id === selectedId)?.person.display_name
    || allPeople.find(p => p.id === selectedId)?.display_name
    || '...';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="h-3.5 w-3.5 mr-1" />
          Sửa
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sửa phân công</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Hiện tại: <span className="font-medium">{assignment.host_person?.display_name ?? '—'}</span></Label>
          </div>
          <div>
            <Label>Đổi sang *</Label>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn thành viên" />
              </SelectTrigger>
              <SelectContent>
                {eligibleMembers.length > 0 && (
                  <>
                    {eligibleMembers.map((m, idx) => (
                      <SelectItem key={m.person.id} value={m.person.id}>
                        {idx + 1}. {m.person.display_name}
                        {m.person.generation ? ` (Đời ${m.person.generation})` : ''}
                        {m.ageLunar > 0 ? ` — ${m.ageLunar} tuổi` : ''}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={isPending || !selectedId || selectedId === (assignment.host_person_id ?? '')} className="w-full">
            {isPending ? 'Đang lưu...' : `Đổi sang ${selectedName}`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminCauDuongPage() {
  const { isEditor, profile } = useAuth();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [poolDialogOpen, setPoolDialogOpen] = useState(false);
  const [editingPool, setEditingPool] = useState<CauDuongPool | undefined>();

  const { data: pools, isLoading: poolsLoading } = useCauDuongPools();
  const { data: people } = usePeople();
  const createPoolMutation = useCreateCauDuongPool();
  const updatePoolMutation = useUpdateCauDuongPool();

  const firstPool = pools?.[0];
  const poolId = firstPool?.id;

  const { data: assignments, isLoading: assignmentsLoading } = useCauDuongAssignments(poolId, selectedYear);
  const { data: eligibleMembers } = useEligibleMembers(poolId, selectedYear);
  const { data: nextHost } = useNextHostInRotation(poolId);
  const autoAssignMutation = useAutoAssignNextCeremony();
  const createAssignmentMutation = useCreateCauDuongAssignment();
  const updateAssignmentMutation = useUpdateCauDuongAssignment();

  if (!isEditor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Lock className="h-10 w-10 mx-auto mb-4 text-muted-foreground opacity-40" />
            <p className="text-muted-foreground">Bạn cần quyền biên tập viên để truy cập trang này</p>
            <Button asChild className="mt-4"><Link href="/">Về trang chủ</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCreatePool = async (data: {
    name: string; ancestor_id: string; min_generation: number; max_age_lunar: number; require_married: boolean; description?: string;
  }) => {
    try {
      await createPoolMutation.mutateAsync({ ...data, is_active: true });
      toast.success('Đã tạo nhóm Cầu đương');
      setPoolDialogOpen(false);
    } catch {
      toast.error('Lỗi khi tạo nhóm');
    }
  };

  const handleUpdatePool = async (data: {
    name: string; ancestor_id: string; min_generation: number; max_age_lunar: number; require_married: boolean; description?: string;
  }) => {
    if (!editingPool) return;
    try {
      await updatePoolMutation.mutateAsync({ id: editingPool.id, input: { ...data, is_active: editingPool.is_active } });
      toast.success('Đã cập nhật nhóm');
      setPoolDialogOpen(false);
      setEditingPool(undefined);
    } catch {
      toast.error('Lỗi khi cập nhật nhóm');
    }
  };

  const handleManualAssign = async (ceremonyType: CauDuongCeremonyType, hostPersonId: string) => {
    if (!poolId) return;
    try {
      // Find rotation index for this person
      const rotationIndex = eligibleMembers?.findIndex(m => m.person.id === hostPersonId) ?? 0;
      await createAssignmentMutation.mutateAsync({
        pool_id: poolId,
        year: selectedYear,
        ceremony_type: ceremonyType,
        host_person_id: hostPersonId,
        status: 'scheduled',
        rotation_index: rotationIndex,
        created_by: profile?.id ?? '',
      });
      const hostName = eligibleMembers?.find(m => m.person.id === hostPersonId)?.person.display_name;
      toast.success(`Đã phân công ${CAU_DUONG_CEREMONY_LABELS[ceremonyType]} cho ${hostName}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi phân công');
    }
  };

  const handleEditAssignment = async (assignmentId: string, hostPersonId: string) => {
    if (!poolId) return;
    try {
      await updateAssignmentMutation.mutateAsync({
        id: assignmentId,
        poolId,
        input: { host_person_id: hostPersonId },
      });
      const hostName = eligibleMembers?.find(m => m.person.id === hostPersonId)?.person.display_name
        || people?.find(p => p.id === hostPersonId)?.display_name;
      toast.success(`Đã đổi phân công cho ${hostName}`);
    } catch {
      toast.error('Lỗi khi sửa phân công');
    }
  };

  const handleDelegate = async (assignmentId: string, actualHostPersonId: string, reason: string) => {
    if (!poolId) return;
    try {
      await updateAssignmentMutation.mutateAsync({
        id: assignmentId,
        poolId,
        input: { actual_host_person_id: actualHostPersonId, reason, status: 'delegated' },
      });
      toast.success('Đã ghi nhận ủy quyền');
    } catch {
      toast.error('Lỗi khi ủy quyền');
    }
  };

  const handleReschedule = async (assignmentId: string, actualDate: string, reason: string) => {
    if (!poolId) return;
    try {
      await updateAssignmentMutation.mutateAsync({
        id: assignmentId,
        poolId,
        input: { actual_date: actualDate, reason, status: 'rescheduled' },
      });
      toast.success('Đã cập nhật ngày thực hiện');
    } catch {
      toast.error('Lỗi khi đổi ngày');
    }
  };

  const handleMarkComplete = async (assignmentId: string) => {
    if (!poolId) return;
    try {
      await updateAssignmentMutation.mutateAsync({
        id: assignmentId,
        poolId,
        input: { status: 'completed', actual_date: new Date().toISOString().split('T')[0] },
      });
      toast.success('Đã ghi nhận hoàn thành');
    } catch {
      toast.error('Lỗi khi cập nhật');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <RotateCcw className="h-6 w-6 text-primary" />
            Quản lý Cầu đương
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Cấu hình nhóm xoay vòng và phân công chủ lễ
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedYear.toString()} onValueChange={v => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEAR_OPTIONS.map(y => (
                <SelectItem key={y} value={y.toString()}>Năm {y}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog
            open={poolDialogOpen}
            onOpenChange={open => { setPoolDialogOpen(open); if (!open) setEditingPool(undefined); }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {firstPool ? 'Sửa nhóm' : 'Tạo nhóm'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingPool ? 'Sửa nhóm Cầu đương' : 'Tạo nhóm Cầu đương'}</DialogTitle>
              </DialogHeader>
              <PoolForm
                key={editingPool?.id || 'new'}
                pool={editingPool}
                people={people || []}
                onSubmit={editingPool ? handleUpdatePool : handleCreatePool}
                isPending={createPoolMutation.isPending || updatePoolMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Pool info */}
      {poolsLoading ? (
        <Card><CardContent className="py-4 animate-pulse"><div className="h-4 bg-muted rounded w-48" /></CardContent></Card>
      ) : !firstPool ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-muted-foreground">
            <RotateCcw className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium mb-1">Chưa có nhóm Cầu đương</p>
            <p className="text-sm">Nhấn &quot;Tạo nhóm&quot; để bắt đầu cấu hình</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-sm">
              <span className="font-medium">{firstPool.name}</span>
              <span className="text-muted-foreground ml-2">
                · Đời {firstPool.min_generation}+ · Dưới {firstPool.max_age_lunar} tuổi âm
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setEditingPool(firstPool); setPoolDialogOpen(true); }}
            >
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Chỉnh sửa
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Assignment management */}
      {firstPool && (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Lịch phân công năm {selectedYear}
              </CardTitle>
              <CardDescription>
                {eligibleMembers?.length ?? '...'} thành viên đủ điều kiện trong vòng xoay
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {assignmentsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="animate-pulse h-16 bg-muted rounded-lg" />
                  ))}
                </div>
              ) : (
                CAU_DUONG_CEREMONY_ORDER.map(ceremonyType => {
                  const assignment = assignments?.find(a => a.ceremony_type === ceremonyType);
                  const canAction = assignment && assignment.status === 'scheduled';

                  return (
                    <div
                      key={ceremonyType}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">
                          {CAU_DUONG_CEREMONY_LABELS[ceremonyType]}
                        </p>
                        {assignment ? (
                          <div className="text-xs text-muted-foreground mt-0.5 space-y-0.5">
                            <p>
                              <span className="font-medium text-foreground">
                                {assignment.host_person?.display_name ?? '—'}
                              </span>
                              {assignment.actual_host_person &&
                                assignment.actual_host_person.id !== assignment.host_person?.id && (
                                  <span className="ml-1">
                                    → <span className="font-medium">{assignment.actual_host_person.display_name}</span>
                                    {' '}(ủy quyền)
                                  </span>
                                )}
                            </p>
                            {assignment.reason && <p className="italic">{assignment.reason}</p>}
                            {assignment.actual_date && (
                              <p>
                                Ngày: {new Date(assignment.actual_date).toLocaleDateString('vi-VN')}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-0.5">Chưa phân công</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {assignment && (
                          <>
                            <Badge
                              variant={
                                assignment.status === 'completed' ? 'default' :
                                assignment.status === 'cancelled' ? 'destructive' : 'secondary'
                              }
                            >
                              {STATUS_LABELS[assignment.status]}
                            </Badge>
                            <EditAssignmentDialog
                              assignment={assignment}
                              eligibleMembers={eligibleMembers || []}
                              allPeople={people || []}
                              onConfirm={(hostPersonId) => handleEditAssignment(assignment.id, hostPersonId)}
                              isPending={updateAssignmentMutation.isPending}
                            />
                          </>
                        )}

                        {!assignment && eligibleMembers && eligibleMembers.length > 0 && (
                          <AssignDialog
                            ceremonyLabel={CAU_DUONG_CEREMONY_LABELS[ceremonyType]}
                            eligibleMembers={eligibleMembers}
                            defaultPersonId={nextHost?.member.person.id}
                            onConfirm={(personId) => handleManualAssign(ceremonyType, personId)}
                            isPending={createAssignmentMutation.isPending}
                          />
                        )}

                        {canAction && (
                          <>
                            <DelegateDialog
                              assignmentId={assignment.id}
                              eligibleMembers={eligibleMembers || []}
                              onConfirm={(actualHostId, reason) =>
                                handleDelegate(assignment.id, actualHostId, reason)
                              }
                              isPending={updateAssignmentMutation.isPending}
                            />
                            <RescheduleDialog
                              assignmentId={assignment.id}
                              onConfirm={(date, reason) =>
                                handleReschedule(assignment.id, date, reason)
                              }
                              isPending={updateAssignmentMutation.isPending}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkComplete(assignment.id)}
                              disabled={updateAssignmentMutation.isPending}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                              Hoàn thành
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Eligible members list with reorder */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Danh sách xoay vòng</CardTitle>
                  <CardDescription>
                    {firstPool.custom_order?.length
                      ? 'Thứ tự tùy chỉnh — dùng mũi tên để điều chỉnh'
                      : 'Thứ tự DFS preorder — đời trên trước, trong mỗi đời theo thứ tự gia đình'}
                  </CardDescription>
                </div>
                {firstPool.custom_order?.length ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      try {
                        await updatePoolMutation.mutateAsync({
                          id: firstPool.id,
                          input: { custom_order: undefined },
                        });
                        toast.success('Đã khôi phục thứ tự mặc định');
                      } catch {
                        toast.error('Lỗi khi khôi phục');
                      }
                    }}
                    disabled={updatePoolMutation.isPending}
                  >
                    <ListRestart className="h-3.5 w-3.5 mr-1" />
                    Mặc định
                  </Button>
                ) : null}
              </div>
            </CardHeader>
            <CardContent>
              {!eligibleMembers || eligibleMembers.length === 0 ? (
                <p className="text-center text-muted-foreground py-6 text-sm">
                  Chưa có thành viên đủ điều kiện
                </p>
              ) : (
                <div className="space-y-1">
                  {eligibleMembers.map((m, idx) => (
                    <div
                      key={m.person.id}
                      className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-muted-foreground w-6 text-right text-xs">
                          {idx + 1}.
                        </span>
                        <div>
                          <p className="font-medium">{m.person.display_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Đời {m.person.generation}
                            {m.person.chi ? ` · Chi ${m.person.chi}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {m.ageLunar > 0 ? `${m.ageLunar} tuổi âm` : ''}
                        </span>
                        <div className="flex gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            disabled={idx === 0 || updatePoolMutation.isPending}
                            onClick={async () => {
                              const ids = eligibleMembers.map(em => em.person.id);
                              [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]];
                              try {
                                await updatePoolMutation.mutateAsync({
                                  id: firstPool.id,
                                  input: { custom_order: ids },
                                });
                              } catch {
                                toast.error('Lỗi khi cập nhật thứ tự');
                              }
                            }}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            disabled={idx === eligibleMembers.length - 1 || updatePoolMutation.isPending}
                            onClick={async () => {
                              const ids = eligibleMembers.map(em => em.person.id);
                              [ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]];
                              try {
                                await updatePoolMutation.mutateAsync({
                                  id: firstPool.id,
                                  input: { custom_order: ids },
                                });
                              } catch {
                                toast.error('Lỗi khi cập nhật thứ tự');
                              }
                            }}
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
