import { Router } from "express";
import { upload } from "../utils/fileUpload";
import { parseResumeController } from "../controllers/resumeController";

export const resumeRouter = Router();

// upload resume file (PDF or DOCX)
resumeRouter.post("/upload", upload.single("file"), parseResumeController);
