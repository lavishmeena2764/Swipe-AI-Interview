import { Request, Response } from "express";
import { storage } from "../utils/storage";
import { interviewService } from "../services/interviewService";


export const updateCandidateController = async (req: Request, res: Response) => {
  try {
    const { sessionId, name, email, phone } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    const session = storage.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: "session not found" });
    }

    if (name) session.candidate.name = name;
    if (email) session.candidate.email = email;
    if (phone) session.candidate.phone = phone;

    storage.saveSession(sessionId, session);

    return res.status(200).json({ message: "Candidate details updated." });
  } catch (err: any) {
    console.error("updateCandidateController:", err);
    return res.status(500).json({ error: err?.message || "Failed to update details" });
  }
};

export const generateQuestionsController = async (req: Request, res: Response) => {
  try {
    const { sessionId, n = 6 } = req.body;
    if (!sessionId) return res.status(400).json({ error: "sessionId required" });

    const session = storage.getSession(sessionId);
    if (!session) return res.status(404).json({ error: "session not found" });
    const questions = await interviewService.generateQuestions(session, n);

    session.questions = questions;
    session.status = "ready";
    storage.saveSession(sessionId, session);

    return res.json({ sessionId, questions });
  } catch (err: any) {
    console.error("generateQuestionsController:", err);
    return res.status(500).json({ error: err?.message || "Failed to generate questions" });
  }
};

export const saveAnswerController = async (req: Request, res: Response) => {
  try {
    const { sessionId, questionId, answer } = req.body;
    if (!sessionId || !questionId) {
      return res.status(400).json({ error: "sessionId & questionId required" });
    }

    const session = storage.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: "session not found" });
    }

    if (!session.answers) {
      session.answers = [];
    }
    
    const question = (session.questions || []).find(q => q.id === questionId);
    if (!question) {
        return res.status(404).json({ error: `Question with id ${questionId} not found.` });
    }

    const existingAnswerIndex = session.answers.findIndex(a => a.questionId === questionId);

    if (existingAnswerIndex > -1) {
      session.answers[existingAnswerIndex].answer = answer;
    } else {
      session.answers.push({
        questionId: questionId,
        questionText: question.text,
        answer: answer,
        score: 0, 
        createdAt: new Date().toISOString(),
      });
    }

    storage.saveSession(sessionId, session);

    return res.status(200).json({ message: "Answer saved successfully." });
  } catch (err: any) {
    console.error("saveAnswerController:", err);
    return res.status(500).json({ error: err?.message || "Failed to save answer" });
  }
};

export const finalizeInterviewController = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    const session = storage.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: "session not found" });
    }

    const final = await interviewService.summarizeSession(session);
    session.finalScore = final.finalScore;
    session.summary = final.summary;
    session.status = "completed"; 
    storage.saveSession(sessionId, session);
    
    return res.json(final);
  } catch (err: any) {
    console.error("finalizeInterviewController:", err);
    return res.status(500).json({ error: err?.message || "Failed to finalize interview" });
  }
};

export const getSessionController = (req: Request, res: Response) => {
  const id = req.params.id;
  const s = storage.getSession(id);
  if (!s) return res.status(404).json({ error: "not found" });
  return res.json(s);
};
