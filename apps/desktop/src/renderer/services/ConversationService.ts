import type { Conversation, ConversationParticipant } from "@coral/shared";

export type ConversationWithParticipants = Conversation & {
  participants: ConversationParticipant[];
};

export class ConversationService {
  constructor(private readonly token: string | null) {}

  private get apiBaseUrl() {
    const apiUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_SOCKET_URL) as string | undefined;
    if (!apiUrl) throw new Error("VITE_API_URL is required before loading conversations.");
    return apiUrl;
  }

  private get headers() {
    return {
      "Content-Type": "application/json",
      Authorization: this.token ? `Bearer ${this.token}` : "",
    };
  }

  async list(): Promise<ConversationWithParticipants[]> {
    const response = await fetch(`${this.apiBaseUrl}/conversations`, {
      headers: this.headers,
    });

    if (!response.ok) throw new Error(`Failed to load conversations (${response.status}).`);
    const payload = (await response.json()) as { conversations: ConversationWithParticipants[] };
    return payload.conversations;
  }

  async createDm(targetUserId: string): Promise<Conversation> {
    const response = await fetch(`${this.apiBaseUrl}/conversations/dm`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({ targetUserId }),
    });

    if (!response.ok) throw new Error(`Failed to create direct message (${response.status}).`);
    const payload = (await response.json()) as { conversation: Conversation };
    return payload.conversation;
  }
}
