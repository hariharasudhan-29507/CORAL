import { randomUUID } from "node:crypto";
import type { Server } from "socket.io";
import { chatMessageSchema, type ClientToServerEvents, type ServerToClientEvents } from "@coral/shared";
import type { AuthedSocket } from "../../middleware/auth.js";

type CoralServer = Server<ClientToServerEvents, ServerToClientEvents>;

export function registerChatHandlers(io: CoralServer, socket: AuthedSocket) {
  socket.on("chat:send", (payload) => {
    const parsed = chatMessageSchema
      .omit({ id: true, createdAt: true })
      .safeParse({
        ...payload,
        senderId: socket.userId,
        senderName: socket.userName,
      });

    if (!parsed.success) {
      socket.emit("system:error", {
        code: "CHAT_MESSAGE_INVALID",
        message: "Message could not be sent.",
      });
      return;
    }

    io.to(parsed.data.roomId).emit("chat:message", {
      ...parsed.data,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    });
  });
}
