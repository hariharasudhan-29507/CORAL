import type { AiRequest, AiStreamDone, AiStreamToken, ChatMessage } from "@coral/shared";
import type { CoralSocket } from "./SocketService";

type StreamHandlers = {
  onToken: (payload: AiStreamToken) => void;
  onDone: (payload: AiStreamDone) => void;
  onError?: (message: string) => void;
};

export class AIService {
  constructor(private readonly socket: CoralSocket) {}

  ask(request: AiRequest) {
    this.socket.emit("ai:ask", request);
  }

  stream(handlers: StreamHandlers) {
    const handleError = (payload: { code: string; message: string }) => {
      if (payload.code.startsWith("AI_")) handlers.onError?.(payload.message);
    };

    this.socket.on("ai:token", handlers.onToken);
    this.socket.on("ai:done", handlers.onDone);
    this.socket.on("system:error", handleError);

    return () => {
      this.socket.off("ai:token", handlers.onToken);
      this.socket.off("ai:done", handlers.onDone);
      this.socket.off("system:error", handleError);
    };
  }

  createLocalFallback(prompt: string, context: ChatMessage[]) {
    const trimmedPrompt = prompt.trim();
    const latestContext = context
      .slice(-3)
      .map((message) => `${message.senderName}: ${message.body}`)
      .join(" ");

    return `Local Coral draft: ${trimmedPrompt || "No prompt provided."}${
      latestContext ? ` Context: ${latestContext}` : ""
    }`;
  }
}
