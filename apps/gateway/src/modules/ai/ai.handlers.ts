import { randomUUID } from "node:crypto";
import type { Server } from "socket.io";
import { aiRequestSchema, type ClientToServerEvents, type ServerToClientEvents } from "@coral/shared";
import type { AuthedSocket } from "../../middleware/auth.js";
import { createAssistantDraftStream } from "./ai.service.js";

type CoralServer = Server<ClientToServerEvents, ServerToClientEvents>;

export function registerAiHandlers(io: CoralServer, socket: AuthedSocket) {
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
        io.to(parsed.data.roomId).emit("ai:token", {
          roomId: parsed.data.roomId,
          replyId,
          token,
        });
      }

      io.to(parsed.data.roomId).emit("ai:done", {
        roomId: parsed.data.roomId,
        replyId,
      });
    } catch {
      socket.emit("system:error", {
        code: "AI_REQUEST_FAILED",
        message: "AI service is unavailable.",
      });
    }
  });
}
