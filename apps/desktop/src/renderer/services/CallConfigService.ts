export class CallConfigService {
  constructor(private readonly token: string | null) {}

  private get apiBaseUrl() {
    const apiUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_SOCKET_URL) as string | undefined;
    if (!apiUrl) throw new Error("VITE_API_URL is required before loading call connectivity.");
    return apiUrl;
  }

  async getIceServers(): Promise<RTCIceServer[]> {
    const response = await fetch(`${this.apiBaseUrl}/calls/ice-servers`, {
      headers: {
        Authorization: this.token ? `Bearer ${this.token}` : "",
      },
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error || `Failed to load call connectivity (${response.status}).`);
    }

    const payload = (await response.json()) as { iceServers: RTCIceServer[] };
    return payload.iceServers;
  }
}
