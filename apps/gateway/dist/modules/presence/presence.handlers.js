import { presenceSchema } from "@coral/shared";
import { updatePresence } from "../../lib/supabaseAdmin.js";
export function registerPresenceHandlers(io, socket) {
    socket.on("presence:set", (payload) => {
        const parsed = presenceSchema.safeParse({
            userId: socket.userId,
            conversationId: payload.conversationId,
            status: payload.status,
            updatedAt: new Date().toISOString(),
        });
        if (!parsed.success)
            return;
        void updatePresence(parsed.data).catch(() => {
            socket.emit("system:error", {
                code: "PRESENCE_SAVE_FAILED",
                message: "Presence could not be saved.",
            });
        });
        if (parsed.data.conversationId)
            io.to(parsed.data.conversationId).emit("presence:update", parsed.data);
        else
            io.emit("presence:update", parsed.data);
    });
}
