/**
 * @project AncestorTree
 * @file src/hooks/use-registrations.ts
 * @description React Query hooks for member registrations
 * @version 1.0.0
 * @updated 2026-03-09
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getRegistrations,
  getPendingRegistrationCount,
  submitRegistration,
  approveRegistration,
  rejectRegistration,
  deleteRegistration,
} from '@/lib/supabase-data-registrations';
import type { CreateRegistrationInput } from '@/types';

export const registrationKeys = {
  all: ['registrations'] as const,
  list: (status?: string) => [...registrationKeys.all, 'list', status] as const,
  pending: () => [...registrationKeys.all, 'pending'] as const,
};

export function useRegistrations(status?: string) {
  return useQuery({
    queryKey: registrationKeys.list(status),
    queryFn: () => getRegistrations(status),
  });
}

export function usePendingRegistrationCount() {
  return useQuery({
    queryKey: registrationKeys.pending(),
    queryFn: () => getPendingRegistrationCount(),
    refetchInterval: 120_000, // Poll every 2 minutes
  });
}

export function useSubmitRegistration() {
  return useMutation({
    mutationFn: (input: CreateRegistrationInput) => submitRegistration(input),
  });
}

export function useApproveRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, personId }: { id: string; personId?: string }) =>
      approveRegistration(id, personId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: registrationKeys.all });
    },
  });
}

export function useRejectRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectRegistration(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: registrationKeys.all });
    },
  });
}

export function useDeleteRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRegistration(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: registrationKeys.all });
    },
  });
}
