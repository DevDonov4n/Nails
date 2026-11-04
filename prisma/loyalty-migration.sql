-- Execute este script uma única vez no banco SQLite/Turso após publicar a atualização.
-- Ele cria os campos de fidelidade e converte atendimentos concluídos anteriores em recompensas disponíveis.

ALTER TABLE "User"
ADD COLUMN "loyaltyRewardsAvailable" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Booking"
ADD COLUMN "loyaltyDiscount" INTEGER NOT NULL DEFAULT 0;

UPDATE "User"
SET "loyaltyRewardsAvailable" = (
  SELECT CAST(COUNT(*) / 5 AS INTEGER)
  FROM "Booking"
  WHERE "Booking"."userId" = "User"."id"
    AND "Booking"."status" = 'COMPLETED'
);
