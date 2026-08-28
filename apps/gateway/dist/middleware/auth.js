import { verifyAuthToken } from "../modules/auth/auth.service.js";
export async function attachSocketIdentity(socket) {
    const auth = socket.handshake.auth;
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
