import type { Server } from "socket.io";
import { typingStartStopSchema, type ClientToServerEvents, type ServerToClientEvents } from "@coral/shared";
import type { AuthedSocket } from "../../middleware/auth.js";

type CoralServer = Server<ClientToServerEvents, ServerToClientEvents>;

export function registerTypingHandlers(io: CoralServer, socket: AuthedSocket) {
  socket.on("typing:start", (payload) => {
    const parsed = typingStartStopSchema.safeParse(payload);
    if (!parsed.success) return;
    if (!socket.userId) return;

    io.to(parsed.data.conversationId).emit("typing:update", {
      userId: socket.userId,
      conversationId: parsed.data.conversationId,
      isTyping: true,
      updatedAt: new Date().toISOString(),
    });
  });

  socket.on("typing:stop", (payload) => {
    const parsed = typingStartStopSchema.safeParse(payload);
    if (!parsed.success) return;
    if (!socket.userId) return;

    io.to(parsed.data.conversationId).emit("typing:update", {
      userId: socket.userId,
      conversationId: parsed.data.conversationId,
      isTyping: false,
      updatedAt: new Date().toISOString(),
    });
  });
}
