import { type CommitmentRecord } from '@/lib/api';
import { layOut } from '@/lib/lay-out';

const ClusterGapMs = 90_000;

export type AgendaTask = {
  key: string;
  title: string;
  plannedStartMinute?: number | null;
  plannedDurationMinutes?: number | null;
  lifeArea?: string | null;
  status?: string | null;
  createdAt?: string | null;
  fresh?: boolean;
};

export type TaskTake = {
  key: string;
  label: string;
  latest: boolean;
  items: AgendaTask[];
};

export function scheduledTasks(commitments: CommitmentRecord[], spokenMinute = 8 * 60): AgendaTask[] {
  const missing = commitments.some((item) => item.plannedStartMinute == null);
  const source = missing
    ? layOut(
        commitments.map((item) => ({
          ...item,
          plannedStartMinute: item.plannedStartMinute,
          plannedDurationMinutes: item.plannedDurationMinutes,
          lifeArea: item.lifeArea,
        })),
        spokenMinute,
      )
    : commitments;

  return source.map((item) => ({
    key: item.id,
    title: item.title,
    plannedStartMinute: item.plannedStartMinute,
    plannedDurationMinutes: item.plannedDurationMinutes,
    lifeArea: item.lifeArea,
    status: item.status,
    createdAt: item.createdAt,
  }));
}

export function takesOnDay(commitments: CommitmentRecord[], spokenMinute = 8 * 60): TaskTake[] {
  const tasks = scheduledTasks(commitments, spokenMinute);
  const stamped = tasks.filter((item) => item.createdAt);
  if (stamped.length < 2) {
    return [{ key: 'today', label: '', latest: false, items: byStart(tasks) }];
  }

  const ordered = [...stamped].sort(
    (left, right) => Date.parse(left.createdAt ?? '') - Date.parse(right.createdAt ?? ''),
  );
  const clusters: AgendaTask[][] = [];
  for (const item of ordered) {
    const last = clusters.at(-1);
    const at = Date.parse(item.createdAt ?? '');
    const prev = last ? Date.parse(last[last.length - 1]?.createdAt ?? '') : NaN;
    if (!last || !Number.isFinite(prev) || at - prev > ClusterGapMs) {
      clusters.push([item]);
    } else {
      last.push(item);
    }
  }

  const many = clusters.length > 1;
  return [...clusters].reverse().map((items, index) => ({
    key: items[0]?.key ?? String(index),
    label: takeLabel(items, many && index === 0, many),
    latest: many && index === 0,
    items: byStart(items).map((item) => ({ ...item, fresh: many && index === 0 })),
  }));
}

export function longDayLabel(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) {
    return isoDate;
  }

  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function byStart(items: AgendaTask[]): AgendaTask[] {
  return [...items].sort(
    (left, right) => (left.plannedStartMinute ?? 0) - (right.plannedStartMinute ?? 0),
  );
}

function takeLabel(items: AgendaTask[], latest: boolean, many: boolean): string {
  const at = items[0]?.createdAt ? new Date(items[0].createdAt) : null;
  if (!at || Number.isNaN(at.getTime())) {
    return latest ? 'Added later' : 'Earlier';
  }

  const time = at.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  if (many && latest) {
    return `Added ${time}`;
  }
  if (many && at.getHours() < 12) {
    return 'This morning';
  }
  return many ? 'Earlier' : '';
}
