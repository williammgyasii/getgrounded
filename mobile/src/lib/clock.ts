export function minuteToClock(minute: number | null | undefined): string {
  if (minute == null || minute < 0) {
    return '';
  }

  const hours = Math.floor(minute / 60) % 24;
  const mins = minute % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export function clockToMinute(raw: string): number | null {
  const match = raw.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const mins = Number(match[2]);
  if (hours > 23 || mins > 59) {
    return null;
  }

  return hours * 60 + mins;
}

export function clockLabel(minute: number | null | undefined): string {
  if (minute == null || minute < 0) {
    return '';
  }

  const hours = Math.floor(minute / 60) % 24;
  const mins = minute % 60;
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour}:${String(mins).padStart(2, '0')} ${suffix}`;
}

/** Narrow task rows — single line (e.g. 9:00 AM). */
export function clockLabelCompact(minute: number | null | undefined): string {
  if (minute == null || minute < 0) {
    return '—';
  }

  const hours = Math.floor(minute / 60) % 24;
  const mins = minute % 60;
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour = hours % 12 === 0 ? 12 : hours % 12;
  if (mins === 0) {
    return `${hour} ${suffix}`;
  }

  return `${hour}:${String(mins).padStart(2, '0')} ${suffix}`;
}

export function minutesLabel(minutes: number | null | undefined): string | null {
  if (minutes == null || minutes <= 0) {
    return null;
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

export function minutesPhrase(minutes: number | null | undefined): string | null {
  if (minutes == null || minutes <= 0) {
    return null;
  }

  if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const hourPart = `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  return rest === 0 ? hourPart : `${hourPart} ${rest} minutes`;
}

export function spokenMinuteNow(now = new Date()): number {
  return now.getHours() * 60 + now.getMinutes();
}

export function dateFromMinute(minute: number, day = new Date()): Date {
  const next = new Date(day);
  next.setHours(Math.floor(minute / 60), minute % 60, 0, 0);
  return next;
}
