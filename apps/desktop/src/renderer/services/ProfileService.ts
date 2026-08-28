import type { Profile } from "@coral/shared";

export class ProfileService {
  constructor(private readonly token: string | null) {}

  private get apiBaseUrl() {
    const apiUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_SOCKET_URL) as string | undefined;
    if (!apiUrl) throw new Error("VITE_API_URL is required before loading profile data.");
    return apiUrl;
  }

  private get headers() {
    return {
      "Content-Type": "application/json",
      Authorization: this.token ? `Bearer ${this.token}` : "",
    };
  }

  async getMe(): Promise<Profile> {
    const response = await fetch(`${this.apiBaseUrl}/profile/me`, {
      headers: this.headers,
    });

    if (!response.ok) throw new Error(`Failed to load profile (${response.status}).`);
    const payload = (await response.json()) as { profile: Profile };
    return payload.profile;
  }

  async updateMe(input: Partial<Pick<Profile, "username" | "nickname" | "bio" | "avatarUrl" | "accountVisibility">>) {
    const response = await fetch(`${this.apiBaseUrl}/profile/me`, {
      method: "PATCH",
      headers: this.headers,
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error || `Failed to save profile (${response.status}).`);
    }
    const payload = (await response.json()) as { profile: Profile };
    return payload.profile;
  }
}
