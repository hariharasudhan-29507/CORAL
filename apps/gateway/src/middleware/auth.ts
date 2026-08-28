import type { Socket } from "socket.io";
import { verifyAuthToken } from "../modules/auth/auth.service.js";

export type AuthedSocket = Socket & {
  userId?: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
};

export async function attachSocketIdentity(socket: AuthedSocket) {
  const auth = socket.handshake.auth as { token?: string };
  const user = await verifyAuthToken(auth.token);

  if (!user) {
    socket.disconnect(true);
    return;
  }

  socket.userId = user.id;
  socket.userName = user.name;
  socket.userEmail = user?.email;
  socket.userPhone = user?.phone;
}
