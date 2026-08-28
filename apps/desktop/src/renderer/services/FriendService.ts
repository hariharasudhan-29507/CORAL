import type { Friend, FriendRequest, Profile } from "@coral/shared";

type SearchResult = {
  profile: Profile | null;
  relationship: "none" | "friend" | "requested" | "pending_response";
  favorite?: boolean;
};

export class FriendService {
  constructor(private readonly token: string | null) {}

  private get apiBaseUrl() {
    const apiUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_SOCKET_URL) as string | undefined;
    if (!apiUrl) throw new Error("VITE_API_URL is required before loading friend data.");
    return apiUrl;
  }

  private get headers() {
    return {
      "Content-Type": "application/json",
      Authorization: this.token ? `Bearer ${this.token}` : "",
    };
  }

  async list(): Promise<Friend[]> {
    const response = await fetch(`${this.apiBaseUrl}/friends`, { headers: this.headers });
    if (!response.ok) throw new Error(`Failed to load friends (${response.status}).`);
    const payload = (await response.json()) as { friends: Friend[] };
    return payload.friends;
  }

  async requests(): Promise<{ incoming: FriendRequest[]; outgoing: FriendRequest[] }> {
    const response = await fetch(`${this.apiBaseUrl}/friends/requests`, { headers: this.headers });
    if (!response.ok) throw new Error(`Failed to load friend requests (${response.status}).`);
    return (await response.json()) as { incoming: FriendRequest[]; outgoing: FriendRequest[] };
  }

  async search(username: string): Promise<SearchResult> {
    const response = await fetch(`${this.apiBaseUrl}/friends/search?username=${encodeURIComponent(username)}`, {
      headers: this.headers,
    });
    if (!response.ok) throw new Error(`Failed to search username (${response.status}).`);
    return (await response.json()) as SearchResult;
  }

  async request(username: string) {
    const response = await fetch(`${this.apiBaseUrl}/friends/request`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({ username }),
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error || `Failed to add friend (${response.status}).`);
    }
    return (await response.json()) as { status: "accepted" | "pending"; profile?: Profile; request?: FriendRequest };
  }

  async respond(requestId: string, action: "accept" | "decline") {
    const response = await fetch(`${this.apiBaseUrl}/friends/requests/${requestId}/respond`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({ action }),
    });
    if (!response.ok) throw new Error(`Failed to respond to friend request (${response.status}).`);
  }

  async favorite(friendId: string, favorite: boolean) {
    const response = await fetch(`${this.apiBaseUrl}/friends/${friendId}/favorite`, {
      method: "PATCH",
      headers: this.headers,
      body: JSON.stringify({ favorite }),
    });
    if (!response.ok) throw new Error(`Failed to update favorite (${response.status}).`);
  }

  async remove(friendId: string) {
    const response = await fetch(`${this.apiBaseUrl}/friends/${friendId}`, {
      method: "DELETE",
      headers: this.headers,
    });
    if (!response.ok) throw new Error(`Failed to remove friend (${response.status}).`);
  }
}
