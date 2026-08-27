import { configureStore } from '@reduxjs/toolkit';

import { groundedApi } from '@/store/api';

export const store = configureStore({
  reducer: {
    [groundedApi.reducerPath]: groundedApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'groundedApi/executeMutation/pending',
          'groundedApi/executeMutation/fulfilled',
          'groundedApi/executeMutation/rejected',
          'groundedApi/executeQuery/pending',
          'groundedApi/executeQuery/fulfilled',
          'groundedApi/executeQuery/rejected',
        ],
        ignoredActionPaths: ['meta.arg', 'meta.baseQueryMeta', 'payload'],
        ignoredPaths: ['groundedApi'],
      },
    }).concat(groundedApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
