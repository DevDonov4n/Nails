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
