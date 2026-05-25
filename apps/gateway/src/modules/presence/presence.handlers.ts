import type { Server } from "socket.io";
import { presenceSchema, type ClientToServerEvents, type ServerToClientEvents } from "@coral/shared";
import type { AuthedSocket } from "../../middleware/auth.js";

type CoralServer = Server<ClientToServerEvents, ServerToClientEvents>;

export function registerPresenceHandlers(io: CoralServer, socket: AuthedSocket) {
  socket.on("presence:set", (payload) => {
    const parsed = presenceSchema.safeParse({
      userId: socket.userId,
      roomId: payload.roomId,
      status: payload.status,
      updatedAt: new Date().toISOString(),
    });

    if (!parsed.success) return;
    if (parsed.data.roomId) io.to(parsed.data.roomId).emit("presence:update", parsed.data);
    else io.emit("presence:update", parsed.data);
  });
}
