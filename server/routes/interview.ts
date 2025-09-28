import { Router } from "express";
import {
  updateCandidateController,
  generateQuestionsController,
  finalizeInterviewController,
  saveAnswerController,
  getSessionController,
} from "../controllers/interviewController";

export const interviewRouter = Router();

// Update candidate details (name, email, phone)
interviewRouter.patch("/candidate", updateCandidateController);

// Generate questions from resume / session
interviewRouter.post("/generate", generateQuestionsController);

// Score interview
interviewRouter.post("/finalize", finalizeInterviewController);

// Save answer
interviewRouter.post("/answer", saveAnswerController);

// Get session info
interviewRouter.get("/session/:id", getSessionController);
