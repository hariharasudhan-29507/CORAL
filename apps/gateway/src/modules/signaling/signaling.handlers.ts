import type { Server } from "socket.io";
import {
  signalingPayloadSchema,
  type ClientToServerEvents,
  type ServerToClientEvents,
} from "@coral/shared";
import type { AuthedSocket } from "../../middleware/auth.js";

type CoralServer = Server<ClientToServerEvents, ServerToClientEvents>;

export function registerSignalingHandlers(io: CoralServer, socket: AuthedSocket) {
  socket.on("signal:offer", (payload) => relay(io, socket, "signal:offer", payload));
  socket.on("signal:answer", (payload) => relay(io, socket, "signal:answer", payload));
  socket.on("signal:ice-candidate", (payload) => relay(io, socket, "signal:ice-candidate", payload));
}

function relay(
  io: CoralServer,
  socket: AuthedSocket,
  event: "signal:offer" | "signal:answer" | "signal:ice-candidate",
  payload: unknown,
) {
  const parsed = signalingPayloadSchema.safeParse({
    ...(payload as object),
    fromUserId: socket.userId,
  });

  if (!parsed.success) {
    socket.emit("system:error", {
      code: "SIGNAL_INVALID",
      message: "Call signaling payload was rejected.",
    });
    return;
  }

  socket.to(parsed.data.roomId).emit(event, parsed.data);
}
