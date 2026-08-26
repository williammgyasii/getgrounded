import { configureStore } from '@reduxjs/toolkit';

import { groundedApi } from '@/store/api';

export const store = configureStore({
  reducer: {
    [groundedApi.reducerPath]: groundedApi.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(groundedApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
