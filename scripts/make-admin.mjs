// Utilitaire en ligne de commande pour rendre un compte admin.
// Usage : node scripts/make-admin.mjs email@exemple.com
//
// Utile si tu veux ajouter un 2e admin, ou si tu dois re-promouvoir un compte
// après avoir supprimé la base de données.

import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";

const email = process.argv[2];

if (!email) {
  console.error("Usage : node scripts/make-admin.mjs email@exemple.com");
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "..", "data", "veloce.db");

const db = new Database(dbPath);

const user = db.prepare(`SELECT id, name, email, is_admin FROM users WHERE email = ?`).get(
  email.toLowerCase().trim(),
);

if (!user) {
  console.error(`Aucun compte trouvé avec l'e-mail "${email}".`);
  console.error("Le compte doit déjà exister (inscris-toi d'abord sur le site).");
  process.exit(1);
}

if (user.is_admin) {
  console.log(`"${user.name}" (${user.email}) est déjà admin.`);
  process.exit(0);
}

db.prepare(`UPDATE users SET is_admin = 1 WHERE id = ?`).run(user.id);
console.log(`"${user.name}" (${user.email}) est maintenant admin.`);
