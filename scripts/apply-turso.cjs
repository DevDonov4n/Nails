
require("dotenv/config");

const fs = require("node:fs");
const { createClient } = require("@libsql/client");

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    throw new Error("Configure TURSO_DATABASE_URL e TURSO_AUTH_TOKEN no .env");
  }

  const sql = fs.readFileSync("prisma/init-turso.sql", "utf8");
  const db = createClient({ url, authToken });

  try {
    await db.executeMultiple(sql);
    console.log("SQL aplicado ao Turso com sucesso!");

    const result = await db.execute(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"
    );

    console.log("Tabelas encontradas:");
    for (const row of result.rows) {
      console.log("-", row.name);
    }
  } finally {
    await db.close();
  }
}

main().catch((error) => {
  console.error("Erro:", error.message);
  process.exitCode = 1;
});
