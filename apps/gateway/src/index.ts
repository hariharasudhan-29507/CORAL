import http from "node:http";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { Server } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "@coral/shared";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { attachSocketIdentity, type AuthedSocket } from "./middleware/auth.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { registerAiHandlers } from "./modules/ai/ai.handlers.js";
import { registerChatHandlers } from "./modules/chat/chat.handlers.js";
import { registerPresenceHandlers } from "./modules/presence/presence.handlers.js";
import { joinRoom, leaveAllRooms, leaveRoom } from "./modules/rooms/rooms.service.js";
import { registerSignalingHandlers } from "./modules/signaling/signaling.handlers.js";

const app = express();
const server = http.createServer(app);

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use("/auth", authRouter);

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "coral-gateway",
    time: new Date().toISOString(),
  });
});

const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: env.CORS_ORIGIN,
    credentials: true,
  },
});

io.on("connection", (socket) => {
  const authedSocket = socket as AuthedSocket;
  attachSocketIdentity(authedSocket);

  authedSocket.on("room:join", ({ roomId }) => {
    authedSocket.join(roomId);
    joinRoom(authedSocket.id, roomId);
    logger.info({ roomId, userId: authedSocket.userId }, "socket joined room");
  });

  authedSocket.on("room:leave", ({ roomId }) => {
    authedSocket.leave(roomId);
    leaveRoom(authedSocket.id, roomId);
  });

  authedSocket.on("disconnect", () => {
    leaveAllRooms(authedSocket.id);
  });

  registerChatHandlers(io, authedSocket);
  registerPresenceHandlers(io, authedSocket);
  registerSignalingHandlers(io, authedSocket);
  registerAiHandlers(io, authedSocket);
});

server.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "coral gateway listening");
});
