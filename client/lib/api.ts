import { format } from "date-fns";

export type Difficulty = "easy" | "medium" | "hard";
export type Question = { id: string; text: string; difficulty: Difficulty };
export type ScoringResult = { score: number; feedback: string };
export type ParsedResume = {
  name?: string;
  email?: string;
  phone?: string;
  skills?: string[];
};
export type Candidate = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  finalScore?: number;
  summary?: string;
  createdAt: string;
};

export type FinalAnalysis = {
  finalScore: number;
  summary: string;
};

export type CandidateDetails = {
  name?: string;
  email?: string;
  phone?: string;
};

async function safeFetch<T>(
  url: string,
  init?: RequestInit,
  fallback?: () => T,
): Promise<T> {
  try {
    const res = await fetch(url, init);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } catch (err) {
    if (fallback) return fallback();
    throw err;
  }
}

const BASE = '';

async function postForm(path: string, form: FormData) {
  const res = await fetch(`${BASE}${path}`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const Api = {
  parseResume: async (file: File) => {
    const f = new FormData();
    f.append('file', file);
    return postForm('/api/resume/upload', f);
  },


  updateCandidateDetails: async (sessionId: string, details: CandidateDetails) => {
    const res = await fetch(`${BASE}/api/interview/candidate`, {
      method: 'PATCH', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, ...details }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },


  generateQuestions: async (sessionId: string, n = 6) => {
    const res = await fetch(`${BASE}/api/interview/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, n }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  fetchSession: async (sessionId: string) => {
    const res = await fetch(`${BASE}/api/interview/session/${sessionId}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  listCandidates: async (): Promise<Candidate[]> => {
    const res = await fetch(`${BASE}/api/candidates`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  saveAnswer: async (payload: { sessionId: string; questionId: string; answer: string; }) => {
    const res = await fetch(`${BASE}/api/interview/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  finalizeAndScoreInterview: async (sessionId: string): Promise<FinalAnalysis> => {
    const res = await fetch(`${BASE}/api/interview/finalize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};
