export type SessionUser = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
};

type AuthSession = {
  user: SessionUser;
  token: string;
};

type AuthRequest = {
  credential: string;
  password: string;
  name?: string;
};

const sessionStorageKey = "coral.auth.session";

export class AuthService {
  private user: SessionUser | null = null;
  private token: string | null = null;

  constructor() {
    const stored = this.readStoredSession();
    this.user = stored?.user ?? null;
    this.token = stored?.token ?? null;
  }

  getCurrentUser() {
    return this.user;
  }

  getSessionToken() {
    return this.token;
  }

  async restoreSession() {
    if (!this.token) return null;

    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/me`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!response.ok) throw new Error("Session expired.");
      const payload = (await response.json()) as { user: SessionUser };
      this.user = payload.user;
      this.writeStoredSession();
      return this.user;
    } catch {
      this.signOut();
      return null;
    }
  }

  async signIn(request: AuthRequest) {
    return this.authenticate("/auth/login", request);
  }

  async register(request: AuthRequest) {
    return this.authenticate("/auth/register", request);
  }

  signOut() {
    this.user = null;
    this.token = null;
    localStorage.removeItem(sessionStorageKey);
  }

  private get apiBaseUrl() {
    return import.meta.env.VITE_API_URL || import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";
  }

  private async authenticate(path: string, request: AuthRequest) {
    const response = await fetch(`${this.apiBaseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    const payload = (await response.json()) as Partial<AuthSession> & { error?: string };

    if (!response.ok || !payload.user || !payload.token) {
      throw new Error(payload.error || "Could not authenticate.");
    }

    this.user = payload.user;
    this.token = payload.token;
    this.writeStoredSession();
    return this.user;
  }

  private readStoredSession() {
    try {
      const raw = localStorage.getItem(sessionStorageKey);
      return raw ? (JSON.parse(raw) as AuthSession) : null;
    } catch {
      return null;
    }
  }

  private writeStoredSession() {
    if (!this.user || !this.token) return;
    localStorage.setItem(sessionStorageKey, JSON.stringify({ user: this.user, token: this.token }));
  }
}

export const authService = new AuthService();
