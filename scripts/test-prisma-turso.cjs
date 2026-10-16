
require("dotenv/config");

const { PrismaLibSQL } = require("@prisma/adapter-libsql");
const { PrismaClient } = require("@prisma/client");

async function main() {
  const adapter = new PrismaLibSQL({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  const prisma = new PrismaClient({ adapter });

  try {
    const total = await prisma.booking.count();
    console.log("Prisma conectado ao Turso com sucesso!");
    console.log("Agendamentos cadastrados:", total);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Falha no teste do Prisma:", error.message);
  process.exitCode = 1;
});
