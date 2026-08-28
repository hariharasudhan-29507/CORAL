import { Router } from "express";
import { z, ZodError } from "zod";
import { conversationIdSchema } from "@coral/shared";
import { createDmConversation, getChatMessagesByConversationId, listConversations, userCanAccessConversation, } from "../../lib/supabaseAdmin.js";
import { verifyAuthToken } from "../auth/auth.service.js";
export const conversationsRouter = Router();
const createDmSchema = z.object({
    targetUserId: z.string().uuid(),
});
function sendConversationError(res, error) {
    if (error instanceof ZodError) {
        return res.status(400).json({ error: error.issues[0]?.message || "Invalid conversation request." });
    }
    if (error instanceof Error)
        return res.status(400).json({ error: error.message });
    return res.status(500).json({ error: "Conversation request failed." });
}
async function readUser(req) {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
    return verifyAuthToken(token);
}
conversationsRouter.get("/", async (req, res) => {
    try {
        const user = await readUser(req);
        if (!user)
            return res.status(401).json({ error: "Unauthorized." });
        const payload = await listConversations(user);
        return res.json(payload);
    }
    catch (error) {
        return sendConversationError(res, error);
    }
});
conversationsRouter.post("/dm", async (req, res) => {
    try {
        const user = await readUser(req);
        if (!user)
            return res.status(401).json({ error: "Unauthorized." });
        const payload = createDmSchema.parse(req.body);
        const conversation = await createDmConversation(user, payload.targetUserId);
        return res.status(201).json({ conversation });
    }
    catch (error) {
        return sendConversationError(res, error);
    }
});
conversationsRouter.get("/:id/messages", async (req, res) => {
    try {
        const user = await readUser(req);
        if (!user)
            return res.status(401).json({ error: "Unauthorized." });
        const parsedConversation = conversationIdSchema.safeParse(req.params.id);
        if (!parsedConversation.success)
            throw parsedConversation.error;
        if (!(await userCanAccessConversation(user.id, parsedConversation.data))) {
            return res.status(403).json({ error: "You do not have access to this conversation." });
        }
        const messages = await getChatMessagesByConversationId({
            conversationId: parsedConversation.data,
            limit: 100,
        });
        return res.json({ messages });
    }
    catch (error) {
        return sendConversationError(res, error);
    }
});
