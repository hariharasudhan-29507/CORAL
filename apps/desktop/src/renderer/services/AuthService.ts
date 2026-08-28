import { supabase } from "./supabaseClient";
import type { Session } from "@supabase/supabase-js";

export type SessionUser = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
};

type PasswordAuthRequest = {
  credential: string; // email
  password: string;
  name?: string; // used for registration metadata only
};

type OtpRequest = {
  email?: string;
  phone?: string;
  token: string;
};

type RegisterResult =
  | {
      status: "signed_in";
      user: SessionUser;
    }
  | {
      status: "needs_email_verification";
      email: string;
    };

type AuthListener = (user: SessionUser | null) => void;

export class AuthService {
  private user: SessionUser | null = null;
  private token: string | null = null;
  private authListenerAttached = false;
  private listeners = new Set<AuthListener>();

  constructor() {
    // Keep state in sync with Supabase session changes (OTP + OAuth redirects).
    this.attachListenerOnce().catch(() => {
      // Listener attachment errors should not crash the app; UI will show "not authenticated".
    });
  }

  getCurrentUser() {
    return this.user;
  }

  getSessionToken() {
    return this.token;
  }

  getSetupStatus() {
    return {
      configured: Boolean(supabase),
      phoneOtpEnabled: import.meta.env.VITE_ENABLE_PHONE_OTP !== "false",
      oauthRedirectTo: (import.meta.env.VITE_OAUTH_REDIRECT_TO as string | undefined) || window.location.origin,
    };
  }

  onSessionChange(listener: AuthListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async restoreSession() {
    const sb = supabase;
    if (!sb) return null;

    const {
      data: { session },
    } = await sb.auth.getSession();

    if (!session) {
      this.user = null;
      this.token = null;
      return null;
    }

    this.applySession(session);
    return this.user;
  }

  async signIn(request: PasswordAuthRequest): Promise<SessionUser> {
    const sb = supabase;
    if (!sb) throw new Error("Supabase is not configured (missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).");

    const { data, error } = await sb.auth.signInWithPassword({
      email: request.credential,
      password: request.password,
    });

    if (error) throw this.authError(error.message, "password");
    if (!data.session) throw new Error("Could not sign in (no session returned).");

    this.applySession(data.session);
    if (!this.user) throw new Error("Could not sign in (missing user).");
    return this.user;
  }

  async register(request: PasswordAuthRequest): Promise<RegisterResult> {
    const sb = supabase;
    if (!sb) throw new Error("Supabase is not configured (missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).");

    const { data, error } = await sb.auth.signUp({
      email: request.credential,
      password: request.password,
      options: {
        emailRedirectTo: import.meta.env.VITE_OAUTH_REDIRECT_TO || undefined,
        data: {
          full_name: request.name ?? "",
        },
      },
    });

    if (error) throw this.authError(error.message, "register");

    if (data.session) {
      this.applySession(data.session);
      if (!this.user) throw new Error("Could not register (missing user).");
      return { status: "signed_in", user: this.user };
    }

    return { status: "needs_email_verification", email: request.credential };
  }

  async sendEmailOtp(email: string) {
    const sb = supabase;
    if (!sb) throw new Error("Supabase is not configured.");

    const { error } = await sb.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: import.meta.env.VITE_OAUTH_REDIRECT_TO || undefined,
        shouldCreateUser: false,
      },
    });

    if (error) throw this.authError(error.message, "email_otp");
  }

  async resendSignupEmail(email: string) {
    const sb = supabase;
    if (!sb) throw new Error("Supabase is not configured.");

    const { error } = await sb.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: import.meta.env.VITE_OAUTH_REDIRECT_TO || undefined,
      },
    });

    if (error) throw this.authError(error.message, "register");
  }

  async sendPhoneOtp(phone: string) {
    const sb = supabase;
    if (!sb) throw new Error("Supabase is not configured.");
    if (!this.getSetupStatus().phoneOtpEnabled) {
      throw new Error("Phone OTP is disabled in this build. Set VITE_ENABLE_PHONE_OTP=true after enabling Supabase phone auth and an SMS provider.");
    }

    const channel = import.meta.env.VITE_SUPABASE_PHONE_CHANNEL === "whatsapp" ? "whatsapp" : undefined;
    const { error } = await sb.auth.signInWithOtp({
      phone,
      options: channel ? { channel } : undefined,
    });
    if (error) throw this.authError(error.message, "phone_otp");
  }

  async verifyEmailOtp(request: OtpRequest) {
    const sb = supabase;
    if (!sb) throw new Error("Supabase is not configured.");
    if (!request.email) throw new Error("Email is required for email OTP verification.");

    const { data, error } = await sb.auth.verifyOtp({
      email: request.email,
      token: request.token,
      type: "email",
    });

    if (error) throw this.authError(error.message, "verify_email_otp");
    if (!data.session) throw new Error("OTP verified but no session was returned.");

    this.applySession(data.session);
    if (!this.user) throw new Error("OTP verified but missing user.");
    return this.user;
  }

  async verifyPhoneOtp(request: OtpRequest) {
    const sb = supabase;
    if (!sb) throw new Error("Supabase is not configured.");
    if (!request.phone) throw new Error("Phone number is required for phone OTP verification.");

    const { data, error } = await sb.auth.verifyOtp({
      phone: request.phone,
      token: request.token,
      type: "sms",
    });

    if (error) throw this.authError(error.message, "verify_phone_otp");
    if (!data.session) throw new Error("OTP verified but no session was returned.");

    this.applySession(data.session);
    if (!this.user) throw new Error("OTP verified but missing user.");
    return this.user;
  }

  async verifySignupOtp(request: OtpRequest) {
    const sb = supabase;
    if (!sb) throw new Error("Supabase is not configured.");
    if (!request.email) throw new Error("Email is required for signup verification.");

    const { data, error } = await sb.auth.verifyOtp({
      email: request.email,
      token: request.token,
      type: "signup",
    });

    if (error) throw this.authError(error.message, "verify_signup_otp");
    if (!data.session) throw new Error("OTP verified but no session was returned.");

    this.applySession(data.session);
    if (!this.user) throw new Error("OTP verified but missing user.");
    return this.user;
  }

  async resetPasswordForEmail(email: string) {
    const sb = supabase;
    if (!sb) throw new Error("Supabase is not configured.");

    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: import.meta.env.VITE_PASSWORD_RESET_REDIRECT_TO || import.meta.env.VITE_OAUTH_REDIRECT_TO || window.location.origin,
    });
    if (error) throw this.authError(error.message, "password_reset");
  }

  async signInWithGoogle() {
    const sb = supabase;
    if (!sb) throw new Error("Supabase is not configured.");

    const redirectTo = (import.meta.env.VITE_OAUTH_REDIRECT_TO as string | undefined) || window.location.origin;

    const { error } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (error) throw this.authError(error.message, "google");
  }

  async signOut() {
    this.user = null;
    this.token = null;
    this.notify();
    await supabase?.auth.signOut();
  }

  private applySession(session: Session) {
    const user = session.user ?? (session as any).user;
    const metadata = (user as any)?.user_metadata ?? {};

    const name =
      metadata.full_name ||
      metadata.name ||
      metadata.fullName ||
      (user?.email ? String(user.email).split("@")[0] : undefined) ||
      user?.phone ||
      user?.id;

    this.user = {
      id: String(user.id),
      name,
      email: user.email ? String(user.email) : undefined,
      phone: user.phone ? String(user.phone) : undefined,
    };

    this.token = session.access_token ?? null;
    this.notify();
  }

  private async attachListenerOnce() {
    if (this.authListenerAttached) return;
    this.authListenerAttached = true;

    const sb = supabase;
    if (!sb) return;

    sb.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        this.user = null;
        this.token = null;
        this.notify();
        return;
      }
      this.applySession(session);
    });
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.user));
  }

  private authError(message: string, context: string) {
    const lower = message.toLowerCase();

    if (lower.includes("email provider is disabled") || lower.includes("email logins are disabled")) {
      return new Error("Email auth is disabled in Supabase. Enable Email under Authentication > Providers.");
    }

    if (lower.includes("sms provider") || lower.includes("phone provider") || lower.includes("phone logins are disabled")) {
      return new Error("Phone OTP needs Supabase Phone enabled and an SMS provider configured before Coral can send codes.");
    }

    if (lower.includes("signup") && lower.includes("disabled")) {
      return new Error("New account creation is disabled in Supabase. Enable signups or create the user first.");
    }

    if (lower.includes("otp") || lower.includes("token")) {
      if (lower.includes("expired") || lower.includes("invalid")) {
        return new Error("That code is expired or invalid. Request a new code and enter the latest one.");
      }
    }

    if (lower.includes("rate limit") || lower.includes("too many")) {
      return new Error("Too many code requests. Wait a minute, then resend the code.");
    }

    if (lower.includes("user not found") || lower.includes("invalid login credentials")) {
      if (context === "email_otp") {
        return new Error("No Coral account exists for this email yet. Create an account first.");
      }
      return new Error("Those sign-in details did not match a Coral account.");
    }

    return new Error(message);
  }
}

export const authService = new AuthService();
