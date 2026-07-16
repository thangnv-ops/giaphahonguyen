/**
 * @project AncestorTree
 * @file src/lib/supabase-data-registrations.ts
 * @description Data layer for member registration requests
 * @version 1.0.0
 * @updated 2026-03-09
 */

import { supabase } from './supabase';
import type { MemberRegistration, CreateRegistrationInput } from '@/types';

const ALLOWED_CREATE_FIELDS = [
  'full_name', 'gender', 'birth_year', 'birth_place',
  'phone', 'email', 'parent_name', 'generation', 'chi',
  'relationship', 'notes', 'honeypot',
] as const;

/**
 * Submit a public member registration (no auth required).
 * Returns the created registration or throws on error.
 */
export async function submitRegistration(input: CreateRegistrationInput): Promise<MemberRegistration> {
  // Anti-spam: honeypot must be empty
  if (input.honeypot) {
    // Silently "succeed" to not reveal the honeypot to bots
    return { id: 'blocked', status: 'pending', full_name: '', gender: 1, created_at: '' } as MemberRegistration;
  }

  // Mass-assignment protection (OWASP A04)
  const sanitized: Record<string, unknown> = {};
  for (const key of ALLOWED_CREATE_FIELDS) {
    if (key === 'honeypot') continue; // never persist honeypot
    if (input[key] !== undefined && input[key] !== null && input[key] !== '') {
      sanitized[key] = input[key];
    }
  }

  if (!sanitized.full_name || typeof sanitized.full_name !== 'string' || (sanitized.full_name as string).trim().length < 2) {
    throw new Error('Họ tên không hợp lệ');
  }

  sanitized.full_name = (sanitized.full_name as string).trim();

  const { data, error } = await supabase
    .from('member_registrations')
    .insert(sanitized)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Get all registrations (admin/editor only). */
export async function getRegistrations(status?: string): Promise<MemberRegistration[]> {
  let query = supabase
    .from('member_registrations')
    .select('*')
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/** Get pending registration count (for admin badge). */
export async function getPendingRegistrationCount(): Promise<number> {
  const { count, error } = await supabase
    .from('member_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  if (error) throw error;
  return count || 0;
}

/** Approve a registration. */
export async function approveRegistration(id: string, personId?: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('member_registrations')
    .update({
      status: 'approved',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      ...(personId ? { person_id: personId } : {}),
    })
    .eq('id', id);

  if (error) throw error;
}

/** Reject a registration with reason. */
export async function rejectRegistration(id: string, reason: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('member_registrations')
    .update({
      status: 'rejected',
      reject_reason: reason.trim(),
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;
}

/** Delete a registration (admin only). */
export async function deleteRegistration(id: string): Promise<void> {
  const { error } = await supabase
    .from('member_registrations')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
