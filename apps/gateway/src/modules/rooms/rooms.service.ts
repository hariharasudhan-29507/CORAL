const socketRooms = new Map<string, Set<string>>();

export function joinRoom(socketId: string, roomId: string) {
  const members = socketRooms.get(roomId) ?? new Set<string>();
  members.add(socketId);
  socketRooms.set(roomId, members);
  return members.size;
}

export function leaveRoom(socketId: string, roomId: string) {
  const members = socketRooms.get(roomId);
  if (!members) return 0;
  members.delete(socketId);
  if (members.size === 0) socketRooms.delete(roomId);
  return members.size;
}

export function leaveAllRooms(socketId: string) {
  for (const [roomId, members] of socketRooms.entries()) {
    members.delete(socketId);
    if (members.size === 0) socketRooms.delete(roomId);
  }
}
