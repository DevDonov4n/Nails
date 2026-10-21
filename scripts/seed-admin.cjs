require("dotenv/config");

const { randomBytes, scrypt: scryptCallback } = require("node:crypto");
const { promisify } = require("node:util");
const { createClient } = require("@libsql/client");

const scrypt = promisify(scryptCallback);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64);
  return `${salt}:${derived.toString("hex")}`;
}

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!url || !authToken) throw new Error("Configure TURSO_DATABASE_URL e TURSO_AUTH_TOKEN.");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Configure um ADMIN_EMAIL válido.");
  if (!password || password.length < 12) throw new Error("ADMIN_PASSWORD deve ter pelo menos 12 caracteres.");

  const db = createClient({ url, authToken });
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "AdminUser" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "email" TEXT NOT NULL UNIQUE,
        "passwordHash" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    try {
      await db.execute('ALTER TABLE "AdminUser" ADD COLUMN "yearlyGoal" INTEGER NOT NULL DEFAULT 0');
    } catch (error) {
      if (!String(error.message).toLowerCase().includes("duplicate column")) throw error;
    }

    const existing = await db.execute({
      sql: 'SELECT "id" FROM "AdminUser" WHERE "email" = ?',
      args: [email],
    });
    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();

    if (existing.rows.length) {
      await db.execute({
        sql: 'UPDATE "AdminUser" SET "passwordHash" = ?, "updatedAt" = ? WHERE "email" = ?',
        args: [passwordHash, now, email],
      });
      console.log(`Senha administrativa atualizada para ${email}.`);
    } else {
      const id = randomBytes(16).toString("hex");
      await db.execute({
        sql: 'INSERT INTO "AdminUser" ("id", "email", "passwordHash", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?)',
        args: [id, email, passwordHash, now, now],
      });
      console.log(`Administrador ${email} cadastrado no Turso.`);
    }
  } finally {
    await db.close();
  }
}

main().catch((error) => {
  console.error("Falha ao cadastrar administrador:", error.message);
  process.exitCode = 1;
});
