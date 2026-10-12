import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { File } from 'expo-file-system';

import {
  deviceTimezone,
  type DayRecord,
  type DeskRecord,
  type EveningDraft,
  type MiddayDraft,
  type MorningDraft,
  type ClarifyExchange,
  type PlanClarifyResult,
  type ReviewRecord,
  type SpokenWord,
} from '@/lib/api';
import { getFirebaseAuth } from '@/lib/firebase';

function clipForm(uri: string, extra?: Record<string, string>): FormData {
  const file = new File(uri);
  if (!file.exists || file.size < 256) {
    throw new Error(`clip-too-small:${file.size}`);
  }

  const body = new FormData();
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      body.append(key, value);
    }
  }
  body.append('audio', file);
  return body;
}

export const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'https://dev.get-grounded.app';

export const groundedApi = createApi({
  reducerPath: 'groundedApi',
  tagTypes: ['Desk', 'History', 'Review'],
  baseQuery: fetchBaseQuery({
    baseUrl: apiUrl,
    prepareHeaders: async (headers) => {
      const user = getFirebaseAuth().currentUser;
      if (user) {
        headers.set('Authorization', `Bearer ${await user.getIdToken()}`);
      }
      return headers;
    },
  }),
  endpoints: (build) => ({
    identifyMe: build.query<{ userId: string }, void>({
      query: () => '/me',
    }),
    getDesk: build.query<DeskRecord, string>({
      query: (timezone) => `/days/today?timezone=${encodeURIComponent(timezone)}`,
      providesTags: ['Desk'],
    }),
    getHistory: build.query<DayRecord[], string>({
      query: (timezone) => `/days?timezone=${encodeURIComponent(timezone)}`,
      providesTags: ['History'],
    }),
    getReview: build.query<ReviewRecord, string>({
      query: (timezone) => `/days/review?timezone=${encodeURIComponent(timezone)}`,
      providesTags: ['Review'],
    }),
    planMorning: build.mutation<
      DayRecord,
      {
        timezone: string;
        transcript: string;
        title?: string | null;
        storageKey?: string | null;
        words?: SpokenWord[] | null;
        localDate?: string;
        coachNote?: string | null;
        commitments: {
          title: string;
          plannedDurationMinutes?: number | null;
          plannedStartMinute?: number | null;
          lifeArea?: string | null;
        }[];
      }
    >({
      query: ({ timezone, transcript, title, storageKey, words, localDate, coachNote, commitments }) => ({
        url: '/days/morning',
        method: 'POST',
        body: { timezone, transcript, title, storageKey, words, localDate, coachNote, commitments },
      }),
      invalidatesTags: ['Desk', 'History', 'Review'],
    }),
    reflectEvening: build.mutation<
      DayRecord,
      {
        timezone: string;
        transcript: string;
        dayId: string;
        storageKey?: string | null;
        words?: SpokenWord[] | null;
        outcomes: { id: string; status: string }[];
        wins: { title: string; lifeArea?: string | null }[];
      }
    >({
      query: ({ timezone, transcript, dayId, storageKey, words, outcomes, wins }) => ({
        url: '/days/evening',
        method: 'POST',
        body: {
          timezone,
          transcript,
          dayId,
          storageKey,
          words,
          outcomes,
          wins: wins
            .map((win) => ({ title: win.title.trim(), lifeArea: win.lifeArea ?? null }))
            .filter((win) => win.title.length > 0),
        },
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          patchBook(dispatch, (day) => (day.id === data.id ? data : day));
        } catch {
          // Invalidate below will refetch.
        }
      },
      invalidatesTags: ['Desk', 'History', 'Review'],
    }),
    updateMidday: build.mutation<
      DayRecord,
      {
        timezone: string;
        transcript: string;
        dayId: string;
        storageKey?: string | null;
        words?: SpokenWord[] | null;
        add: {
          title: string;
          plannedDurationMinutes?: number | null;
          plannedStartMinute?: number | null;
          lifeArea?: string | null;
        }[];
        outcomes: { id: string; status: string }[];
        extras: { title: string; lifeArea?: string | null }[];
      }
    >({
      query: ({ timezone, transcript, dayId, storageKey, words, add, outcomes, extras }) => ({
        url: '/days/midday',
        method: 'POST',
        body: {
          timezone,
          transcript,
          dayId,
          storageKey,
          words,
          add: add
            .map((item) => ({
              title: item.title.trim(),
              plannedDurationMinutes: item.plannedDurationMinutes ?? null,
              plannedStartMinute: item.plannedStartMinute ?? null,
              lifeArea: item.lifeArea ?? null,
            }))
            .filter((item) => item.title.length > 0),
          outcomes,
          extras: extras
            .map((item) => ({ title: item.title.trim(), lifeArea: item.lifeArea ?? null }))
            .filter((item) => item.title.length > 0),
        },
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          patchBook(dispatch, (day) => (day.id === data.id ? data : day));
        } catch {
          // Invalidate below will refetch.
        }
      },
      invalidatesTags: ['Desk', 'History', 'Review'],
    }),
    hearClip: build.mutation<
      { transcript: string; storageKey?: string; words?: SpokenWord[] },
      { uri: string }
    >({
      // RN often drops Authorization on multipart — attach the Bearer explicitly.
      async queryFn({ uri }) {
        const user = getFirebaseAuth().currentUser;
        if (!user) {
          return { error: { status: 401, data: { error: 'sign_in' } } };
        }

        const token = await user.getIdToken();
        let response: Response;
        try {
          response = await fetch(`${apiUrl}/voice/hear`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: clipForm(uri),
          });
        } catch {
          return { error: { status: 'FETCH_ERROR', error: 'network' } };
        }

        if (!response.ok) {
          let data: unknown;
          try {
            data = await response.json();
          } catch {
            data = undefined;
          }
          return { error: { status: response.status, data } };
        }

        const data = (await response.json()) as {
          transcript: string;
          storageKey?: string;
          words?: SpokenWord[];
        };
        return { data };
      },
    }),
    getClip: build.query<ArrayBuffer, string>({
      query: (id) => ({
        url: `/voice/clips/${id}`,
        responseHandler: (response) => response.arrayBuffer(),
      }),
      keepUnusedDataFor: 0,
    }),
    clarifyMorning: build.mutation<
      PlanClarifyResult,
      { transcript: string; timezone: string; clarifications?: ClarifyExchange[] }
    >({
      query: ({ transcript, timezone, clarifications }) => ({
        url: '/voice/clarify',
        method: 'POST',
        body: {
          kind: 'MORNING_PLAN',
          transcript,
          timezone,
          clarifications: clarifications?.map((row) => ({
            questionId: row.questionId,
            prompt: row.prompt,
            answer: row.answer,
          })),
        },
      }),
    }),
    extractMorning: build.mutation<
      MorningDraft,
      { transcript: string; timezone: string; spokenAt: string }
    >({
      query: ({ transcript, timezone, spokenAt }) => ({
        url: '/voice/extract',
        method: 'POST',
        body: { kind: 'MORNING_PLAN', transcript, timezone, spokenAt },
      }),
    }),
    extractEvening: build.mutation<EveningDraft, { transcript: string; dayId: string }>({
      query: ({ transcript, dayId }) => ({
        url: '/voice/extract',
        method: 'POST',
        body: { kind: 'EVENING_REFLECTION', transcript, dayId },
      }),
    }),
    extractMidday: build.mutation<MiddayDraft, { transcript: string; dayId: string }>({
      query: ({ transcript, dayId }) => ({
        url: '/voice/extract',
        method: 'POST',
        body: { kind: 'MIDDAY_UPDATE', transcript, dayId },
      }),
    }),
    renameDay: build.mutation<DayRecord, { id: string; title: string }>({
      query: ({ id, title }) => ({
        url: `/days/${id}`,
        method: 'PATCH',
        body: { title },
      }),
      async onQueryStarted({ id, title }, { dispatch, queryFulfilled }) {
        const patches = patchBook(dispatch, (day) => (day.id === id ? { ...day, title } : day));
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((patch) => patch.undo());
        }
      },
      invalidatesTags: ['Desk', 'History', 'Review'],
    }),
    removeDay: build.mutation<void, string>({
      query: (id) => ({
        url: `/days/${id}`,
        method: 'DELETE',
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patches = patchBook(dispatch, (day) => (day.id === id ? null : day));
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((patch) => patch.undo());
        }
      },
      invalidatesTags: ['Desk', 'History', 'Review'],
    }),
    markCommitment: build.mutation<DayRecord, { id: string; status: string }>({
      query: ({ id, status }) => ({
        url: `/days/commitments/${id}`,
        method: 'PATCH',
        body: { status },
      }),
      async onQueryStarted({ id, status }, { dispatch, queryFulfilled }) {
        const patches = patchBook(dispatch, (day) => ({
          ...day,
          commitments: day.commitments.map((item) => (item.id === id ? { ...item, status } : item)),
        }));
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((patch) => patch.undo());
        }
      },
      invalidatesTags: ['Desk', 'History', 'Review'],
    }),
    removeCommitment: build.mutation<DayRecord, string>({
      query: (id) => ({
        url: `/days/commitments/${id}`,
        method: 'DELETE',
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patches = patchBook(dispatch, (day) => ({
          ...day,
          commitments: day.commitments.filter((item) => item.id !== id),
        }));
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((patch) => patch.undo());
        }
      },
      invalidatesTags: ['Desk', 'History', 'Review'],
    }),
    postClip: build.mutation<
      DeskRecord,
      { kind: 'EVENING_REFLECTION'; timezone: string; uri: string }
    >({
      query: ({ kind, timezone, uri }) => ({
        url: '/voice/clips',
        method: 'POST',
        body: clipForm(uri, { kind, timezone }),
      }),
      invalidatesTags: ['Desk', 'History', 'Review'],
    }),
  }),
});

function patchBook(
  dispatch: (action: ReturnType<typeof groundedApi.util.updateQueryData>) => { undo: () => void },
  write: (day: DayRecord) => DayRecord | null,
) {
  const timezone = deviceTimezone();
  return [
    dispatch(
      groundedApi.util.updateQueryData('getHistory', timezone, (days) => {
        for (let index = days.length - 1; index >= 0; index -= 1) {
          const next = write(days[index]);
          if (next == null) {
            days.splice(index, 1);
          } else {
            Object.assign(days[index], next);
          }
        }
      }),
    ),
    dispatch(
      groundedApi.util.updateQueryData('getDesk', timezone, (desk) => {
        if (desk.today) {
          desk.today = write(desk.today);
        }
        if (desk.yesterday) {
          desk.yesterday = write(desk.yesterday);
        }
      }),
    ),
  ];
}

export const {
  useGetDeskQuery,
  useGetHistoryQuery,
  useGetReviewQuery,
  usePlanMorningMutation,
  useReflectEveningMutation,
  useUpdateMiddayMutation,
  useHearClipMutation,
  useLazyGetClipQuery,
  useClarifyMorningMutation,
  useExtractMorningMutation,
  useExtractEveningMutation,
  useExtractMiddayMutation,
  usePostClipMutation,
  useRenameDayMutation,
  useRemoveDayMutation,
  useMarkCommitmentMutation,
  useRemoveCommitmentMutation,
} = groundedApi;
