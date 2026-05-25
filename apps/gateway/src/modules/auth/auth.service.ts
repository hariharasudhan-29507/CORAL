import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { ObjectId, type Collection } from "mongodb";
import { z } from "zod";
import { env } from "../../config/env.js";
import { getMongoDb } from "../../lib/mongodb.js";

const scrypt = promisify(scryptCallback);
const passwordKeyLength = 64;
const tokenTtlMs = 1000 * 60 * 60 * 24 * 30;

export type AuthUser = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
};

type UserDocument = {
  _id?: ObjectId;
  name: string;
  email?: string;
  phone?: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
};

type SessionPayload = AuthUser & {
  exp: number;
};

export const authCredentialSchema = z.string().min(3).max(180);

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  credential: authCredentialSchema,
  password: z.string().min(8).max(200),
});

export const loginSchema = z.object({
  credential: authCredentialSchema,
  password: z.string().min(1).max(200),
});

function getTokenSecret() {
  return env.AUTH_TOKEN_SECRET || env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_JWT_SECRET || "coral-dev-auth-secret-change-me";
}

function base64UrlEncode(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

function base64UrlDecode(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", getTokenSecret()).update(value).digest("base64url");
}

function toPublicUser(user: UserDocument): AuthUser {
  if (!user._id) throw new Error("User record is missing an id.");

  return {
    id: user._id.toHexString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
  };
}

function normalizeCredential(credential: string): Pick<UserDocument, "email" | "phone"> {
  const value = credential.trim();
  const maybeEmail = value.toLowerCase();

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(maybeEmail)) {
    return { email: maybeEmail };
  }

  const phone = value.replace(/[^\d+]/g, "");
  if (/^\+?\d{7,15}$/.test(phone)) {
    return { phone };
  }

  throw new Error("Enter a valid email address or phone number.");
}

async function usersCollection(): Promise<Collection<UserDocument>> {
  const db = await getMongoDb();
  return db.collection<UserDocument>(env.MONGODB_USERS_COLLECTION);
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const derivedKey = (await scrypt(password, salt, passwordKeyLength)) as Buffer;
  return `scrypt:${salt}:${derivedKey.toString("base64url")}`;
}

async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, key] = storedHash.split(":");
  if (algorithm !== "scrypt" || !salt || !key) return false;

  const derivedKey = (await scrypt(password, salt, passwordKeyLength)) as Buffer;
  const storedKey = Buffer.from(key, "base64url");
  if (storedKey.length !== derivedKey.length) return false;

  return timingSafeEqual(storedKey, derivedKey);
}

export async function createUser(input: z.infer<typeof registerSchema>) {
  const identifier = normalizeCredential(input.credential);
  const collection = await usersCollection();
  const clauses = [
    identifier.email ? { email: identifier.email } : null,
    identifier.phone ? { phone: identifier.phone } : null,
  ].filter(Boolean) as Array<Pick<UserDocument, "email"> | Pick<UserDocument, "phone">>;
  const existing = await collection.findOne({ $or: clauses });

  if (existing) {
    throw new Error("An account already exists for this email or phone number.");
  }

  const now = new Date();
  const document: UserDocument = {
    name: input.name.trim(),
    ...identifier,
    passwordHash: await hashPassword(input.password),
    createdAt: now,
    updatedAt: now,
  };
  const result = await collection.insertOne(document);

  const user = await collection.findOne({ _id: result.insertedId });
  if (!user) throw new Error("Account was created but could not be loaded.");

  return createSession(toPublicUser(user));
}

export async function loginUser(input: z.infer<typeof loginSchema>) {
  const identifier = normalizeCredential(input.credential);
  const collection = await usersCollection();
  const user = await collection.findOne(identifier.email ? { email: identifier.email } : { phone: identifier.phone });

  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new Error("The email, phone, or password is incorrect.");
  }

  return createSession(toPublicUser(user));
}

export function createSession(user: AuthUser) {
  const payload: SessionPayload = {
    ...user,
    exp: Date.now() + tokenTtlMs,
  };
  const body = base64UrlEncode(JSON.stringify(payload));

  return {
    user,
    token: `${body}.${sign(body)}`,
  };
}

export function verifySessionToken(token: string | undefined): AuthUser | null {
  if (!token) return null;

  const [body, signature] = token.split(".");
  if (!body || !signature || sign(body) !== signature) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(body)) as SessionPayload;
    if (!payload.id || !payload.name || Date.now() > payload.exp) return null;

    return {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
    };
  } catch {
    return null;
  }
}
