import { getSession, updateSession, clearSession } from "@tanstack/react-start/server";
import bcrypt from "bcryptjs";
import { db } from "./db";

type SessionData = {
  userId: string;
};

function sessionConfig() {
  const password = process.env.SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error(
      "SESSION_SECRET manquant ou trop court (32 caractères min). Vérifie ton fichier .env.",
    );
  }
  return {
    password,
    name: "veloce_session",
    maxAge: 60 * 60 * 24 * 30, // 30 jours
    cookie: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
    },
  };
}

export async function createUserSession(userId: string) {
  await updateSession<SessionData>(sessionConfig(), { userId });
}

export async function destroySession() {
  await clearSession(sessionConfig());
}

export async function getSessionUserId(): Promise<string | null> {
  const session = await getSession<SessionData>(sessionConfig());
  return session.data.userId ?? null;
}

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
  isPremium: boolean;
  isAdmin: boolean;
  createdAt: string;
  hasPassword: boolean;
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string | null;
  google_id: string | null;
  avatar_url: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
  is_premium: number;
  is_admin: number;
  created_at: string;
};

export function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatarUrl: row.avatar_url,
    phone: row.phone,
    city: row.city,
    country: row.country,
    isPremium: !!row.is_premium,
    isAdmin: !!row.is_admin,
    createdAt: row.created_at,
    hasPassword: !!row.password_hash,
  };
}

export function getUserRowById(id: string): UserRow | undefined {
  return db.prepare(`SELECT * FROM users WHERE id = ?`).get(id) as UserRow | undefined;
}

export async function requireCurrentUser(): Promise<PublicUser> {
  const userId = await getSessionUserId();
  if (!userId) {
    throw new Error("UNAUTHENTICATED");
  }
  const row = getUserRowById(userId);
  if (!row) {
    await destroySession();
    throw new Error("UNAUTHENTICATED");
  }
  return toPublicUser(row);
}

export async function requireAdminUser(): Promise<PublicUser> {
  const user = await requireCurrentUser();
  if (!user.isAdmin) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
