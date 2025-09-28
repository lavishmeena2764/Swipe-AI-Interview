import { Request, Response } from "express";
import { storage } from "../utils/storage";

export const listCandidatesController = async (_req: Request, res: Response) => {
  const all = await storage.listSessions();
  console.log(all);
  const summary = all.map((s) => ({
    id: s.id,
    name: s.candidate?.name || "Unknown",
    email: s.candidate?.email || "",
    phone: s.candidate?.phone || "",
    finalScore: s.finalScore ?? null,
    summary: s.summary || null,
    status: s.status ?? "uploaded",
    createdAt: s.createdAt,
  }));
  summary.sort((a, b) => {
    if (a.finalScore == null && b.finalScore == null) return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (a.finalScore == null) return 1;
    if (b.finalScore == null) return -1;
    return (b.finalScore as number) - (a.finalScore as number);
  });
  res.json(summary);
};

export const getCandidateController = async (req: Request, res: Response) => {
  const id = req.params.id;
  const s = await storage.getSession(id);
  if (!s) return res.status(404).json({ error: "not found" });
  res.json(s);
};
