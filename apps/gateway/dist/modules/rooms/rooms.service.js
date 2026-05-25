const socketRooms = new Map();
export function joinRoom(socketId, roomId) {
    const members = socketRooms.get(roomId) ?? new Set();
    members.add(socketId);
    socketRooms.set(roomId, members);
    return members.size;
}
export function leaveRoom(socketId, roomId) {
    const members = socketRooms.get(roomId);
    if (!members)
        return 0;
    members.delete(socketId);
    if (members.size === 0)
        socketRooms.delete(roomId);
    return members.size;
}
export function leaveAllRooms(socketId) {
    for (const [roomId, members] of socketRooms.entries()) {
        members.delete(socketId);
        if (members.size === 0)
            socketRooms.delete(roomId);
    }
}
