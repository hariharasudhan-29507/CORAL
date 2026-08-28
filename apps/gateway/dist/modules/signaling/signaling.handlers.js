import { callInviteSchema, signalingPayloadSchema, } from "@coral/shared";
import { listConversationParticipantIds, recordCallAccepted, recordCallEnded, recordCallInvite, userCanAccessConversation, } from "../../lib/supabaseAdmin.js";
export function registerSignalingHandlers(io, socket) {
    socket.on("signal:offer", (payload) => relay(io, socket, "signal:offer", payload));
    socket.on("signal:answer", (payload) => relay(io, socket, "signal:answer", payload));
    socket.on("signal:ice-candidate", (payload) => relay(io, socket, "signal:ice-candidate", payload));
    socket.on("call:invite", (payload) => relayCall(io, socket, "call:invite", payload));
    socket.on("call:accept", (payload) => relayCall(io, socket, "call:accept", payload));
    socket.on("call:end", (payload) => relayCall(io, socket, "call:end", payload));
}
function relay(io, socket, event, payload) {
    const parsed = signalingPayloadSchema.safeParse({
        ...payload,
        fromUserId: socket.userId,
    });
    if (!parsed.success) {
        socket.emit("system:error", {
            code: "SIGNAL_INVALID",
            message: "Call signaling payload was rejected.",
        });
        return;
    }
    if (!socket.userId) {
        socket.emit("system:error", {
            code: "SIGNAL_UNAUTHORIZED",
            message: "Sign in again before starting a call.",
        });
        return;
    }
    void userCanAccessConversation(socket.userId, parsed.data.conversationId)
        .then(async (allowed) => {
        if (!allowed) {
            socket.emit("system:error", {
                code: "SIGNAL_FORBIDDEN",
                message: "You do not have access to this conversation.",
            });
            return;
        }
        const participantIds = await listConversationParticipantIds(parsed.data.conversationId);
        const rooms = [
            parsed.data.conversationId,
            ...participantIds.filter((userId) => userId !== socket.userId).map((userId) => `user:${userId}`),
        ];
        io.to(rooms).except(socket.id).emit(event, parsed.data);
    })
        .catch((error) => {
        socket.emit("system:error", {
            code: "SIGNAL_CHECK_FAILED",
            message: error instanceof Error ? error.message : "Call signaling failed.",
        });
    });
}
function relayCall(io, socket, event, payload) {
    const parsed = callInviteSchema.safeParse({
        ...payload,
        fromUserId: socket.userId,
    });
    if (!parsed.success) {
        socket.emit("system:error", {
            code: "CALL_SIGNAL_INVALID",
            message: "Call payload was rejected.",
        });
        return;
    }
    if (!socket.userId) {
        socket.emit("system:error", {
            code: "CALL_UNAUTHORIZED",
            message: "Sign in again before starting a call.",
        });
        return;
    }
    const userId = socket.userId;
    void userCanAccessConversation(userId, parsed.data.conversationId)
        .then(async (allowed) => {
        if (!allowed) {
            socket.emit("system:error", {
                code: "CALL_FORBIDDEN",
                message: "You do not have access to this conversation.",
            });
            return;
        }
        if (event === "call:invite") {
            await recordCallInvite({
                conversationId: parsed.data.conversationId,
                callerId: userId,
                mode: parsed.data.mode,
            });
        }
        if (event === "call:accept") {
            await recordCallAccepted({
                conversationId: parsed.data.conversationId,
                acceptedByUserId: userId,
            });
        }
        if (event === "call:end") {
            await recordCallEnded({
                conversationId: parsed.data.conversationId,
                endedByUserId: userId,
            });
        }
        socket.to(parsed.data.conversationId).emit(event, parsed.data);
    })
        .catch((error) => {
        socket.emit("system:error", {
            code: "CALL_CHECK_FAILED",
            message: error instanceof Error ? error.message : "Call signaling failed.",
        });
    });
}
