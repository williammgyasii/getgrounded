import { type DayRecord } from '@/lib/api';

export function greeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) {
    return 'Good morning';
  }
  if (hour < 17) {
    return 'Good afternoon';
  }
  return 'Good evening';
}

export function givenName(email?: string | null, displayName?: string | null): string {
  const fromProfile = displayName?.trim().split(/\s+/)[0];
  if (fromProfile) {
    return fromProfile;
  }

  const local = email?.split('@')[0]?.replace(/[0-9._-]+/g, ' ').trim().split(/\s+/)[0];
  if (!local) {
    return '';
  }

  return local.charAt(0).toUpperCase() + local.slice(1);
}

export type WeekDay = {
  key: string;
  label: string;
  date: number;
  iso: string;
  today: boolean;
  showedUp: boolean;
  planned: number;
  done: number;
};

export function weekStrip(days: DayRecord[], now = new Date()): WeekDay[] {
  const byDate = indexDays(days);
  return range(6).map((offset) => {
    const day = startOfDay(now);
    day.setDate(day.getDate() - (6 - offset));
    const iso = toIso(day);
    const record = byDate.get(iso);
    const planned = record?.commitments.length ?? 0;
    const done = record?.commitments.filter((item) => item.status.toUpperCase() === 'COMPLETED').length ?? 0;
    return {
      key: iso,
      label: day.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2),
      date: day.getDate(),
      iso,
      today: offset === 6,
      showedUp: record?.showedUp ?? false,
      planned,
      done,
    };
  });
}

export function monthHeat(days: DayRecord[], now = new Date()): { iso: string; level: 0 | 1 | 2 | 3 }[] {
  const byDate = indexDays(days);
  return range(27).map((offset) => {
    const day = startOfDay(now);
    day.setDate(day.getDate() - (27 - offset));
    const record = byDate.get(toIso(day));
    if (!record) {
      return { iso: toIso(day), level: 0 };
    }
    if (record.commitments.length === 0) {
      return { iso: toIso(day), level: record.showedUp ? 1 : 0 };
    }
    const done = record.commitments.filter((item) => item.status.toUpperCase() === 'COMPLETED').length;
    const ratio = done / record.commitments.length;
    const level = ratio >= 0.75 ? 3 : ratio >= 0.35 ? 2 : 1;
    return { iso: toIso(day), level };
  });
}

export function consistencyScore(days: DayRecord[], now = new Date()): number {
  const week = weekStrip(days, now);
  const shown = week.filter((day) => day.showedUp).length;
  return Math.round((shown / week.length) * 100);
}

export function todayProgress(day: DayRecord | null): { done: number; total: number; percent: number } {
  const total = day?.commitments.length ?? 0;
  const done =
    day?.commitments.filter((item) => {
      const status = item.status.toUpperCase();
      return status === 'COMPLETED' || status === 'PARTIAL';
    }).length ?? 0;
  return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
}

function indexDays(days: DayRecord[]): Map<string, DayRecord> {
  return new Map(days.map((day) => [day.localDate, day]));
}

function startOfDay(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function toIso(day: Date): string {
  const year = day.getFullYear();
  const month = String(day.getMonth() + 1).padStart(2, '0');
  const date = String(day.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
}

function range(last: number): number[] {
  return Array.from({ length: last + 1 }, (_, index) => index);
}
