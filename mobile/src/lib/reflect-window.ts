import { type DayRecord } from '@/lib/api';

export const DefaultReflectStart = 19 * 60;
export const DefaultReflectEnd = 22 * 60;
export const ReflectGraceMinutes = 60;
export const ReflectLookbackDays = 2;

export function localDateString(now = new Date()): string {
  return localDateInZone(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', now);
}

export function localDateInZone(timezone: string, now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const year = parts.find((part) => part.type === 'year')?.value ?? '1970';
  const month = parts.find((part) => part.type === 'month')?.value ?? '01';
  const day = parts.find((part) => part.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
}

export function minuteOfDayInZone(timezone: string, now = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(now);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0) % 24;
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? 0);
  return hour * 60 + minute;
}

export function timezoneCaption(timezone: string, now = new Date()): string {
  try {
    const name = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    })
      .formatToParts(now)
      .find((part) => part.type === 'timeZoneName')?.value;
    const city = timezone.replace(/_/g, ' ').split('/').slice(-1)[0];
    return name ? `${name} · ${city}` : city;
  } catch {
    return timezone;
  }
}

export function inReflectWindow(
  minuteOfDay: number,
  startMinute = DefaultReflectStart,
  endMinute = DefaultReflectEnd,
  graceMinutes = ReflectGraceMinutes,
): boolean {
  const day = 24 * 60;
  const wrap = (value: number) => {
    const next = value % day;
    return next < 0 ? next + day : next;
  };
  const start = wrap(startMinute);
  const end = wrap(endMinute);
  const now = wrap(minuteOfDay);
  const close = wrap(end + graceMinutes);
  if (start <= end) {
    return now >= start && now < close;
  }
  return now >= start || now < close;
}

export function hasEvening(day: DayRecord): boolean {
  return (day.clips ?? []).some((clip) => clip.kind === 'EVENING_REFLECTION');
}

export function hasMorning(day: DayRecord): boolean {
  return (
    day.showedUp ||
    day.commitments.length > 0 ||
    (day.clips ?? []).some((clip) => clip.kind === 'MORNING_PLAN')
  );
}

export function canRecoverDay(day: DayRecord, today = localDateString()): boolean {
  if (!hasMorning(day) || hasEvening(day)) {
    return false;
  }
  const oldest = shiftDate(today, -ReflectLookbackDays);
  return day.localDate >= oldest && day.localDate <= today;
}

export function openReflectDays(days: DayRecord[], today = localDateString()): DayRecord[] {
  return days.filter((day) => canRecoverDay(day, today)).sort((left, right) => right.localDate.localeCompare(left.localDate));
}

function shiftDate(iso: string, days: number): string {
  const [year, month, day] = iso.split('-').map(Number);
  const next = new Date(year, month - 1, day + days);
  return localDateString(next);
}
