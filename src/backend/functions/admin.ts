import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db, generateId } from "../db";
import { requireAdminUser } from "../auth";

// ---------- Stats globales ----------

export const getAdminStats = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdminUser();

  const usersCount = (db.prepare(`SELECT COUNT(*) as c FROM users`).get() as { c: number }).c;
  const carsCount = (db.prepare(`SELECT COUNT(*) as c FROM cars`).get() as { c: number }).c;
  const favoritesCount = (db.prepare(`SELECT COUNT(*) as c FROM favorites`).get() as { c: number })
    .c;
  const unreadMessages = (
    db.prepare(`SELECT COUNT(*) as c FROM messages WHERE sender = 'them' AND is_read = 0`).get() as {
      c: number;
    }
  ).c;
  const adminsCount = (
    db.prepare(`SELECT COUNT(*) as c FROM users WHERE is_admin = 1`).get() as { c: number }
  ).c;

  return {
    stats: [
      { label: "Utilisateurs", value: usersCount },
      { label: "Véhicules au catalogue", value: carsCount },
      { label: "Favoris enregistrés", value: favoritesCount },
      { label: "Messages non lus", value: unreadMessages },
    ],
    adminsCount,
  };
});

// ---------- Utilisateurs ----------

export const listAllUsersAdmin = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdminUser();

  const rows = db
    .prepare(
      `SELECT users.*,
        (SELECT COUNT(*) FROM favorites WHERE favorites.user_id = users.id) as favorites_count,
        (SELECT COUNT(*) FROM saved_searches WHERE saved_searches.user_id = users.id) as searches_count
       FROM users
       ORDER BY created_at DESC`,
    )
    .all() as {
    id: string;
    name: string;
    email: string;
    google_id: string | null;
    is_admin: number;
    is_premium: number;
    created_at: string;
    favorites_count: number;
    searches_count: number;
  }[];

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    provider: r.google_id ? "Google" : "E-mail",
    isAdmin: !!r.is_admin,
    isPremium: !!r.is_premium,
    createdAt: r.created_at,
    favoritesCount: r.favorites_count,
    searchesCount: r.searches_count,
  }));
});

export const toggleUserAdminRole = createServerFn({ method: "POST" })
  .validator(z.object({ userId: z.string() }))
  .handler(async ({ data }) => {
    const admin = await requireAdminUser();

    if (data.userId === admin.id) {
      throw new Error("Tu ne peux pas retirer ton propre rôle admin.");
    }

    const row = db.prepare(`SELECT is_admin FROM users WHERE id = ?`).get(data.userId) as
      | { is_admin: number }
      | undefined;
    if (!row) throw new Error("Utilisateur introuvable.");

    const next = row.is_admin ? 0 : 1;
    db.prepare(`UPDATE users SET is_admin = ? WHERE id = ?`).run(next, data.userId);
    return { isAdmin: !!next };
  });

export const deleteUserAdmin = createServerFn({ method: "POST" })
  .validator(z.object({ userId: z.string() }))
  .handler(async ({ data }) => {
    const admin = await requireAdminUser();
    if (data.userId === admin.id) {
      throw new Error("Tu ne peux pas supprimer ton propre compte depuis cette page.");
    }
    db.prepare(`DELETE FROM users WHERE id = ?`).run(data.userId);
    return { ok: true };
  });

// ---------- Catalogue véhicules ----------

const carSchema = z.object({
  brand: z.string().min(1),
  model: z.string().min(1),
  category: z.string().min(1),
  fuelType: z.string().min(1),
  year: z.number().int(),
  price: z.number().int().positive(),
  powerCh: z.number().int().positive().optional(),
  tag: z.string().optional(),
  imageKey: z.string().min(1),
  description: z.string().optional(),
});

export const listAllCarsAdmin = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdminUser();
  const rows = db.prepare(`SELECT * FROM cars ORDER BY created_at DESC`).all() as {
    id: string;
    brand: string;
    model: string;
    name: string;
    category: string;
    fuel_type: string;
    year: number;
    price: number;
    power_ch: number | null;
    tag: string | null;
    image_key: string;
    description: string | null;
  }[];

  return rows.map((r) => ({
    id: r.id,
    brand: r.brand,
    model: r.model,
    name: r.name,
    category: r.category,
    fuelType: r.fuel_type,
    year: r.year,
    price: r.price,
    powerCh: r.power_ch,
    tag: r.tag,
    imageKey: r.image_key,
    description: r.description,
  }));
});

export const createCarAdmin = createServerFn({ method: "POST" })
  .validator(carSchema)
  .handler(async ({ data }) => {
    await requireAdminUser();
    const id = generateId();
    const specs = `${data.fuelType}${data.powerCh ? ` • ${data.powerCh} ch` : ""} • ${data.year}`;

    db.prepare(
      `INSERT INTO cars (id, brand, model, name, category, fuel_type, year, price, power_ch, specs, tag, image_key, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      data.brand,
      data.model,
      `${data.brand} ${data.model}`,
      data.category,
      data.fuelType,
      data.year,
      data.price,
      data.powerCh ?? null,
      specs,
      data.tag ?? null,
      data.imageKey,
      data.description ?? null,
    );

    return { id };
  });

export const updateCarAdmin = createServerFn({ method: "POST" })
  .validator(carSchema.extend({ id: z.string() }))
  .handler(async ({ data }) => {
    await requireAdminUser();
    const specs = `${data.fuelType}${data.powerCh ? ` • ${data.powerCh} ch` : ""} • ${data.year}`;

    db.prepare(
      `UPDATE cars SET brand = ?, model = ?, name = ?, category = ?, fuel_type = ?, year = ?,
        price = ?, power_ch = ?, specs = ?, tag = ?, image_key = ?, description = ?
       WHERE id = ?`,
    ).run(
      data.brand,
      data.model,
      `${data.brand} ${data.model}`,
      data.category,
      data.fuelType,
      data.year,
      data.price,
      data.powerCh ?? null,
      specs,
      data.tag ?? null,
      data.imageKey,
      data.description ?? null,
      data.id,
    );

    return { ok: true };
  });

export const deleteCarAdmin = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await requireAdminUser();
    db.prepare(`DELETE FROM cars WHERE id = ?`).run(data.id);
    return { ok: true };
  });
