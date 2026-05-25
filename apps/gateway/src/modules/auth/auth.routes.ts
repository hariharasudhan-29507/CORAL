import { Router, type Response } from "express";
import { ZodError } from "zod";
import { createUser, loginSchema, loginUser, registerSchema, verifySessionToken } from "./auth.service.js";

export const authRouter = Router();

function sendAuthError(res: Response, error: unknown) {
  if (error instanceof ZodError) {
    return res.status(400).json({ error: error.issues[0]?.message || "Invalid auth request." });
  }

  if (error instanceof Error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(500).json({ error: "Authentication failed." });
}

authRouter.post("/register", async (req, res) => {
  try {
    const payload = registerSchema.parse(req.body);
    const session = await createUser(payload);
    res.status(201).json(session);
  } catch (error) {
    sendAuthError(res, error);
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const payload = loginSchema.parse(req.body);
    const session = await loginUser(payload);
    res.json(session);
  } catch (error) {
    sendAuthError(res, error);
  }
});

authRouter.get("/me", (req, res) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
  const user = verifySessionToken(token);

  if (!user) {
    return res.status(401).json({ error: "Session expired. Please sign in again." });
  }

  return res.json({ user });
});
