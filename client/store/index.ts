import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";

import type { Difficulty, Question } from "@/lib/api";

export type Message = {
  id: string;
  role: "ai" | "user" | "system";
  text: string;
  score?: number;
};

export type InterviewStatus =
  | "idle"
  | "collecting"
  | "in_progress"
  | "completed"
  | "paused"
  | "evaluating";

export type InterviewState = {
  sessionId: string | null;
  candidate: { name?: string; email?: string; phone?: string };
  questions: Question[];
  current: number;
  messages: Message[];
  answers: Record<
    string,
    { answer: string }
  >;
  status: InterviewStatus;
  timeRemaining: number;
  totalAsked: number;
  finalScore: number | null;
  summary: string | null;
  evaluationError: string | null; 
};

const initialInterview: InterviewState = {
  sessionId: null,
  candidate: {},
  questions: [],
  current: 0,
  messages: [],
  answers: {},
  status: "idle",
  timeRemaining: 0,
  totalAsked: 0,
  finalScore: null,
  summary: null,
  evaluationError: null,
};

const durations: Record<Difficulty, number> = {
  easy: 20,
  medium: 60,
  hard: 120,
};

const interviewSlice = createSlice({
  name: "interview",
  initialState: initialInterview,
  reducers: {
    reset: () => initialInterview,
    setSession(
      state,
      action: PayloadAction<{
        candidate: { name?: string; email?: string; phone?: string };
        sessionId: string;
      }>,
    ) {
      state.candidate = action.payload.candidate;
      state.sessionId = action.payload.sessionId;
      state.status = "collecting"; 
    },

    loadQuestions(state, action: PayloadAction<Question[]>) {
      state.questions = action.payload;
      state.current = 0;
      state.totalAsked = 0;
      state.status = "collecting"; 
    },
    setCandidate(
      state,
      action: PayloadAction<{ name?: string; email?: string; phone?: string }>,
    ) {
      state.candidate = { ...state.candidate, ...action.payload };
    },
    startInterview(state) {
      if (state.questions.length === 0) return;
      state.status = "in_progress";
      const q = state.questions[state.current];
      state.timeRemaining = durations[q.difficulty];
      state.totalAsked = 1;
      state.messages.push({ id: `q-${q.id}`, role: "ai", text: q.text });
    },
    tick(state) {
      if (state.status !== "in_progress") return;
      state.timeRemaining = Math.max(0, state.timeRemaining - 1);
    },
    submitAnswer(
      state,
      action: PayloadAction<{ questionId: string; answer: string }>
    ) {
      const { questionId, answer } = action.payload;
      state.answers[questionId] = { answer };

      state.messages.push({
        id: `a-${questionId}`,
        role: "user",
        text: answer,
      });
    },
    startEvaluation(state) {
      state.status = "evaluating";
    },

    setFinalAnalysis(state, action: PayloadAction<{ finalScore: number; summary: string }>) {
      state.finalScore = action.payload.finalScore;
      state.summary = action.payload.summary;
      state.status = "completed"; 
      state.evaluationError = null;
    },
    setEvaluationError(state, action: PayloadAction<string>) {
        state.status = "completed";
        state.evaluationError = action.payload;
    },
    nextQuestion(state) {
      if (state.current < state.questions.length - 1) {
        state.current += 1;
        const q = state.questions[state.current];
        state.timeRemaining = durations[q.difficulty];
        state.status = "in_progress";
        state.totalAsked += 1;
        state.messages.push({ id: `q-${q.id}`, role: "ai", text: q.text });
      } else {
        state.status = "completed";
        state.timeRemaining = 0;
      }
    },
    pause(state) {
      if (state.status === "in_progress") state.status = "paused";
    },
    resume(state) {
      if (state.status === "paused") state.status = "in_progress";
    },
  },
});

export const interviewActions = interviewSlice.actions;

export type CandidateRow = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  finalScore?: number;
  summary?: string;
  createdAt: string;
};

const candidatesSlice = createSlice({
  name: "candidates",
  initialState: [] as CandidateRow[],
  reducers: {
    setCandidates: (_state, action: PayloadAction<CandidateRow[]>) =>
      action.payload,
    addOrUpdate(state, action: PayloadAction<CandidateRow>) {
      const idx = state.findIndex((c) => c.id === action.payload.id);
      if (idx === -1) state.push(action.payload);
      else state[idx] = action.payload;
    },
  },
});

export const candidateActions = candidatesSlice.actions;

const uiSlice = createSlice({
  name: "ui",
  initialState: { theme: "light" as "light" | "dark", welcomeBackOpen: false },
  reducers: {
    setTheme(state, action: PayloadAction<"light" | "dark">) {
      state.theme = action.payload;
    },
    setWelcomeBack(state, action: PayloadAction<boolean>) {
      state.welcomeBackOpen = action.payload;
    },
  },
});

export const uiActions = uiSlice.actions;

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["interview", "candidates", "ui"],
};

const rootReducer = {
  interview: interviewSlice.reducer,
  candidates: candidatesSlice.reducer,
  ui: uiSlice.reducer,
};

export const store = configureStore({
  reducer: persistReducer(persistConfig, (state: any, action: any) => ({
    interview: rootReducer.interview((state as any)?.interview, action),
    candidates: rootReducer.candidates((state as any)?.candidates, action),
    ui: rootReducer.ui((state as any)?.ui, action),
  })) as any,
  middleware: (gDM) => gDM({ serializableCheck: false }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
