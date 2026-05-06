import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface MotivationalQuote {
  quote: string;
  author: string;
  category?: string;
}

interface TransitionSessionState {
  summary?: string;
  artifact?: string | null;
  quote?: MotivationalQuote | null;
}

interface BusinessPlanTransitionState {
  bySessionId: Record<string, TransitionSessionState>;
}

const initialState: BusinessPlanTransitionState = {
  bySessionId: {},
};

interface UpsertTransitionPayload {
  sessionId: string;
  summary?: string;
  artifact?: string | null;
  quote?: MotivationalQuote | null;
}

const businessPlanTransitionSlice = createSlice({
  name: 'businessPlanTransition',
  initialState,
  reducers: {
    upsertTransitionSession: (state, action: PayloadAction<UpsertTransitionPayload>) => {
      const { sessionId, summary, artifact, quote } = action.payload;
      const current = state.bySessionId[sessionId] ?? {};

      state.bySessionId[sessionId] = {
        ...current,
        ...(summary !== undefined ? { summary } : {}),
        ...(artifact !== undefined ? { artifact } : {}),
        ...(quote !== undefined ? { quote } : {}),
      };
    },
    clearTransitionSession: (state, action: PayloadAction<string>) => {
      delete state.bySessionId[action.payload];
    },
  },
});

export const { upsertTransitionSession, clearTransitionSession } = businessPlanTransitionSlice.actions;
export default businessPlanTransitionSlice.reducer;
