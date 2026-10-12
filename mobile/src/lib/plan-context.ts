import { spokenMinuteNow } from '@/lib/clock';
import { greeting } from '@/lib/dashboard';
import { localDateInZone } from '@/lib/reflect-window';

/** v1: always plan the calendar today (evening → tomorrow disabled until we ship multi-day Plan home). */
const MorningAnchorMinute = 8 * 60;

export function addDaysToLocalDate(iso: string, days: number, timezone: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  const noon = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));
  return localDateInZone(timezone, noon);
}

export function planTargetLocalDate(timezone: string, now = new Date()): string {
  return localDateInZone(timezone, now);
}

export function planLayoutAnchorMinute(targetDate: string, timezone: string, now = new Date()): number {
  const today = localDateInZone(timezone, now);
  if (targetDate > today) {
    return MorningAnchorMinute;
  }
  return spokenMinuteNow(now);
}

export function formatPlanDayLabel(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export function planSessionCopy(targetDate: string, timezone: string, now = new Date()) {
  void timezone;
  void targetDate;

  return {
    greeting: greeting(now),
    title: 'Plan your day',
    subtitle: 'Say what is on today. Clock times are optional. We will suggest an order.',
    targetChip: 'Today',
    saveLabel: 'Save plan',
  };
}
