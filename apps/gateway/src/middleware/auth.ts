import type { Socket } from "socket.io";
import { verifySessionToken } from "../modules/auth/auth.service.js";

export type AuthedSocket = Socket & {
  userId?: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
};

export function attachSocketIdentity(socket: AuthedSocket) {
  const auth = socket.handshake.auth as { token?: string; userId?: string; userName?: string };
  const user = verifySessionToken(auth.token);

  socket.userId = user?.id || auth.userId || `guest-${socket.id}`;
  socket.userName = user?.name || auth.userName || "Guest";
  socket.userEmail = user?.email;
  socket.userPhone = user?.phone;
}
