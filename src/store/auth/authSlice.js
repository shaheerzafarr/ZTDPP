import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  isAuthenticated: false,
  accessToken: null,
  resetEmail: null,
  resetCode: null,
  verifyOtpType: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    saveLoginUserData(state, action) {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      if (action.payload.accessToken) {
        state.accessToken = action.payload.accessToken;
      }
    },
    updateUserData(state, action) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.accessToken = null;
      state.resetEmail = null;
      state.resetCode = null;
      state.verifyOtpType = null;
    },
    setResetEmail(state, action) {
      state.resetEmail = action.payload;
    },
    setResetCode(state, action) {
      state.resetCode = action.payload;
    },
    setVerifyOtpType(state, action) {
      state.verifyOtpType = action.payload;
    },
    clearResetFlow(state) {
      state.resetEmail = null;
      state.resetCode = null;
      state.verifyOtpType = null;
    },
    setAccessToken(state, action) {
      state.accessToken = action.payload;
    },
  },
});

export const {
  saveLoginUserData,
  updateUserData,
  logout,
  setResetEmail,
  setResetCode,
  setVerifyOtpType,
  clearResetFlow,
  setAccessToken,
} = authSlice.actions;

export default authSlice.reducer;
