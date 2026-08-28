import { Router, type Response } from "express";
import { ZodError } from "zod";
import { verifyAuthToken } from "./auth.service.js";

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

authRouter.post("/register", (_req, res) =>
  res.status(410).json({
    error: "Registration is handled by Supabase Auth. Send a Supabase access token to /auth/me for gateway verification.",
  }),
);

authRouter.post("/login", (_req, res) =>
  res.status(410).json({
    error: "Login is handled by Supabase Auth. Send a Supabase access token to /auth/me for gateway verification.",
  }),
);

authRouter.get("/me", async (req, res) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
  const user = await verifyAuthToken(token);

  if (!user) {
    return res.status(401).json({ error: "Session expired. Please sign in again." });
  }

  return res.json({ user });
});
