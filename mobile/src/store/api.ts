import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { type DayRecord, type DeskRecord } from '@/lib/api';
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
      { timezone: string; transcript: string; titles: string[] }
    >({
      query: ({ timezone, transcript, titles }) => ({
        url: '/days/morning',
        method: 'POST',
        body: {
          timezone,
          transcript,
          commitments: titles.map((title) => ({ title })),
        },
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
    startVoiceSession: build.mutation<{ conversationToken: string; agentId: string }, void>({
      query: () => '/voice/session',
      transformErrorResponse: (response) => {
        if (response.status === 429) {
          return 'Voice is busy. Close other ElevenLabs conversations and try again.';
        }
        if (response.status === 503) {
          return 'Voice is not configured on the API yet.';
        }
        return 'Could not start a voice session.';
      },
    }),
  }),
});

export const {
  useGetDeskQuery,
  useGetHistoryQuery,
  usePlanMorningMutation,
  useReflectEveningMutation,
  useStartVoiceSessionMutation,
} = groundedApi;
