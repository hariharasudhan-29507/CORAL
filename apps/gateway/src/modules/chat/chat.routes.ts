import { Router, type Response } from "express";
import { ZodError } from "zod";
import { conversationIdSchema } from "@coral/shared";
import { verifyAuthToken } from "../auth/auth.service.js";
import { getChatMessagesByConversationId, userCanAccessConversation } from "../../lib/supabaseAdmin.js";

export const chatRouter = Router();

function sendChatError(res: Response, error: unknown) {
  if (error instanceof ZodError) {
    return res.status(400).json({ error: error.issues[0]?.message || "Invalid request." });
  }

  if (error instanceof Error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(500).json({ error: "Chat request failed." });
}

chatRouter.get("/history", async (req, res) => {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
    const user = await verifyAuthToken(token);

    if (!user) return res.status(401).json({ error: "Unauthorized." });

    const rawConversationId = req.query.conversationId ?? req.query.roomId;
    const conversationId = typeof rawConversationId === "string" ? rawConversationId : "";
    const parsedConversation = conversationIdSchema.safeParse(conversationId);
    if (!parsedConversation.success) throw parsedConversation.error;

    if (!(await userCanAccessConversation(user.id, parsedConversation.data))) {
      return res.status(403).json({ error: "You do not have access to this conversation." });
    }

    const messages = await getChatMessagesByConversationId({
      conversationId: parsedConversation.data,
      limit: 100,
    });

    return res.json({ messages });
  } catch (error) {
    return sendChatError(res, error);
  }
});
