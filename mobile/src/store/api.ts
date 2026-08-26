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
  }),
});

export const {
  useGetDeskQuery,
  useGetHistoryQuery,
  usePlanMorningMutation,
  useReflectEveningMutation,
} = groundedApi;
