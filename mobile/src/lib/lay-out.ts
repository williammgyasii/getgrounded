export type PlannedDraft = {
  title: string;
  plannedDurationMinutes?: number | null;
  plannedStartMinute?: number | null;
  lifeArea?: string | null;
};

const DefaultMinutes = 30;
const MealMinutes = 45;

export function layOut<T extends PlannedDraft>(items: T[], spokenMinute: number): T[] {
  const prepared = items.map((item) => ({
    ...item,
    plannedDurationMinutes: guessDuration(item.title, item.plannedDurationMinutes),
    lifeArea: item.lifeArea?.trim() ? item.lifeArea.trim().toUpperCase() : guessArea(item.title),
  }));

  const timed = prepared.filter((item) => item.plannedStartMinute != null);
  const untimed = prepared.filter((item) => item.plannedStartMinute == null);

  if (timed.length === 0) {
    const placed: T[] = [];
    let cursor = Math.max(0, spokenMinute);
    for (const item of untimed) {
      const duration = item.plannedDurationMinutes ?? DefaultMinutes;
      const start = nextGap(cursor, duration, placed);
      placed.push({ ...item, plannedStartMinute: start });
      cursor = start + duration;
    }
    return placed.sort(
      (left, right) => (left.plannedStartMinute ?? 0) - (right.plannedStartMinute ?? 0),
    );
  }

  const placed: T[] = [...timed];
  for (const item of untimed) {
    placed.push({ ...item, plannedStartMinute: null });
  }

  return placed.sort((left, right) => {
    const leftStart = left.plannedStartMinute;
    const rightStart = right.plannedStartMinute;
    if (leftStart == null && rightStart == null) {
      return 0;
    }
    if (leftStart == null) {
      return 1;
    }
    if (rightStart == null) {
      return -1;
    }
    return leftStart - rightStart;
  });
}

function guessDuration(title: string, given?: number | null): number {
  if (given != null && given > 0) {
    return given;
  }

  return looksLikeMeal(title) ? MealMinutes : DefaultMinutes;
}

function guessArea(title: string): string {
  const text = title.toLowerCase();
  if (looksLikeMeal(title) || contains(text, ['cook', 'grocery', 'home', 'laundry', 'clean'])) {
    return 'HOME';
  }
  if (contains(text, ['gym', 'run', 'walk', 'workout', 'yoga', 'health', 'doctor', 'shower', 'bath'])) {
    return 'HEALTH';
  }
  if (contains(text, ['bible', 'scripture', 'pray', 'church', 'meditat'])) {
    return 'SPIRITUAL';
  }
  if (contains(text, ['read', 'study', 'learn', 'course', 'class'])) {
    return 'LEARNING';
  }
  if (contains(text, ['ship', 'work', 'meeting', 'code', 'api', 'email', 'office'])) {
    return 'WORK';
  }
  if (contains(text, ['call', 'family', 'friend', 'date', 'mom', 'dad', 'mother', 'father'])) {
    return 'RELATIONSHIPS';
  }
  if (contains(text, ['bill', 'money', 'budget', 'invoice'])) {
    return 'FINANCIAL';
  }
  return 'PERSONAL';
}

function nextGap(
  cursor: number,
  duration: number,
  placed: { plannedStartMinute?: number | null; plannedDurationMinutes?: number | null }[],
): number {
  const busy = placed
    .filter((item) => item.plannedStartMinute != null)
    .map((item) => ({
      start: item.plannedStartMinute ?? 0,
      end: (item.plannedStartMinute ?? 0) + (item.plannedDurationMinutes ?? DefaultMinutes),
    }))
    .sort((left, right) => left.start - right.start);

  let start = cursor;
  for (const slot of busy) {
    if (start + duration <= slot.start) {
      return start;
    }
    if (start < slot.end) {
      start = slot.end;
    }
  }

  return start;
}

function looksLikeMeal(title: string): boolean {
  return contains(title.toLowerCase(), ['lunch', 'dinner', 'breakfast', 'brunch', 'eat', 'meal']);
}

function contains(text: string, needles: string[]): boolean {
  return needles.some((needle) => text.includes(needle));
}
