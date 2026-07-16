/**
 * @project AncestorTree
 * @file src/hooks/use-backup-schedule.ts
 * @description Hook for managing backup schedule settings stored in localStorage.
 *              Computes whether a scheduled backup is due and provides helpers
 *              to read/write schedule configuration.
 * @version 1.0.0
 * @updated 2026-02-28
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

export type BackupInterval = 'off' | 'daily' | 'weekly' | 'monthly';

export interface BackupSchedule {
  interval: BackupInterval;
  /** ISO string of last successful backup, or null if never */
  lastBackupAt: string | null;
  /** Auto-download when backup is due (on page load) */
  autoDownload: boolean;
}

const STORAGE_KEY = 'ancestortree_backup_schedule';

const DEFAULT_SCHEDULE: BackupSchedule = {
  interval: 'off',
  lastBackupAt: null,
  autoDownload: false,
};

/** Interval durations in milliseconds */
const INTERVAL_MS: Record<BackupInterval, number> = {
  off: Infinity,
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
};

const INTERVAL_LABELS: Record<BackupInterval, string> = {
  off: 'Tắt',
  daily: 'Hàng ngày',
  weekly: 'Hàng tuần',
  monthly: 'Hàng tháng',
};

function loadFromStorage(): BackupSchedule {
  if (typeof window === 'undefined') return DEFAULT_SCHEDULE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SCHEDULE;
    return { ...DEFAULT_SCHEDULE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SCHEDULE;
  }
}

function saveToStorage(schedule: BackupSchedule): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schedule));
  } catch {
    // localStorage may be unavailable in some contexts
  }
}

/** Returns true if a backup is overdue based on the current schedule */
function isBackupDue(schedule: BackupSchedule): boolean {
  if (schedule.interval === 'off') return false;
  if (!schedule.lastBackupAt) return true;
  const elapsed = Date.now() - new Date(schedule.lastBackupAt).getTime();
  return elapsed >= INTERVAL_MS[schedule.interval];
}

/** Returns the next scheduled backup date, or null if disabled */
function nextDueDate(schedule: BackupSchedule): Date | null {
  if (schedule.interval === 'off') return null;
  const base = schedule.lastBackupAt ? new Date(schedule.lastBackupAt) : new Date(0);
  return new Date(base.getTime() + INTERVAL_MS[schedule.interval]);
}

export function useBackupSchedule() {
  const [schedule, setScheduleState] = useState<BackupSchedule>(DEFAULT_SCHEDULE);

  // Load from localStorage on mount
  useEffect(() => {
    setScheduleState(loadFromStorage());
  }, []);

  const setSchedule = useCallback((updates: Partial<BackupSchedule>) => {
    setScheduleState(prev => {
      const next = { ...prev, ...updates };
      saveToStorage(next);
      return next;
    });
  }, []);

  /** Call after a successful backup to record the timestamp */
  const recordBackup = useCallback(() => {
    setSchedule({ lastBackupAt: new Date().toISOString() });
  }, [setSchedule]);

  const isDue = isBackupDue(schedule);
  const nextDue = nextDueDate(schedule);
  const intervalLabel = INTERVAL_LABELS[schedule.interval];

  return {
    schedule,
    setSchedule,
    recordBackup,
    isDue,
    nextDue,
    intervalLabel,
    INTERVAL_LABELS,
  };
}
