import "dotenv/config";
import express from "express";
import cors from "cors";
import { resumeRouter } from "./routes/resume";
import { interviewRouter } from "./routes/interview";
import { candidateRouter } from "./routes/candidate";
import { demoRouter } from "./routes/demo";

export function createServer() {
  const app = express();

  app.use(cors({origin: "*"}));
  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use((req, res, next) => {
    if (req.is('application/json') && req.body instanceof Buffer) {
      try {
        req.body = JSON.parse(req.body.toString('utf8'));
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON in request body' });
      }
    }
    next();
  });

  app.use("/api/demo", demoRouter);
  app.use("/api/resume", resumeRouter);
  app.use("/api/interview", interviewRouter);
  app.use("/api/candidates", candidateRouter);

  return app;
}
