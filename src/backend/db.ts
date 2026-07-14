import Database from "better-sqlite3";
import { nanoid } from "nanoid";
import path from "node:path";
import fs from "node:fs";

// Base SQLite locale : zero-config, un simple fichier sur disque.
// Le fichier est créé automatiquement dans /data au premier lancement.
const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "veloce.db");

// Un seul objet Database partagé pour tout le process (pattern singleton,
// indispensable en dev avec le HMR de Vite qui ré-exécute les modules).
const globalForDb = globalThis as unknown as { __veloceDb?: Database.Database };

export const db =
  globalForDb.__veloceDb ??
  new Database(dbPath, {
    // fileMustExist: false => créé le fichier s'il n'existe pas
  });

if (!globalForDb.__veloceDb) {
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  globalForDb.__veloceDb = db;
}

function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      google_id TEXT UNIQUE,
      avatar_url TEXT,
      phone TEXT,
      city TEXT,
      country TEXT,
      is_premium INTEGER NOT NULL DEFAULT 0,
      is_admin INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cars (
      id TEXT PRIMARY KEY,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      fuel_type TEXT NOT NULL,
      year INTEGER NOT NULL,
      price INTEGER NOT NULL,
      power_ch INTEGER,
      specs TEXT NOT NULL,
      tag TEXT,
      image_key TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS favorites (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      car_id TEXT NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, car_id)
    );

    CREATE TABLE IF NOT EXISTS saved_searches (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      filters TEXT NOT NULL,
      alert_enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      seller_name TEXT NOT NULL,
      car_id TEXT REFERENCES cars(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      sender TEXT NOT NULL CHECK (sender IN ('me', 'them')),
      body TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      car_id TEXT REFERENCES cars(id) ON DELETE SET NULL,
      vehicle_label TEXT NOT NULL,
      action_type TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('done', 'pending', 'cancelled')),
      amount_label TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
    CREATE INDEX IF NOT EXISTS idx_searches_user ON saved_searches(user_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_history_user ON history(user_id);
  `);

  // Migration additive : si la base existait déjà avant l'ajout du rôle admin,
  // la colonne is_admin n'existe pas encore sur la table users.
  const columns = db.prepare(`PRAGMA table_info(users)`).all() as { name: string }[];
  if (!columns.some((c) => c.name === "is_admin")) {
    db.exec(`ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0`);
  }
}

function seedCarsIfEmpty() {
  const { count } = db.prepare(`SELECT COUNT(*) as count FROM cars`).get() as {
    count: number;
  };
  if (count > 0) return;

  const cars = [
    {
      brand: "Porsche",
      model: "Taycan Turbo S",
      category: "Électriques",
      fuelType: "Électrique",
      year: 2024,
      price: 189000,
      powerCh: 761,
      specs: "Électrique • 761 ch • 2024",
      tag: "Nouveau",
      imageKey: "car-taycan",
      description:
        "Berline sportive 100% électrique, 0 à 100 km/h en 2,8s. Reprise possible, inspection 250 points effectuée.",
    },
    {
      brand: "Land Rover",
      model: "Defender 110",
      category: "SUV",
      fuelType: "Hybride",
      year: 2023,
      price: 124500,
      powerCh: null,
      specs: "Hybride • V8 • 2023",
      tag: "Certifié",
      imageKey: "car-defender",
      description: "SUV tout-terrain robuste, parfait équilibre entre luxe et capacités off-road.",
    },
    {
      brand: "Ferrari",
      model: "Roma Spider",
      category: "Sportives",
      fuelType: "Essence",
      year: 2024,
      price: 245000,
      powerCh: null,
      specs: "Essence • V8 • 2024",
      tag: "Rare",
      imageKey: "car-ferrari",
      description: "Cabriolet grand tourisme à l'élégance intemporelle, moteur V8 biturbo.",
    },
    {
      brand: "Aston Martin",
      model: "DB12",
      category: "Sportives",
      fuelType: "Essence",
      year: 2024,
      price: 218000,
      powerCh: null,
      specs: "Essence • V8 • 2024",
      tag: "Nouveau",
      imageKey: "car-aston",
      description: "Le premier « Super Tourer » d'Aston Martin, entre puissance et raffinement.",
    },
    {
      brand: "Mercedes-Benz",
      model: "S 580",
      category: "Berlines",
      fuelType: "Hybride",
      year: 2023,
      price: 142900,
      powerCh: null,
      specs: "Hybride • V8 • 2023",
      tag: "Certifié",
      imageKey: "car-sedan",
      description: "Berline de prestige, confort absolu et technologies de pointe.",
    },
    {
      brand: "Ducati",
      model: "Panigale V4 S",
      category: "Motos",
      fuelType: "Essence",
      year: 2024,
      price: 32500,
      powerCh: 214,
      specs: "Essence • 214 ch • 2024",
      tag: "Nouveau",
      imageKey: "car-moto",
      description: "Moto sportive italienne, châssis aluminium et électronique de pointe.",
    },
    {
      brand: "Renault",
      model: "Master Utilitaire",
      category: "Utilitaires",
      fuelType: "Diesel",
      year: 2023,
      price: 38900,
      powerCh: null,
      specs: "Diesel • Fourgon • 2023",
      tag: "Pro",
      imageKey: "car-utility",
      description: "Utilitaire polyvalent pour flottes et professionnels, entretien programmé inclus.",
    },
  ];

  const insert = db.prepare(`
    INSERT INTO cars (id, brand, model, name, category, fuel_type, year, price, power_ch, specs, tag, image_key, description)
    VALUES (@id, @brand, @model, @name, @category, @fuelType, @year, @price, @powerCh, @specs, @tag, @imageKey, @description)
  `);

  const insertMany = db.transaction((rows: typeof cars) => {
    for (const c of rows) {
      insert.run({
        id: nanoid(10),
        name: `${c.brand} ${c.model}`,
        ...c,
      });
    }
  });

  insertMany(cars);
}

migrate();
seedCarsIfEmpty();

export function generateId() {
  return nanoid(12);
}
