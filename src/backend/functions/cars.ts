import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db, generateId } from "../db";
import { getSessionUserId } from "../auth";

export type CarDTO = {
  id: string;
  brand: string;
  model: string;
  name: string;
  category: string;
  fuelType: string;
  year: number;
  price: number;
  powerCh: number | null;
  specs: string;
  tag: string | null;
  imageKey: string;
  description: string | null;
};

type CarRow = {
  id: string;
  brand: string;
  model: string;
  name: string;
  category: string;
  fuel_type: string;
  year: number;
  price: number;
  power_ch: number | null;
  specs: string;
  tag: string | null;
  image_key: string;
  description: string | null;
};

function toCarDTO(row: CarRow): CarDTO {
  return {
    id: row.id,
    brand: row.brand,
    model: row.model,
    name: row.name,
    category: row.category,
    fuelType: row.fuel_type,
    year: row.year,
    price: row.price,
    powerCh: row.power_ch,
    specs: row.specs,
    tag: row.tag,
    imageKey: row.image_key,
    description: row.description,
  };
}

export const listFeaturedCars = createServerFn({ method: "GET" }).handler(async () => {
  const rows = db.prepare(`SELECT * FROM cars ORDER BY created_at DESC LIMIT 6`).all() as CarRow[];
  return rows.map(toCarDTO);
});

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const rows = db
    .prepare(`SELECT category as label, COUNT(*) as count FROM cars GROUP BY category ORDER BY count DESC`)
    .all() as { label: string; count: number }[];
  return rows;
});

const searchSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  maxPrice: z.number().optional(),
});

export const searchCars = createServerFn({ method: "POST" })
  .validator(searchSchema)
  .handler(async ({ data }) => {
    let sql = `SELECT * FROM cars WHERE 1=1`;
    const params: (string | number)[] = [];

    if (data.query && data.query.trim()) {
      sql += ` AND (brand LIKE ? OR model LIKE ? OR name LIKE ?)`;
      const like = `%${data.query.trim()}%`;
      params.push(like, like, like);
    }
    if (data.category && data.category !== "Tous types") {
      sql += ` AND category = ?`;
      params.push(data.category);
    }
    if (data.maxPrice) {
      sql += ` AND price <= ?`;
      params.push(data.maxPrice);
    }
    sql += ` ORDER BY created_at DESC`;

    const rows = db.prepare(sql).all(...params) as CarRow[];
    return rows.map(toCarDTO);
  });

export const getCarById = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const row = db.prepare(`SELECT * FROM cars WHERE id = ?`).get(data.id) as CarRow | undefined;
    return row ? toCarDTO(row) : null;
  });

// ---------- Favoris ----------

export const listFavorites = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await getSessionUserId();
  if (!userId) return [];

  const rows = db
    .prepare(
      `SELECT cars.*, favorites.created_at as favorited_at
       FROM favorites
       JOIN cars ON cars.id = favorites.car_id
       WHERE favorites.user_id = ?
       ORDER BY favorites.created_at DESC`,
    )
    .all(userId) as (CarRow & { favorited_at: string })[];

  return rows.map((row) => ({ ...toCarDTO(row), favoritedAt: row.favorited_at }));
});

export const listFavoriteIds = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await getSessionUserId();
  if (!userId) return [] as string[];
  const rows = db.prepare(`SELECT car_id FROM favorites WHERE user_id = ?`).all(userId) as {
    car_id: string;
  }[];
  return rows.map((r) => r.car_id);
});

export const toggleFavorite = createServerFn({ method: "POST" })
  .validator(z.object({ carId: z.string() }))
  .handler(async ({ data }) => {
    const userId = await getSessionUserId();
    if (!userId) throw new Error("UNAUTHENTICATED");

    const existing = db
      .prepare(`SELECT 1 FROM favorites WHERE user_id = ? AND car_id = ?`)
      .get(userId, data.carId);

    if (existing) {
      db.prepare(`DELETE FROM favorites WHERE user_id = ? AND car_id = ?`).run(userId, data.carId);
      return { favorited: false };
    }

    db.prepare(`INSERT INTO favorites (user_id, car_id) VALUES (?, ?)`).run(userId, data.carId);

    const car = db.prepare(`SELECT * FROM cars WHERE id = ?`).get(data.carId) as
      | CarRow
      | undefined;
    if (car) {
      db.prepare(
        `INSERT INTO history (id, user_id, car_id, vehicle_label, action_type, status, amount_label)
         VALUES (?, ?, ?, ?, 'Ajout aux favoris', 'done', '—')`,
      ).run(generateId(), userId, car.id, car.name);
    }

    return { favorited: true };
  });
