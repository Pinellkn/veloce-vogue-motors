import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import { db } from "../db";
import { generateId } from "../db";
import {
  createUserSession,
  destroySession,
  getSessionUserId,
  getUserRowById,
  hashPassword,
  toPublicUser,
  verifyPassword,
  type PublicUser,
} from "../auth";
import { buildGoogleAuthUrl, exchangeGoogleCode, fetchGoogleUserInfo } from "../google-oauth";

const STATE_COOKIE = "veloce_oauth_state";

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

function getUserByEmail(email: string): UserRow | undefined {
  return db.prepare(`SELECT * FROM users WHERE email = ?`).get(email.toLowerCase()) as
    | UserRow
    | undefined;
}

// Le tout premier compte créé sur l'instance devient automatiquement admin,
// pour ne jamais se retrouver bloqué dehors sans accès à /admin.
function isFirstAccount(): boolean {
  const { count } = db.prepare(`SELECT COUNT(*) as count FROM users`).get() as {
    count: number;
  };
  return count === 0;
}

// Petite touche d'accueil pour qu'un nouveau compte ne parte pas totalement à vide :
// un message de bienvenue de l'équipe Veloce dans la messagerie.
function seedWelcomeData(userId: string) {
  const conversationId = generateId();
  db.prepare(
    `INSERT INTO conversations (id, user_id, seller_name, car_id) VALUES (?, ?, 'Équipe Veloce', NULL)`,
  ).run(conversationId, userId);
  db.prepare(
    `INSERT INTO messages (id, conversation_id, sender, body, is_read) VALUES (?, ?, 'them', ?, 0)`,
  ).run(
    generateId(),
    conversationId,
    "Bienvenue chez Veloce ! N'hésitez pas à ajouter des véhicules à vos favoris ou à créer une recherche pour recevoir des alertes.",
  );
}

// ---------- Inscription par e-mail / mot de passe ----------

const registerSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  email: z.string().email("Adresse e-mail invalide."),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
});

export const registerUser = createServerFn({ method: "POST" })
  .validator(registerSchema)
  .handler(async ({ data }) => {
    const email = data.email.toLowerCase().trim();
    const existing = getUserByEmail(email);
    if (existing) {
      throw new Error("Un compte existe déjà avec cette adresse e-mail.");
    }

    const passwordHash = await hashPassword(data.password);
    const id = generateId();
    const shouldBeAdmin = isFirstAccount();

    db.prepare(
      `INSERT INTO users (id, name, email, password_hash, is_admin) VALUES (?, ?, ?, ?, ?)`,
    ).run(id, data.name.trim(), email, passwordHash, shouldBeAdmin ? 1 : 0);
    seedWelcomeData(id);

    await createUserSession(id);

    const row = getUserRowById(id)!;
    return toPublicUser(row);
  });

// ---------- Connexion par e-mail / mot de passe ----------

const loginSchema = z.object({
  email: z.string().email("Adresse e-mail invalide."),
  password: z.string().min(1, "Mot de passe requis."),
});

export const loginUser = createServerFn({ method: "POST" })
  .validator(loginSchema)
  .handler(async ({ data }) => {
    const email = data.email.toLowerCase().trim();
    const row = getUserByEmail(email);

    if (!row || !row.password_hash) {
      throw new Error("E-mail ou mot de passe incorrect.");
    }

    const valid = await verifyPassword(data.password, row.password_hash);
    if (!valid) {
      throw new Error("E-mail ou mot de passe incorrect.");
    }

    await createUserSession(row.id);
    return toPublicUser(row);
  });

// ---------- Déconnexion ----------

export const logoutUser = createServerFn({ method: "POST" }).handler(async () => {
  await destroySession();
  return { ok: true };
});

// ---------- Utilisateur courant ----------

export const getCurrentUser = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicUser | null> => {
    const userId = await getSessionUserId();
    if (!userId) return null;
    const row = getUserRowById(userId);
    if (!row) return null;
    return toPublicUser(row);
  },
);

// ---------- Google OAuth : étape 1, construire l'URL et rediriger ----------

export const getGoogleAuthUrl = createServerFn({ method: "GET" }).handler(async () => {
  const state = generateId();
  setCookie(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10, // 10 minutes, le temps du flux OAuth
  });
  const url = buildGoogleAuthUrl(state);
  return { url };
});

// ---------- Google OAuth : étape 2, échanger le code contre un profil ----------

const callbackSchema = z.object({
  code: z.string(),
  state: z.string(),
});

export const completeGoogleLogin = createServerFn({ method: "POST" })
  .validator(callbackSchema)
  .handler(async ({ data }) => {
    const expectedState = getCookie(STATE_COOKIE);
    deleteCookie(STATE_COOKIE, { path: "/" });

    if (!expectedState || expectedState !== data.state) {
      throw new Error("État OAuth invalide (CSRF). Merci de réessayer la connexion Google.");
    }

    const tokens = await exchangeGoogleCode(data.code);
    const profile = await fetchGoogleUserInfo(tokens.access_token);

    if (!profile.email) {
      throw new Error("Google n'a pas renvoyé d'adresse e-mail pour ce compte.");
    }

    // On cherche un compte existant lié à ce Google ID, sinon par e-mail (pour
    // fusionner un compte créé auparavant par mot de passe), sinon on le crée.
    let row = db
      .prepare(`SELECT * FROM users WHERE google_id = ?`)
      .get(profile.sub) as UserRow | undefined;

    if (!row) {
      const existingByEmail = getUserByEmail(profile.email);
      if (existingByEmail) {
        db.prepare(`UPDATE users SET google_id = ?, avatar_url = COALESCE(avatar_url, ?) WHERE id = ?`).run(
          profile.sub,
          profile.picture ?? null,
          existingByEmail.id,
        );
        row = getUserRowById(existingByEmail.id) as UserRow;
      } else {
        const id = generateId();
        const shouldBeAdmin = isFirstAccount();
        db.prepare(
          `INSERT INTO users (id, name, email, google_id, avatar_url, is_admin) VALUES (?, ?, ?, ?, ?, ?)`,
        ).run(
          id,
          profile.name || profile.email.split("@")[0],
          profile.email.toLowerCase(),
          profile.sub,
          profile.picture ?? null,
          shouldBeAdmin ? 1 : 0,
        );
        seedWelcomeData(id);
        row = getUserRowById(id) as UserRow;
      }
    }

    await createUserSession(row.id);
    return toPublicUser(row);
  });
