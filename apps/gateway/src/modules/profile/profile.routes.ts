import { Router, type Request, type Response } from "express";
import { z, ZodError } from "zod";
import { getProfile, updateProfile } from "../../lib/supabaseAdmin.js";
import { verifyAuthToken } from "../auth/auth.service.js";

export const profileRouter = Router();

const updateProfileSchema = z.object({
  nickname: z.string().trim().min(1).max(120).optional(),
  username: z.string().trim().min(3).max(30).optional(),
  avatarUrl: z.string().url().optional(),
  bio: z.string().trim().max(280).optional(),
  accountVisibility: z.enum(["public", "private"]).optional(),
});

function sendProfileError(res: Response, error: unknown) {
  if (error instanceof ZodError) return res.status(400).json({ error: error.issues[0]?.message || "Invalid profile request." });
  if (error instanceof Error) return res.status(400).json({ error: error.message });
  return res.status(500).json({ error: "Profile request failed." });
}

async function readUser(req: Request) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
  return verifyAuthToken(token);
}

profileRouter.get("/me", async (req, res) => {
  try {
    const user = await readUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized." });
    const profile = await getProfile(user);
    return res.json({ profile });
  } catch (error) {
    return sendProfileError(res, error);
  }
});

profileRouter.patch("/me", async (req, res) => {
  try {
    const user = await readUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized." });
    const payload = updateProfileSchema.parse(req.body);
    const profile = await updateProfile(user, payload);
    return res.json({ profile });
  } catch (error) {
    return sendProfileError(res, error);
  }
});
