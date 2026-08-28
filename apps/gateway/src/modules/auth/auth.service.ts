import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "../../config/env.js";

export type AuthUser = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
};

let supabaseAuth: SupabaseClient | null = null;

function getSupabaseAuthClient(): SupabaseClient | null {
  if (supabaseAuth) return supabaseAuth;
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return null;

  supabaseAuth = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: "public",
    },
  });

  return supabaseAuth;
}

export async function verifySupabaseAccessToken(token: string | undefined): Promise<AuthUser | null> {
  if (!token) return null;

  const client = getSupabaseAuthClient();
  if (!client) return null;

  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;

  const user = data.user;
  const metadata = user.user_metadata as any;
  const name =
    metadata?.full_name ||
    metadata?.name ||
    metadata?.fullName ||
    user.email ||
    user.phone ||
    user.id;

  return {
    id: user.id,
    name,
    email: user.email ?? undefined,
    phone: user.phone ?? metadata?.phone ?? undefined,
  };
}

export async function verifyAuthToken(token: string | undefined): Promise<AuthUser | null> {
  return verifySupabaseAccessToken(token);
}
