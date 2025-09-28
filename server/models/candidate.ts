export type Difficulty = "easy" | "medium" | "hard";

export interface Question {
  id: string;
  text: string;
  difficulty: Difficulty;
  time_seconds: number;
  maxScore: number;
}

export interface AnswerRecord {
  questionId: string;
  questionText: string;
  answer: string;
  score: number;
  feedback?: string;
  createdAt?: string;
}

export interface CandidateInfo {
  name?: string;
  email?: string;
  phone?: string;
  [k: string]: any;
}

export interface Session {
  id: string;
  candidate: CandidateInfo;
  resumeUrl?: string;
  resumeText?: string;
  questions?: Question[];
  answers?: AnswerRecord[];
  finalScore?: number;
  summary?: string;
  status?: "uploaded" | "ready" | "in_progress" | "completed";
  createdAt?: string;
}
