import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db, generateId } from "../db";
import { destroySession, getUserRowById, requireCurrentUser, toPublicUser } from "../auth";

// ---------- Stats du tableau de bord ----------

export const getDashboardStats = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireCurrentUser();

  const favoritesCount = (
    db.prepare(`SELECT COUNT(*) as c FROM favorites WHERE user_id = ?`).get(user.id) as {
      c: number;
    }
  ).c;
  const searchesCount = (
    db
      .prepare(`SELECT COUNT(*) as c FROM saved_searches WHERE user_id = ? AND alert_enabled = 1`)
      .get(user.id) as { c: number }
  ).c;
  const unreadMessages = (
    db
      .prepare(
        `SELECT COUNT(*) as c FROM messages
         JOIN conversations ON conversations.id = messages.conversation_id
         WHERE conversations.user_id = ? AND messages.sender = 'them' AND messages.is_read = 0`,
      )
      .get(user.id) as { c: number }
  ).c;
  const alertsCount = searchesCount;

  const recentHistory = db
    .prepare(
      `SELECT * FROM history WHERE user_id = ? ORDER BY created_at DESC LIMIT 3`,
    )
    .all(user.id) as {
    vehicle_label: string;
    action_type: string;
    created_at: string;
    status: string;
  }[];

  return {
    stats: [
      { label: "Véhicules suivis", value: favoritesCount },
      { label: "Recherches actives", value: searchesCount },
      { label: "Messages", value: unreadMessages },
      { label: "Alertes prix", value: alertsCount },
    ],
    recentActivity: recentHistory.map((h) => ({
      title: `${h.action_type} : ${h.vehicle_label}`,
      meta: h.created_at,
      status: h.status,
    })),
  };
});

// ---------- Recherches enregistrées ----------

export const listSearches = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireCurrentUser();
  const rows = db
    .prepare(`SELECT * FROM saved_searches WHERE user_id = ? ORDER BY created_at DESC`)
    .all(user.id) as {
    id: string;
    label: string;
    filters: string;
    alert_enabled: number;
  }[];

  return rows.map((r) => {
    const filters = JSON.parse(r.filters) as { category?: string; maxPrice?: number; query?: string };
    let matches = 0;
    let sql = `SELECT COUNT(*) as c FROM cars WHERE 1=1`;
    const params: (string | number)[] = [];
    if (filters.category) {
      sql += ` AND category = ?`;
      params.push(filters.category);
    }
    if (filters.maxPrice) {
      sql += ` AND price <= ?`;
      params.push(filters.maxPrice);
    }
    if (filters.query) {
      sql += ` AND (brand LIKE ? OR model LIKE ?)`;
      const like = `%${filters.query}%`;
      params.push(like, like);
    }
    matches = (db.prepare(sql).get(...params) as { c: number }).c;

    return {
      id: r.id,
      name: r.label,
      filtersLabel: [filters.category, filters.query, filters.maxPrice ? `≤ ${filters.maxPrice} €` : null]
        .filter(Boolean)
        .join(" • ") || "Tous véhicules",
      matches,
      alert: !!r.alert_enabled,
    };
  });
});

const createSearchSchema = z.object({
  label: z.string().min(2),
  category: z.string().optional(),
  maxPrice: z.number().optional(),
  query: z.string().optional(),
});

export const createSearch = createServerFn({ method: "POST" })
  .validator(createSearchSchema)
  .handler(async ({ data }) => {
    const user = await requireCurrentUser();
    const id = generateId();
    db.prepare(
      `INSERT INTO saved_searches (id, user_id, label, filters, alert_enabled) VALUES (?, ?, ?, ?, 1)`,
    ).run(
      id,
      user.id,
      data.label,
      JSON.stringify({ category: data.category, maxPrice: data.maxPrice, query: data.query }),
    );
    return { id };
  });

export const toggleSearchAlert = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const user = await requireCurrentUser();
    const row = db
      .prepare(`SELECT alert_enabled FROM saved_searches WHERE id = ? AND user_id = ?`)
      .get(data.id, user.id) as { alert_enabled: number } | undefined;
    if (!row) throw new Error("Recherche introuvable.");
    const next = row.alert_enabled ? 0 : 1;
    db.prepare(`UPDATE saved_searches SET alert_enabled = ? WHERE id = ?`).run(next, data.id);
    return { alert: !!next };
  });

export const deleteSearch = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const user = await requireCurrentUser();
    db.prepare(`DELETE FROM saved_searches WHERE id = ? AND user_id = ?`).run(data.id, user.id);
    return { ok: true };
  });

// ---------- Messagerie ----------

export const listConversations = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireCurrentUser();
  const rows = db
    .prepare(
      `SELECT conversations.*,
        (SELECT body FROM messages WHERE conversation_id = conversations.id ORDER BY created_at DESC LIMIT 1) as last_body,
        (SELECT created_at FROM messages WHERE conversation_id = conversations.id ORDER BY created_at DESC LIMIT 1) as last_at,
        (SELECT COUNT(*) FROM messages WHERE conversation_id = conversations.id AND sender = 'them' AND is_read = 0) as unread
       FROM conversations
       WHERE conversations.user_id = ?
       ORDER BY last_at DESC`,
    )
    .all(user.id) as {
    id: string;
    seller_name: string;
    car_id: string | null;
    last_body: string | null;
    last_at: string | null;
    unread: number;
  }[];

  return rows.map((r) => ({
    id: r.id,
    name: r.seller_name,
    last: r.last_body ?? "",
    time: r.last_at ?? "",
    unread: r.unread,
  }));
});

export const getConversationThread = createServerFn({ method: "GET" })
  .validator(z.object({ conversationId: z.string() }))
  .handler(async ({ data }) => {
    const user = await requireCurrentUser();

    const conversation = db
      .prepare(
        `SELECT conversations.*, cars.name as car_name, cars.price as car_price
         FROM conversations LEFT JOIN cars ON cars.id = conversations.car_id
         WHERE conversations.id = ? AND conversations.user_id = ?`,
      )
      .get(data.conversationId, user.id) as
      | { id: string; seller_name: string; car_name: string | null; car_price: number | null }
      | undefined;

    if (!conversation) throw new Error("Conversation introuvable.");

    db.prepare(
      `UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender = 'them'`,
    ).run(data.conversationId);

    const messages = db
      .prepare(`SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC`)
      .all(data.conversationId) as {
      id: string;
      sender: "me" | "them";
      body: string;
      created_at: string;
    }[];

    return {
      sellerName: conversation.seller_name,
      carName: conversation.car_name,
      carPrice: conversation.car_price,
      messages: messages.map((m) => ({
        from: m.sender,
        text: m.body,
        time: m.created_at,
      })),
    };
  });

export const sendMessage = createServerFn({ method: "POST" })
  .validator(z.object({ conversationId: z.string(), body: z.string().min(1) }))
  .handler(async ({ data }) => {
    const user = await requireCurrentUser();
    const conversation = db
      .prepare(`SELECT id FROM conversations WHERE id = ? AND user_id = ?`)
      .get(data.conversationId, user.id);
    if (!conversation) throw new Error("Conversation introuvable.");

    db.prepare(
      `INSERT INTO messages (id, conversation_id, sender, body) VALUES (?, ?, 'me', ?)`,
    ).run(generateId(), data.conversationId, data.body);

    return { ok: true };
  });

// ---------- Historique ----------

export const listHistory = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireCurrentUser();
  const rows = db
    .prepare(`SELECT * FROM history WHERE user_id = ? ORDER BY created_at DESC`)
    .all(user.id) as {
    id: string;
    vehicle_label: string;
    action_type: string;
    status: "done" | "pending" | "cancelled";
    amount_label: string | null;
    created_at: string;
  }[];

  return rows.map((r) => ({
    date: r.created_at,
    vehicle: r.vehicle_label,
    type: r.action_type,
    status: r.status,
    price: r.amount_label ?? "—",
  }));
});

// ---------- Profil ----------

const updateProfileSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

export const updateProfile = createServerFn({ method: "POST" })
  .validator(updateProfileSchema)
  .handler(async ({ data }) => {
    const user = await requireCurrentUser();
    db.prepare(
      `UPDATE users SET name = ?, phone = ?, city = ?, country = ? WHERE id = ?`,
    ).run(data.name, data.phone ?? null, data.city ?? null, data.country ?? null, user.id);
    const row = getUserRowById(user.id)!;
    return toPublicUser(row);
  });

export const deleteAccount = createServerFn({ method: "POST" }).handler(async () => {
  const user = await requireCurrentUser();
  db.prepare(`DELETE FROM users WHERE id = ?`).run(user.id);
  await destroySession();
  return { ok: true };
});
