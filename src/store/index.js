import { combineReducers, configureStore } from "@reduxjs/toolkit";
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import authReducer from "./auth/authSlice";
import commonReducer from "./common/commonSlice";

const authPersistConfig = {
  key: "auth",
  version: 2,
  migrate: async (state) => { if (!state) return state; const { accessToken, resetCode, ...safe } = state; return safe; },
  storage,
  whitelist: [
    "user",
    "isAuthenticated",

    "resetEmail",

    "verifyOtpType",
  ],
};

const rootReducer = combineReducers({
  authReducer: persistReducer(authPersistConfig, authReducer),
  commonReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
