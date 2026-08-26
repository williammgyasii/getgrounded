import { clockToMinute, minuteToClock, spokenMinuteNow } from '@/lib/clock';

import { type PlanLine } from '@/components/talk/plan-task-card';

export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
    return items;
  }

  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function reflowStarts(lines: PlanLine[]): PlanLine[] {
  if (lines.length === 0) {
    return lines;
  }

  let cursor = clockToMinute(lines[0].start) ?? spokenMinuteNow();
  return lines.map((line) => {
    const duration = Number.parseInt(line.minutes, 10);
    const minutes = Number.isFinite(duration) && duration > 0 ? duration : 30;
    const next = { ...line, start: minuteToClock(cursor) };
    cursor += minutes;
    return next;
  });
}
