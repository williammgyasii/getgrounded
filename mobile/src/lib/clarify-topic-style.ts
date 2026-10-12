import { type ClarifyQuestion } from '@/lib/api';

export type ClarifyTopicStyle = {
  label: string;
  bg: string;
  border: string;
  ink: string;
};

const Default: ClarifyTopicStyle = {
  label: 'Plan',
  bg: 'rgba(107, 163, 224, 0.14)',
  border: 'rgba(107, 163, 224, 0.35)',
  ink: '#9CC4F0',
};

const Styles: Record<string, ClarifyTopicStyle> = {
  reading: {
    label: 'Read',
    bg: 'rgba(167, 139, 250, 0.16)',
    border: 'rgba(167, 139, 250, 0.4)',
    ink: '#C4B5FD',
  },
  gym: {
    label: 'Gym',
    bg: 'rgba(245, 158, 11, 0.16)',
    border: 'rgba(245, 158, 11, 0.4)',
    ink: '#FCD34D',
  },
  cooking: {
    label: 'Cook',
    bg: 'rgba(248, 113, 113, 0.14)',
    border: 'rgba(248, 113, 113, 0.38)',
    ink: '#FCA5A5',
  },
  calls: {
    label: 'Calls',
    bg: 'rgba(96, 165, 250, 0.14)',
    border: 'rgba(96, 165, 250, 0.38)',
    ink: '#93C5FD',
  },
};

export function clarifyTopicStyle(question: ClarifyQuestion): ClarifyTopicStyle {
  const topic = question.topic?.trim().toLowerCase() ?? '';
  if (topic && Styles[topic]) {
    return Styles[topic];
  }

  const prompt = question.prompt.toLowerCase();
  if (/\bread\b|\bbook\b/.test(prompt)) {
    return Styles.reading;
  }
  if (/\bgym\b|\bworkout\b/.test(prompt)) {
    return Styles.gym;
  }
  if (/\bcook\b|\bmeal\b|\bdinner\b/.test(prompt)) {
    return Styles.cooking;
  }
  if (/\bcall\b|\bfriends\b/.test(prompt)) {
    return Styles.calls;
  }

  return Default;
}

/** One short line for Nevo's intro — not the full essay. */
export function clarifyIntroLine(museLine: string | null | undefined): string {
  const text = museLine?.trim() ?? '';
  if (!text) {
    return 'A few details, then we build your plan.';
  }

  const first = text.split(/(?<=[.!?])\s+/)[0]?.trim() ?? text;
  if (first.length <= 96) {
    return first;
  }

  return `${first.slice(0, 93).trim()}…`;
}
