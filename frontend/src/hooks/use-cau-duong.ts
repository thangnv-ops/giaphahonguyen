/**
 * @project AncestorTree
 * @file src/hooks/use-cau-duong.ts
 * @description React Query hooks cho tính năng Lịch Cầu đương
 * @version 1.0.0
 * @updated 2026-02-25
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCauDuongPools,
  getCauDuongPool,
  createCauDuongPool,
  updateCauDuongPool,
  getCauDuongAssignments,
  getCauDuongAssignmentsWithPeople,
  createCauDuongAssignment,
  updateCauDuongAssignment,
  getEligibleMembersInDFSOrder,
  getNextHostInRotation,
  autoAssignNextCeremony,
  delegateCauDuong,
  rescheduleCauDuong,
  completeCauDuong,
} from '@/lib/supabase-data-cau-duong';
import type {
  CauDuongPool,
  CauDuongAssignment,
  CauDuongCeremonyType,
} from '@/types';

// ─── Query keys ───────────────────────────────────────────────────────────────

export const cauDuongKeys = {
  all: ['cau_duong'] as const,
  pools: () => [...cauDuongKeys.all, 'pools'] as const,
  pool: (id: string) => [...cauDuongKeys.pools(), id] as const,
  assignments: (poolId: string, year?: number) =>
    [...cauDuongKeys.all, 'assignments', poolId, year] as const,
  eligible: (poolId: string, year: number) =>
    [...cauDuongKeys.all, 'eligible', poolId, year] as const,
  nextHost: (poolId: string) =>
    [...cauDuongKeys.all, 'next_host', poolId] as const,
};

// ─── Pools ────────────────────────────────────────────────────────────────────

export function useCauDuongPools() {
  return useQuery({
    queryKey: cauDuongKeys.pools(),
    queryFn: getCauDuongPools,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCauDuongPool(id: string | undefined) {
  return useQuery({
    queryKey: cauDuongKeys.pool(id!),
    queryFn: () => getCauDuongPool(id!),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateCauDuongPool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<CauDuongPool, 'id' | 'created_at' | 'updated_at'>) =>
      createCauDuongPool(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cauDuongKeys.pools() });
    },
  });
}

export function useUpdateCauDuongPool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<Omit<CauDuongPool, 'id' | 'created_at' | 'updated_at'>> }) =>
      updateCauDuongPool(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: cauDuongKeys.pool(id) });
      queryClient.invalidateQueries({ queryKey: cauDuongKeys.pools() });
      queryClient.invalidateQueries({ queryKey: cauDuongKeys.all }); // refresh eligible list when order changes
    },
  });
}

// ─── Assignments ──────────────────────────────────────────────────────────────

export function useCauDuongAssignments(poolId: string | undefined, year?: number) {
  return useQuery({
    queryKey: cauDuongKeys.assignments(poolId!, year),
    queryFn: () => getCauDuongAssignmentsWithPeople(poolId!, year),
    enabled: !!poolId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCauDuongAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<CauDuongAssignment, 'id' | 'created_at' | 'updated_at'>) =>
      createCauDuongAssignment(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: cauDuongKeys.assignments(data.pool_id) });
      queryClient.invalidateQueries({ queryKey: cauDuongKeys.nextHost(data.pool_id) });
    },
  });
}

export function useUpdateCauDuongAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
      poolId,
    }: {
      id: string;
      input: Partial<Omit<CauDuongAssignment, 'id' | 'created_at' | 'updated_at'>>;
      poolId: string;
    }) => updateCauDuongAssignment(id, input),
    onSuccess: (_, { poolId }) => {
      queryClient.invalidateQueries({ queryKey: cauDuongKeys.assignments(poolId) });
    },
  });
}

export function useAutoAssignNextCeremony() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      poolId,
      year,
      ceremonyType,
      createdBy,
      notes,
    }: {
      poolId: string;
      year: number;
      ceremonyType: CauDuongCeremonyType;
      createdBy: string;
      notes?: string;
    }) => autoAssignNextCeremony(poolId, year, ceremonyType, createdBy, notes),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: cauDuongKeys.assignments(data.pool_id) });
      queryClient.invalidateQueries({ queryKey: cauDuongKeys.nextHost(data.pool_id) });
    },
  });
}

export function useDelegateCauDuong() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      assignmentId,
      actualHostPersonId,
      reason,
      poolId,
    }: {
      assignmentId: string;
      actualHostPersonId: string;
      reason: string;
      poolId: string;
    }) => delegateCauDuong(assignmentId, actualHostPersonId, reason),
    onSuccess: (_, { poolId }) => {
      queryClient.invalidateQueries({ queryKey: cauDuongKeys.assignments(poolId) });
    },
  });
}

export function useRescheduleCauDuong() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      assignmentId,
      actualDate,
      reason,
      poolId,
    }: {
      assignmentId: string;
      actualDate: string;
      reason: string;
      poolId: string;
    }) => rescheduleCauDuong(assignmentId, actualDate, reason),
    onSuccess: (_, { poolId }) => {
      queryClient.invalidateQueries({ queryKey: cauDuongKeys.assignments(poolId) });
    },
  });
}

export function useCompleteCauDuong() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      assignmentId,
      actualDate,
      notes,
      poolId,
    }: {
      assignmentId: string;
      actualDate?: string;
      notes?: string;
      poolId: string;
    }) => completeCauDuong(assignmentId, actualDate, notes),
    onSuccess: (_, { poolId }) => {
      queryClient.invalidateQueries({ queryKey: cauDuongKeys.assignments(poolId) });
    },
  });
}

// ─── Eligible list + rotation ─────────────────────────────────────────────────

export function useEligibleMembers(poolId: string | undefined, year: number) {
  return useQuery({
    queryKey: cauDuongKeys.eligible(poolId!, year),
    queryFn: () => getEligibleMembersInDFSOrder(poolId!, year),
    enabled: !!poolId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useNextHostInRotation(poolId: string | undefined) {
  const currentYear = new Date().getFullYear();
  return useQuery({
    queryKey: cauDuongKeys.nextHost(poolId!),
    queryFn: () => getNextHostInRotation(poolId!, currentYear),
    enabled: !!poolId,
    staleTime: 5 * 60 * 1000,
  });
}
