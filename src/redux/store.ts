// src/redux/store.ts
import { configureStore } from '@reduxjs/toolkit';

const dummyReducer = (state = {}) => state;

export const store = configureStore({
  reducer: {
    dummy: dummyReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 