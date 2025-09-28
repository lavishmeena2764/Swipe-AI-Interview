import "dotenv/config";
import express from "express";
import cors from "cors";
import { resumeRouter } from "./routes/resume";
import { interviewRouter } from "./routes/interview";
import { candidateRouter } from "./routes/candidate";
import { demoRouter } from "./routes/demo";
import { fileURLToPath } from 'url';

export function createServer() {
  const app = express();

  app.use(cors({origin: "*"}));
  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use("/api/demo", demoRouter);
  app.use("/api/resume", resumeRouter);
  app.use("/api/interview", interviewRouter);
  app.use("/api/candidates", candidateRouter);

  return app;
}

const isMainModule = (metaUrl: string) => {
  const modulePath = fileURLToPath(metaUrl);
  return process.argv[1] === modulePath;
};

if (isMainModule(import.meta.url)) {
  const port = process.env.PORT || 3001;
  const app = createServer();
  app.listen(port, () => console.log(`Server listening on ${port}`));
}