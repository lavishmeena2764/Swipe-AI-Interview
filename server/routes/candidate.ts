import { Router } from "express";
import {
  listCandidatesController,
  getCandidateController,
} from "../controllers/candidateController";

export const candidateRouter = Router();

// list all candidate sessions (summary info)
candidateRouter.get("/", listCandidatesController);

// get full session
candidateRouter.get("/:id", getCandidateController);
