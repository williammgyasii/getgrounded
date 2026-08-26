import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { type DayRecord, type DeskRecord, type MorningDraft } from '@/lib/api';
import { getFirebaseAuth } from '@/lib/firebase';

const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'https://dev.get-grounded.app';

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
        commitments: { title: string; plannedDurationMinutes?: number | null }[];
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
      query: ({ uri }) => {
        const body = new FormData();
        body.append('audio', {
          uri,
          name: 'clip.m4a',
          type: 'audio/mp4',
        } as unknown as Blob);
        return { url: '/voice/hear', method: 'POST', body };
      },
    }),
    extractMorning: build.mutation<MorningDraft, { transcript: string }>({
      query: ({ transcript }) => ({
        url: '/voice/extract',
        method: 'POST',
        body: { kind: 'MORNING_PLAN', transcript },
      }),
    }),
    postClip: build.mutation<
      DeskRecord,
      { kind: 'EVENING_REFLECTION'; timezone: string; uri: string }
    >({
      query: ({ kind, timezone, uri }) => {
        const body = new FormData();
        body.append('kind', kind);
        body.append('timezone', timezone);
        body.append('audio', {
          uri,
          name: 'clip.m4a',
          type: 'audio/mp4',
        } as unknown as Blob);
        return { url: '/voice/clips', method: 'POST', body };
      },
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
} = groundedApi;
