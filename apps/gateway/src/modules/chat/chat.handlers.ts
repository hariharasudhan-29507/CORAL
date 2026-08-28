import type { Server } from "socket.io";
import {
  chatMessageSchema,
  reactionPayloadSchema,
  deleteMessagePayloadSchema,
  type ClientToServerEvents,
  type ServerToClientEvents,
} from "@coral/shared";
import type { AuthedSocket } from "../../middleware/auth.js";
import {
  insertChatMessage,
  updateMessageReaction,
  deleteChatMessage,
  userCanAccessConversation,
} from "../../lib/supabaseAdmin.js";

type CoralServer = Server<ClientToServerEvents, ServerToClientEvents>;

export function registerChatHandlers(io: CoralServer, socket: AuthedSocket) {
  socket.on("chat:send", async (payload) => {
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

    const createdAt = new Date().toISOString();

    if (!socket.userId || !(await userCanAccessConversation(socket.userId, parsed.data.conversationId))) {
      socket.emit("system:error", {
        code: "CHAT_CONVERSATION_FORBIDDEN",
        message: "You do not have access to this conversation.",
      });
      return;
    }

    try {
      const persisted = await insertChatMessage({
        conversationId: parsed.data.conversationId,
        senderId: socket.userId,
        senderName: socket.userName ?? parsed.data.senderName,
        body: parsed.data.body,
        kind: parsed.data.kind,
        createdAtIso: createdAt,
        mediaUrl: parsed.data.mediaUrl,
        mediaType: parsed.data.mediaType,
        audioDuration: parsed.data.audioDuration,
        audioWaveform: parsed.data.audioWaveform,
        reactions: parsed.data.reactions,
        replyTo: parsed.data.replyTo,
      });
      io.to(parsed.data.conversationId).emit("chat:message", persisted);
    } catch (error) {
      socket.emit("system:error", {
        code: "CHAT_PERSIST_FAILED",
        message: error instanceof Error ? error.message : "Message could not be saved.",
      });
      return;
    }
  });

  socket.on("chat:reaction", async (payload) => {
    const parsed = reactionPayloadSchema.safeParse({
      ...payload,
      userId: socket.userId,
    });

    if (!parsed.success) return;

    if (!socket.userId || !(await userCanAccessConversation(socket.userId, parsed.data.conversationId))) {
      return;
    }

    try {
      await updateMessageReaction({
        messageId: parsed.data.messageId,
        userId: socket.userId,
        emoji: parsed.data.emoji,
      });
      io.to(parsed.data.conversationId).emit("chat:reaction", parsed.data);
    } catch {
      // Non-fatal
    }
  });

  socket.on("chat:delete", async (payload) => {
    const parsed = deleteMessagePayloadSchema.safeParse({
      ...payload,
      userId: socket.userId,
    });

    if (!parsed.success) return;

    if (!socket.userId || !(await userCanAccessConversation(socket.userId, parsed.data.conversationId))) {
      return;
    }

    try {
      await deleteChatMessage({
        messageId: parsed.data.messageId,
        userId: socket.userId,
      });
      io.to(parsed.data.conversationId).emit("chat:delete", parsed.data);
    } catch {
      // Non-fatal
    }
  });
}
