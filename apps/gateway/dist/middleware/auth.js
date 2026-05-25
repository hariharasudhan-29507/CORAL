import { verifySessionToken } from "../modules/auth/auth.service.js";
export function attachSocketIdentity(socket) {
    const auth = socket.handshake.auth;
    const user = verifySessionToken(auth.token);
    socket.userId = user?.id || auth.userId || `guest-${socket.id}`;
    socket.userName = user?.name || auth.userName || "Guest";
    socket.userEmail = user?.email;
    socket.userPhone = user?.phone;
}
