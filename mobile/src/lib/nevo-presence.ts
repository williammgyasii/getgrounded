import AsyncStorage from '@react-native-async-storage/async-storage';

import { type CommitmentRecord, type DayRecord } from '@/lib/api';
import { clockLabelCompact } from '@/lib/clock';
import { DEFAULT_BUBBLE_LEAD_MINUTES, loadBubbleEnabled, loadLeadMinutes } from '@/lib/nevo-settings';

export const NEVO_SNAPSHOT_KEY = 'nevo.daySnapshot';

export type NevoDaySnapshot = {
  localDate: string;
  streakDays: number;
  nextTaskId: string | null;
  nextTaskTitle: string | null;
  nextTaskStartMinute: number | null;
  nextTaskDurationMinutes: number | null;
  bubbleEnabled: boolean;
  leadMinutes: number;
  bubbleLeadMinutes: number;
  updatedAt: string;
};

export function spokenMinuteNow(date = new Date()): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function pickNextCommitment(
  commitments: CommitmentRecord[],
  nowMinute: number,
): CommitmentRecord | null {
  const open = commitments
    .filter((row) => row.title.trim().length > 0)
    .filter((row) => (row.status ?? 'PLANNED').toUpperCase() !== 'COMPLETED');

  const timed = open
    .filter((row) => row.plannedStartMinute != null)
    .sort((left, right) => (left.plannedStartMinute ?? 0) - (right.plannedStartMinute ?? 0));

  const upcoming = timed.find((row) => (row.plannedStartMinute ?? 0) >= nowMinute);
  if (upcoming) {
    return upcoming;
  }

  if (timed.length > 0) {
    return timed[0];
  }

  return open[0] ?? null;
}

export function buildSnapshotFromDay(
  day: DayRecord,
  streakDays: number,
  prefs: { bubbleEnabled: boolean; leadMinutes: number },
  now = new Date(),
): NevoDaySnapshot {
  const nowMinute = spokenMinuteNow(now);
  const next = pickNextCommitment(day.commitments, nowMinute);

  return {
    localDate: day.localDate,
    streakDays,
    nextTaskId: next?.id ?? null,
    nextTaskTitle: next?.title?.trim() ?? null,
    nextTaskStartMinute: next?.plannedStartMinute ?? null,
    nextTaskDurationMinutes: next?.plannedDurationMinutes ?? null,
    bubbleEnabled: prefs.bubbleEnabled,
    leadMinutes: prefs.leadMinutes,
    bubbleLeadMinutes: DEFAULT_BUBBLE_LEAD_MINUTES,
    updatedAt: now.toISOString(),
  };
}

export function shouldShowBubbleWindow(snapshot: NevoDaySnapshot, _now = new Date()): boolean {
  return snapshot.bubbleEnabled;
}

export function nevoPlanDeepLink(taskId?: string | null): string {
  if (taskId) {
    return `getgroundedapp://plan?taskId=${encodeURIComponent(taskId)}`;
  }

  return 'getgroundedapp://plan';
}

export function bubbleLabel(snapshot: NevoDaySnapshot): string {
  if (!snapshot.nextTaskTitle) {
    return 'Nevo';
  }

  const time =
    snapshot.nextTaskStartMinute != null
      ? clockLabelCompact(snapshot.nextTaskStartMinute)
      : '';
  return time ? `${snapshot.nextTaskTitle} · ${time}` : snapshot.nextTaskTitle;
}

export async function saveNevoSnapshot(snapshot: NevoDaySnapshot): Promise<void> {
  await AsyncStorage.setItem(NEVO_SNAPSHOT_KEY, JSON.stringify(snapshot));
}

export async function loadNevoSnapshot(): Promise<NevoDaySnapshot | null> {
  const raw = await AsyncStorage.getItem(NEVO_SNAPSHOT_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as NevoDaySnapshot;
  } catch {
    return null;
  }
}

export async function buildSnapshotPrefs() {
  const [bubbleEnabled, leadMinutes] = await Promise.all([loadBubbleEnabled(), loadLeadMinutes()]);
  return { bubbleEnabled, leadMinutes };
}
