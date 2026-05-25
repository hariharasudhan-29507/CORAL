import { presenceSchema } from "@coral/shared";
export function registerPresenceHandlers(io, socket) {
    socket.on("presence:set", (payload) => {
        const parsed = presenceSchema.safeParse({
            userId: socket.userId,
            roomId: payload.roomId,
            status: payload.status,
            updatedAt: new Date().toISOString(),
        });
        if (!parsed.success)
            return;
        if (parsed.data.roomId)
            io.to(parsed.data.roomId).emit("presence:update", parsed.data);
        else
            io.emit("presence:update", parsed.data);
    });
}
