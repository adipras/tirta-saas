import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, createTransform } from 'redux-persist';
import type { PersistConfig } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from '@reduxjs/toolkit';

import authSlice from './slices/authSlice';
import type { AuthState } from './slices/authSlice';

const authStateTransform = createTransform(
  (inboundState: AuthState) => ({
    user: inboundState.user,
    token: inboundState.token,
    isAuthenticated: inboundState.isAuthenticated,
  }),
  (outboundState: Partial<AuthState>): AuthState => ({
    user: outboundState.user ?? null,
    token: outboundState.token ?? null,
    isAuthenticated: outboundState.isAuthenticated ?? false,
    isLoading: false,
    error: null,
    currentRequestId: undefined,
  }),
  { whitelist: ['auth'] }
);

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'], // Only persist auth state
  transforms: [authStateTransform],
};

const rootReducer = combineReducers({
  auth: authSlice,
});

const typedPersistConfig: PersistConfig<ReturnType<typeof rootReducer>> = persistConfig;
const persistedReducer = persistReducer(typedPersistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: import.meta.env.MODE !== 'production',
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;