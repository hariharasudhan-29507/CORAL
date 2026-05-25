import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@coral/shared";
import type { SessionUser } from "./AuthService";

export type CoralSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function createSocket(user?: SessionUser | null, token?: string | null) {
  const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

  return io(socketUrl, {
    autoConnect: false,
    reconnection: true,
    auth: {
      token,
      userId: user?.id || "user-you",
      userName: user?.name || "You",
    },
  }) as CoralSocket;
}
