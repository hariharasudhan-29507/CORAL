import { signalingPayloadSchema, } from "@coral/shared";
export function registerSignalingHandlers(io, socket) {
    socket.on("signal:offer", (payload) => relay(io, socket, "signal:offer", payload));
    socket.on("signal:answer", (payload) => relay(io, socket, "signal:answer", payload));
    socket.on("signal:ice-candidate", (payload) => relay(io, socket, "signal:ice-candidate", payload));
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
    socket.to(parsed.data.roomId).emit(event, parsed.data);
}
