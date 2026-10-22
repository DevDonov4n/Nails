require("dotenv/config");

const { randomBytes, scrypt: scryptCallback } = require("node:crypto");
const { promisify } = require("node:util");
const { createClient } = require("@libsql/client");

const scrypt = promisify(scryptCallback);
const YEAR = 2026;
const DAYS = [2, 5, 9, 12, 16, 20, 24, 28];
const SERVICES = [
  { service: "HAND", price: 3000, label: "Mão" },
  { service: "FOOT", price: 3500, label: "Pé" },
  { service: "BOTH", price: 6000, label: "Mão + pé" },
];

const customers = [
  { id: "demo_user_01", name: "Ana Clara Martins", email: "ana.clara.demo@example.com", whatsapp: "5511991001001" },
  { id: "demo_user_02", name: "Beatriz Oliveira", email: "beatriz.demo@example.com", whatsapp: "5511991001002" },
  { id: "demo_user_03", name: "Camila Souza", email: "camila.demo@example.com", whatsapp: "5511991001003" },
  { id: "demo_user_04", name: "Isabela Ferreira", email: "isabela.demo@example.com", whatsapp: "5511991001004" },
  { id: "demo_user_05", name: "Mariana Costa", email: "mariana.demo@example.com", whatsapp: "5511991001005" },
];

function isoAt(date, hour) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour + 3, 0, 0)).toISOString();
}

function localDate(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function hourFor(date, slot) {
  const [year, month, day] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  // Horário de funcionamento do projeto: seg-sex 16h-20h; sáb-dom 9h-18h.
  if (weekday === 0 || weekday === 6) return [9, 10, 11, 13, 14, 15, 16, 17][slot % 8];
  return [16, 17, 18, 19][slot % 4];
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64);
  return `${salt}:${derived.toString("hex")}`;
}

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) {
    throw new Error("Configure TURSO_DATABASE_URL e TURSO_AUTH_TOKEN no .env. Não compartilhe esses valores.");
  }

  const db = createClient({ url, authToken });
  let insertedUsers = 0;
  let insertedBookings = 0;

  try {
    const now = new Date().toISOString();

    // As contas são apenas dados de demonstração; as senhas aleatórias não são fornecidas.
    for (const customer of customers) {
      const passwordHash = await hashPassword(randomBytes(32).toString("hex"));
      const result = await db.execute({
        sql: `INSERT OR IGNORE INTO "User"
          ("id", "name", "email", "whatsapp", "passwordHash", "createdAt", "updatedAt")
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [customer.id, customer.name, customer.email, customer.whatsapp, passwordHash, now, now],
      });
      insertedUsers += result.rowsAffected;
    }

    for (let month = 1; month <= 12; month++) {
      for (let slot = 0; slot < DAYS.length; slot++) {
        const day = DAYS[slot];
        const date = localDate(YEAR, month, day);
        const hour = hourFor(date, slot);
        const startAt = isoAt(date, hour);
        const endAt = isoAt(date, hour + 1);
        const customer = customers[(month * 3 + slot) % customers.length];
        const offering = SERVICES[(month + slot) % SERVICES.length];
        const atHome = (month + slot) % 4 === 0;
        const mobilityFee = atHome ? 500 : 0;
        const totalPrice = offering.price + mobilityFee;
        const isPastOrToday = new Date(startAt) <= new Date();
        let status;

        if (isPastOrToday) {
          status = "COMPLETED";
        } else if (month === 10) {
          status = slot % 2 === 0 ? "CONFIRMED" : "PENDING";
        } else {
          status = slot % 3 === 0 ? "CONFIRMED" : "PENDING";
        }

        const id = `demo_booking_${YEAR}_${String(month).padStart(2, "0")}_${String(slot + 1).padStart(2, "0")}`;
        const address = atHome ? "Rua das Flores, 100, Jardim Primavera (endereço fictício)" : null;

        const result = await db.execute({
          sql: `INSERT OR IGNORE INTO "Booking"
            ("id", "customerName", "whatsapp", "address", "service", "location",
             "startAt", "endAt", "status", "servicePrice", "mobilityFee",
             "totalPrice", "userId", "createdAt", "updatedAt")
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            id, customer.name, customer.whatsapp, address,
            offering.service, atHome ? "HOME" : "SALON",
            startAt, endAt, status, offering.price, mobilityFee,
            totalPrice, customer.id, now, now,
          ],
        });
        insertedBookings += result.rowsAffected;
      }
    }

    const summary = await db.execute(`
      SELECT substr("startAt", 1, 7) AS month, "status", COUNT(*) AS total
      FROM "Booking"
      WHERE "id" LIKE 'demo_booking_${YEAR}_%'
      GROUP BY substr("startAt", 1, 7), "status"
      ORDER BY month, status
    `);

    console.log(`Clientes de demonstração inseridos agora: ${insertedUsers} (meta: 5).`);
    console.log(`Agendamentos de demonstração inseridos agora: ${insertedBookings} (meta: 96).`);
    console.log("Se os números inseridos forem menores, parte dos IDs já existia; os registros existentes foram preservados.");
    console.log("\nResumo dos agendamentos de demonstração por mês/status:");
    for (const row of summary.rows) {
      console.log(`${row.month} | ${row.status} | ${row.total}`);
    }
  } finally {
    await db.close();
  }
}

main().catch((error) => {
  console.error("Falha ao inserir dados fictícios:", error.message);
  console.error("Confira se as tabelas User e Booking já existem no mesmo banco Turso usado pela aplicação.");
  process.exitCode = 1;
});
