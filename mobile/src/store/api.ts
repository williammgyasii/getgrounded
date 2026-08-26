import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { File } from 'expo-file-system';

import { type DayRecord, type DeskRecord, type MorningDraft } from '@/lib/api';
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
  tagTypes: ['Desk', 'History'],
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
    planMorning: build.mutation<
      DayRecord,
      {
        timezone: string;
        transcript: string;
        title?: string | null;
        commitments: {
          title: string;
          plannedDurationMinutes?: number | null;
          plannedStartMinute?: number | null;
          lifeArea?: string | null;
        }[];
      }
    >({
      query: ({ timezone, transcript, title, commitments }) => ({
        url: '/days/morning',
        method: 'POST',
        body: { timezone, transcript, title, commitments },
      }),
      invalidatesTags: ['Desk', 'History'],
    }),
    reflectEvening: build.mutation<
      DayRecord,
      {
        timezone: string;
        transcript: string;
        outcomes: { id: string; status: string }[];
        wins: string[];
      }
    >({
      query: ({ timezone, transcript, outcomes, wins }) => ({
        url: '/days/evening',
        method: 'POST',
        body: {
          timezone,
          transcript,
          outcomes,
          wins: wins.map((title) => ({ title })),
        },
      }),
      invalidatesTags: ['Desk', 'History'],
    }),
    hearClip: build.mutation<{ transcript: string }, { uri: string }>({
      query: ({ uri }) => ({
        url: '/voice/hear',
        method: 'POST',
        body: clipForm(uri),
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
    renameDay: build.mutation<DayRecord, { id: string; title: string }>({
      query: ({ id, title }) => ({
        url: `/days/${id}`,
        method: 'PATCH',
        body: { title },
      }),
      invalidatesTags: ['Desk', 'History'],
    }),
    removeDay: build.mutation<void, string>({
      query: (id) => ({
        url: `/days/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Desk', 'History'],
    }),
    markCommitment: build.mutation<DayRecord, { id: string; status: string }>({
      query: ({ id, status }) => ({
        url: `/days/commitments/${id}`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['Desk', 'History'],
    }),
    removeCommitment: build.mutation<DayRecord, string>({
      query: (id) => ({
        url: `/days/commitments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Desk', 'History'],
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
      invalidatesTags: ['Desk', 'History'],
    }),
  }),
});

export const {
  useGetDeskQuery,
  useGetHistoryQuery,
  usePlanMorningMutation,
  useReflectEveningMutation,
  useHearClipMutation,
  useExtractMorningMutation,
  usePostClipMutation,
  useRenameDayMutation,
  useRemoveDayMutation,
  useMarkCommitmentMutation,
  useRemoveCommitmentMutation,
} = groundedApi;
