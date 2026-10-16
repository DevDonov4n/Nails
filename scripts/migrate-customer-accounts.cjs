const { createClient } = require("@libsql/client");

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) {
  console.error("Configure TURSO_DATABASE_URL e TURSO_AUTH_TOKEN no .env antes de executar.");
  process.exit(1);
}

async function main() {
  const client = createClient({ url, authToken });
  try {
    const userTable = await client.execute("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'User'");
    if (userTable.rows.length === 0) {
      await client.execute(`CREATE TABLE "User" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "whatsapp" TEXT NOT NULL,
        "passwordHash" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )`);
      console.log("Tabela User criada.");
    } else {
      console.log("Tabela User já existe; preservada.");
    }

    await client.execute('CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")');
    await client.execute('CREATE INDEX IF NOT EXISTS "User_whatsapp_idx" ON "User"("whatsapp")');

    const columns = await client.execute('PRAGMA table_info("Booking")');
    if (!columns.rows.some((column) => column.name === "userId")) {
      await client.execute('ALTER TABLE "Booking" ADD COLUMN "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE');
      console.log("Coluna Booking.userId adicionada; agendamentos existentes preservados.");
    } else {
      console.log("Coluna Booking.userId já existe; preservada.");
    }

    await client.execute('CREATE INDEX IF NOT EXISTS "Booking_userId_startAt_idx" ON "Booking"("userId", "startAt")');
    console.log("Migração de contas de clientes aplicada com sucesso.");
  } finally {
    client.close();
  }
}

main().catch((error) => {
  console.error("Falha ao migrar o banco:", error instanceof Error ? error.message : error);
  process.exit(1);
});
