import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { resumeRouter } from "./routes/resume";
import { interviewRouter } from "./routes/interview";
import { candidateRouter } from "./routes/candidate";
import { demoRouter } from "./routes/demo";

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createServer() {
  const app = express();

  app.use(cors({origin: "*"}));
  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use("/public", express.static(path.join(__dirname, "public")));

  app.use("/api/demo", demoRouter);
  app.use("/api/resume", resumeRouter);
  app.use("/api/interview", interviewRouter);
  app.use("/api/candidates", candidateRouter);

  return app;
}

const isMainModule = process.argv[1] === __filename;
if (isMainModule) {
  const port = process.env.PORT;
  const app = createServer();
  app.listen(port, () => console.log(`Server listening on ${port}`));
}