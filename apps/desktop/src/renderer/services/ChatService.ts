import type { ChatMessage } from "@coral/shared";
import type { CoralSocket } from "./SocketService";

export class ChatService {
  constructor(private readonly socket: CoralSocket) {}

  join(roomId: string) {
    this.socket.emit("room:join", { roomId });
  }

  leave(roomId: string) {
    this.socket.emit("room:leave", { roomId });
  }

  send(message: Omit<ChatMessage, "id" | "createdAt">) {
    this.socket.emit("chat:send", message);
  }

  onMessage(handler: (message: ChatMessage) => void) {
    this.socket.on("chat:message", handler);
    return () => {
      this.socket.off("chat:message", handler);
    };
  }
}
