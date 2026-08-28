import type { ChatMessage, DeleteMessagePayload, ReactionPayload } from "@coral/shared";
import type { CoralSocket } from "./SocketService";

export class ChatService {
  constructor(private readonly socket: CoralSocket, private readonly token: string | null) {}

  join(conversationId: string) {
    this.socket.emit("conversation:join", { conversationId });
  }

  leave(conversationId: string) {
    this.socket.emit("conversation:leave", { conversationId });
  }

  send(message: Omit<ChatMessage, "id" | "createdAt" | "deliveryStatus"> & Partial<Pick<ChatMessage, "deliveryStatus">>) {
    this.socket.emit("chat:send", message);
  }

  sendReaction(payload: ReactionPayload) {
    this.socket.emit("chat:reaction", payload);
  }

  deleteMessage(payload: DeleteMessagePayload) {
    this.socket.emit("chat:delete", payload);
  }

  onMessage(handler: (message: ChatMessage) => void) {
    this.socket.on("chat:message", handler);
    return () => {
      this.socket.off("chat:message", handler);
    };
  }

  onReaction(handler: (payload: ReactionPayload) => void) {
    this.socket.on("chat:reaction", handler);
    return () => {
      this.socket.off("chat:reaction", handler);
    };
  }

  onDelete(handler: (payload: DeleteMessagePayload) => void) {
    this.socket.on("chat:delete", handler);
    return () => {
      this.socket.off("chat:delete", handler);
    };
  }

  private get apiBaseUrl() {
    const apiUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_SOCKET_URL) as string | undefined;
    if (!apiUrl) throw new Error("VITE_API_URL is required before loading chat data.");
    return apiUrl;
  }

  async fetchHistory(conversationId: string): Promise<ChatMessage[]> {
    const response = await fetch(`${this.apiBaseUrl}/conversations/${encodeURIComponent(conversationId)}/messages`, {
      headers: {
        Authorization: this.token ? `Bearer ${this.token}` : "",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to load chat history (${response.status}).`);
    }

    const payload = (await response.json()) as { messages: ChatMessage[] };
    return payload.messages;
  }
}
