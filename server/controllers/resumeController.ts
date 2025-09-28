import "dotenv/config";
import { Request, Response } from "express";
import { v2 as cloudinary } from 'cloudinary'
import fs from "fs";
import { extractTextFromFile, extractFieldsWithGemini } from "../services/resumeService";
import { storage } from "../utils/storage";
import { v4 as uuidv4 } from "uuid";
import { Session } from "../models/candidate";

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

export const parseResumeController = async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: "No file uploaded" });
  const filePath = req.file.path
  try {
    const uploadResult = await cloudinary.uploader.upload(file.path, {
      resource_type: "auto",
      folder: "interview_resumes",
      use_filename: true,
      unique_filename: false,
    });
    const rawText = await extractTextFromFile(filePath, file.mimetype, file.originalname);
    const extracted = await extractFieldsWithGemini(rawText);

    const sessionId = uuidv4();
    const session: Session = {
      id: sessionId,
      candidate: extracted,
      resumeUrl: uploadResult.secure_url,
      resumeText: rawText,
      questions: [],
      answers: [],
      createdAt: new Date().toISOString(),
      status: "uploaded",
    };

    storage.saveSession(sessionId, session);

    return res.json({ sessionId, candidate: extracted, resumeUrl: uploadResult.secure_url });
  } catch (err: any) {
    console.error("parseResumeController:", err);
    return res.status(500).json({ error: err?.message || "Failed to parse resume" });
  } finally {
    try {
      fs.unlinkSync(filePath);
    } catch (cleanupError) {
      console.error(`Error cleaning up temporary file: ${filePath}`, cleanupError);
    }
  }
};
