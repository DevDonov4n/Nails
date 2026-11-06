-- Eventos promocionais e controle de funcionalidades da plataforma Nails.
-- Execute uma única vez no banco Turso/SQLite antes de publicar a versão que utiliza estes modelos.

CREATE TABLE "PlatformFeature" (
  "key" TEXT NOT NULL PRIMARY KEY,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "PlatformEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "type" TEXT NOT NULL,
  "discountPercent" INTEGER,
  "startsAt" DATETIME NOT NULL,
  "endsAt" DATETIME NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE INDEX "PlatformEvent_type_active_startsAt_endsAt_idx"
ON "PlatformEvent"("type", "active", "startsAt", "endsAt");

ALTER TABLE "Booking" ADD COLUMN "promotionalDiscount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Booking" ADD COLUMN "campaignEventId" TEXT;

-- Campanha inaugural: 10% sobre serviços em agendamentos criados no período.
INSERT INTO "PlatformEvent" (
  "id", "title", "description", "type", "discountPercent",
  "startsAt", "endsAt", "active", "createdAt", "updatedAt"
) VALUES (
  'launch-campaign-2026',
  'Campanha de inauguração',
  '10% de desconto nos serviços para agendamentos criados entre 01/12/2026 e 25/12/2026. A taxa de deslocamento não recebe desconto.',
  'LAUNCH_DISCOUNT',
  10,
  '2026-12-01T03:00:00.000Z',
  '2026-12-26T02:59:59.000Z',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
