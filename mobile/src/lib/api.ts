export function deviceTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

export type CommitmentRecord = {
  id: string;
  title: string;
  status: string;
  plannedDurationMinutes: number | null;
  actualDurationMinutes: number | null;
};

export type WinRecord = {
  id: string;
  title: string;
};

export type DayRecord = {
  id: string;
  localDate: string;
  timezone: string;
  showedUp: boolean;
  title: string | null;
  commitments: CommitmentRecord[];
  wins: WinRecord[];
};

export type MorningDraft = {
  title: string | null;
  commitments: { title: string; plannedDurationMinutes: number | null }[];
};

export type DeskRecord = {
  localDate: string;
  streakDays: number;
  today: DayRecord | null;
  yesterday: DayRecord | null;
};
