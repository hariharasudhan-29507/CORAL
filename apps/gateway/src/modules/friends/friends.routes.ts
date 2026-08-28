import { Router, type Request, type Response } from "express";
import { z, ZodError } from "zod";
import {
  listFriends,
  listFriendRequests,
  removeFriend,
  requestFriendByUsername,
  respondToFriendRequest,
  searchProfileByUsername,
  setFavoriteFriend,
} from "../../lib/supabaseAdmin.js";
import { verifyAuthToken } from "../auth/auth.service.js";

export const friendsRouter = Router();

const usernameSchema = z.string().trim().min(3).max(30);
const friendRequestSchema = z.object({
  username: usernameSchema,
  message: z.string().trim().max(500).optional(),
});
const favoriteSchema = z.object({
  favorite: z.boolean(),
});
const respondSchema = z.object({
  action: z.enum(["accept", "decline"]),
});

function sendFriendError(res: Response, error: unknown) {
  if (error instanceof ZodError) {
    return res.status(400).json({ error: error.issues[0]?.message || "Invalid friend request." });
  }
  if (error instanceof Error) return res.status(400).json({ error: error.message });
  return res.status(500).json({ error: "Friend request failed." });
}

async function readUser(req: Request) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
  return verifyAuthToken(token);
}

friendsRouter.get("/", async (req, res) => {
  try {
    const user = await readUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized." });
    return res.json(await listFriends(user));
  } catch (error) {
    return sendFriendError(res, error);
  }
});

friendsRouter.get("/requests", async (req, res) => {
  try {
    const user = await readUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized." });
    return res.json(await listFriendRequests(user));
  } catch (error) {
    return sendFriendError(res, error);
  }
});

friendsRouter.get("/search", async (req, res) => {
  try {
    const user = await readUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized." });
    const username = usernameSchema.parse(String(req.query.username ?? ""));
    return res.json(await searchProfileByUsername(user, username));
  } catch (error) {
    return sendFriendError(res, error);
  }
});

friendsRouter.post("/request", async (req, res) => {
  try {
    const user = await readUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized." });
    const payload = friendRequestSchema.parse(req.body);
    return res.status(201).json(await requestFriendByUsername(user, payload.username, payload.message));
  } catch (error) {
    return sendFriendError(res, error);
  }
});

friendsRouter.post("/requests/:id/respond", async (req, res) => {
  try {
    const user = await readUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized." });
    const payload = respondSchema.parse(req.body);
    return res.json(await respondToFriendRequest(user, req.params.id, payload.action));
  } catch (error) {
    return sendFriendError(res, error);
  }
});

friendsRouter.patch("/:id/favorite", async (req, res) => {
  try {
    const user = await readUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized." });
    const payload = favoriteSchema.parse(req.body);
    return res.json(await setFavoriteFriend(user, req.params.id, payload.favorite));
  } catch (error) {
    return sendFriendError(res, error);
  }
});

friendsRouter.delete("/:id", async (req, res) => {
  try {
    const user = await readUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized." });
    return res.json(await removeFriend(user, req.params.id));
  } catch (error) {
    return sendFriendError(res, error);
  }
});
