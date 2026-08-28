import { randomUUID } from "node:crypto";
import { aiRequestSchema } from "@coral/shared";
import { createAssistantDraftStream } from "./ai.service.js";
export function registerAiHandlers(io, socket) {
    socket.on("ai:ask", async (payload) => {
        const parsed = aiRequestSchema.safeParse(payload);
        if (!parsed.success) {
            socket.emit("system:error", {
                code: "AI_REQUEST_INVALID",
                message: "AI request could not be processed.",
            });
            return;
        }
        try {
            const replyId = randomUUID();
            for await (const token of createAssistantDraftStream(parsed.data.prompt)) {
                io.to(parsed.data.conversationId).emit("ai:token", {
                    conversationId: parsed.data.conversationId,
                    replyId,
                    token,
                });
            }
            io.to(parsed.data.conversationId).emit("ai:done", {
                conversationId: parsed.data.conversationId,
                replyId,
            });
        }
        catch {
            socket.emit("system:error", {
                code: "AI_REQUEST_FAILED",
                message: "AI service is unavailable.",
            });
        }
    });
}
