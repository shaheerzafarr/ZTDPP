import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  /** Last verification report produced from the dashboard (for quick re-open). */
  lastVerification: null,
  /** Plaintext API key shown once after creation. */
  revealedApiKey: null,
};

const commonSlice = createSlice({
  name: "common",
  initialState,
  reducers: {
    setLastVerification(state, action) {
      state.lastVerification = action.payload;
    },
    setRevealedApiKey(state, action) {
      state.revealedApiKey = action.payload;
    },
    clearRevealedApiKey(state) {
      state.revealedApiKey = null;
    },
  },
});

export const { setLastVerification, setRevealedApiKey, clearRevealedApiKey } = commonSlice.actions;

export default commonSlice.reducer;
