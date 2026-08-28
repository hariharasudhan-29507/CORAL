import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@coral/shared";
import type { SessionUser } from "./AuthService";

export type CoralSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function createSocket(user?: SessionUser | null, token?: string | null) {
  const socketUrl = import.meta.env.VITE_SOCKET_URL as string | undefined;
  if (!socketUrl) throw new Error("VITE_SOCKET_URL is required before opening a realtime connection.");
  if (!user || !token) throw new Error("A verified session is required before opening a realtime connection.");

  return io(socketUrl, {
    autoConnect: false,
    reconnection: true,
    auth: {
      token,
    },
  }) as CoralSocket;
}
