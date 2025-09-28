import { Router } from "express";

export const demoRouter = Router();

demoRouter.get("/ping", (_req, res) => {
  const msg = process.env.PING_MESSAGE;
  res.json({ message: msg });
});
