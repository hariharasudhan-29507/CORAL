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
import { callsRouter } from "./modules/calls/calls.routes.js";
import { chatRouter } from "./modules/chat/chat.routes.js";
import { conversationsRouter } from "./modules/conversations/conversations.routes.js";
import { friendsRouter } from "./modules/friends/friends.routes.js";
import { profileRouter } from "./modules/profile/profile.routes.js";
import { registerChatHandlers } from "./modules/chat/chat.handlers.js";
import { registerPresenceHandlers } from "./modules/presence/presence.handlers.js";
import { userCanAccessConversation } from "./lib/supabaseAdmin.js";
import { joinRoom, leaveAllRooms, leaveRoom } from "./modules/rooms/rooms.service.js";
import { registerSignalingHandlers } from "./modules/signaling/signaling.handlers.js";
import { registerTypingHandlers } from "./modules/typing/typing.handlers.js";

const app = express();
const server = http.createServer(app);

app.use(helmet());
app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      // Electron renderer often has `origin: null` or no origin depending on the URL scheme.
      if (!origin || origin === "null") return callback(null, true);

      if (origin === env.CORS_ORIGIN) return callback(null, true);

      // Allow local dev variants.
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);

      return callback(null, false);
    },
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use("/auth", authRouter);
app.use("/calls", callsRouter);
app.use("/chat", chatRouter);
app.use("/conversations", conversationsRouter);
app.use("/friends", friendsRouter);
app.use("/profile", profileRouter);

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "coral-gateway",
    time: new Date().toISOString(),
  });
});

const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    credentials: true,
    origin: (origin, callback) => {
      if (!origin || origin === "null") return callback(null, true);
      if (origin === env.CORS_ORIGIN) return callback(null, true);
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
      return callback(null, false);
    },
  },
});

io.on("connection", async (socket) => {
  const authedSocket = socket as AuthedSocket;
  await attachSocketIdentity(authedSocket);
  if (authedSocket.userId) authedSocket.join(`user:${authedSocket.userId}`);

  authedSocket.on("conversation:join", async ({ conversationId }) => {
    if (!authedSocket.userId || !(await userCanAccessConversation(authedSocket.userId, conversationId))) {
      authedSocket.emit("system:error", {
        code: "CONVERSATION_FORBIDDEN",
        message: "You do not have access to this conversation.",
      });
      return;
    }
    authedSocket.join(conversationId);
    joinRoom(authedSocket.id, conversationId);
    logger.info({ conversationId, userId: authedSocket.userId }, "socket joined conversation");
  });

  authedSocket.on("conversation:leave", ({ conversationId }) => {
    authedSocket.leave(conversationId);
    leaveRoom(authedSocket.id, conversationId);
  });

  authedSocket.on("disconnect", () => {
    leaveAllRooms(authedSocket.id);
  });

  registerChatHandlers(io, authedSocket);
  registerPresenceHandlers(io, authedSocket);
  registerSignalingHandlers(io, authedSocket);
  registerTypingHandlers(io, authedSocket);
});

server.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "coral gateway listening");
});
