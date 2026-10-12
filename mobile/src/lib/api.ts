export function deviceTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

export type CommitmentRecord = {
  id: string;
  title: string;
  status: string;
  plannedDurationMinutes: number | null;
  actualDurationMinutes: number | null;
  plannedStartMinute?: number | null;
  lifeArea?: string | null;
  createdAt?: string | null;
};

export type WinRecord = {
  id: string;
  title: string;
  lifeArea?: string | null;
};

export type SpokenWord = {
  text: string;
  start: number;
  end: number;
};

export type ClipRecord = {
  id: string;
  kind: string;
  transcript: string;
  createdAt?: string | null;
  playable?: boolean;
  words?: SpokenWord[];
};

export type DayRecord = {
  id: string;
  localDate: string;
  timezone: string;
  showedUp: boolean;
  title: string | null;
  coachNote?: string | null;
  commitments: CommitmentRecord[];
  wins: WinRecord[];
  clips?: ClipRecord[];
};

export type MorningDraft = {
  title: string | null;
  coachNote?: string | null;
  commitments: {
    title: string;
    plannedDurationMinutes: number | null;
    plannedStartMinute?: number | null;
    lifeArea?: string | null;
  }[];
};

export type ClarifyQuestion = {
  id: string;
  prompt: string;
  topic?: string | null;
};

export type ClarifyExchange = {
  questionId: string;
  prompt: string;
  answer: string;
};

export type PlanClarifyResult = {
  museLine: string;
  complete?: boolean;
  questions: ClarifyQuestion[];
};

export type EveningDraft = {
  outcomes: {
    id: string;
    status: string;
    actualDurationMinutes?: number | null;
    reason?: string | null;
  }[];
  wins: { title: string; lifeArea?: string | null }[];
  mirror?: string | null;
};

export type MiddayDraft = {
  add: {
    title: string;
    plannedDurationMinutes?: number | null;
    plannedStartMinute?: number | null;
    lifeArea?: string | null;
  }[];
  outcomes: {
    id: string;
    status: string;
    actualDurationMinutes?: number | null;
    reason?: string | null;
  }[];
  extras: { title: string; lifeArea?: string | null }[];
};

export type DeskRecord = {
  localDate: string;
  streakDays: number;
  today: DayRecord | null;
  yesterday: DayRecord | null;
};

export type ReviewNight = {
  dayId: string;
  localDate: string;
  title: string | null;
  planned: number;
  done: number;
  partial: number;
  missed: number;
  extras: number;
};

export type ReviewRecord = {
  from: string;
  to: string;
  timezone: string;
  closedNights: number;
  planned: number;
  done: number;
  partial: number;
  missed: number;
  extras: number;
  earned: number;
  followThrough: number | null;
  nights: ReviewNight[];
};
