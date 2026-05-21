DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DispatchState') THEN
    CREATE TYPE "DispatchState" AS ENUM ('QUEUED', 'SEARCHING', 'NOTIFIED', 'MATCHED', 'EXPIRED', 'DIRECT');
  END IF;
END $$;

ALTER TABLE "service_categories" ADD COLUMN IF NOT EXISTS "slug" TEXT;
ALTER TABLE "sub_categories" ADD COLUMN IF NOT EXISTS "slug" TEXT;
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "slug" TEXT;

UPDATE "service_categories"
SET "slug" = lower(regexp_replace(trim("name"), '[^a-zA-Z0-9]+', '-', 'g'))
WHERE "slug" IS NULL;

UPDATE "sub_categories"
SET "slug" = lower(regexp_replace(trim("name"), '[^a-zA-Z0-9]+', '-', 'g'))
WHERE "slug" IS NULL;

UPDATE "services"
SET "slug" = lower(regexp_replace(trim("name"), '[^a-zA-Z0-9]+', '-', 'g'))
WHERE "slug" IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'service_categories_slug_key') THEN
    CREATE UNIQUE INDEX "service_categories_slug_key" ON "service_categories"("slug");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'sub_categories_slug_key') THEN
    CREATE UNIQUE INDEX "sub_categories_slug_key" ON "sub_categories"("slug");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'services_slug_key') THEN
    CREATE UNIQUE INDEX "services_slug_key" ON "services"("slug");
  END IF;
END $$;

ALTER TABLE "bookings"
  ADD COLUMN IF NOT EXISTS "dispatchState" "DispatchState",
  ADD COLUMN IF NOT EXISTS "currentDispatchBatch" INTEGER,
  ADD COLUMN IF NOT EXISTS "dispatchQueuedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "dispatchStartedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "booking_status_history" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "status" "BookingStatus" NOT NULL,
  "message" TEXT,
  "actorUserId" TEXT,
  "actorRole" "Role",
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "booking_status_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "booking_status_history_bookingId_createdAt_idx"
  ON "booking_status_history"("bookingId", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'booking_status_history_bookingId_fkey'
  ) THEN
    ALTER TABLE "booking_status_history"
      ADD CONSTRAINT "booking_status_history_bookingId_fkey"
      FOREIGN KEY ("bookingId") REFERENCES "bookings"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "provider_booking_notifications" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "providerProfileId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "batchNumber" INTEGER NOT NULL DEFAULT 1,
  "expiresAt" TIMESTAMP(3),
  "respondedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "provider_booking_notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "provider_booking_notifications_bookingId_idx"
  ON "provider_booking_notifications"("bookingId");
CREATE INDEX IF NOT EXISTS "provider_booking_notifications_providerProfileId_idx"
  ON "provider_booking_notifications"("providerProfileId");
CREATE INDEX IF NOT EXISTS "provider_booking_notifications_status_idx"
  ON "provider_booking_notifications"("status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'provider_booking_notifications_bookingId_fkey'
  ) THEN
    ALTER TABLE "provider_booking_notifications"
      ADD CONSTRAINT "provider_booking_notifications_bookingId_fkey"
      FOREIGN KEY ("bookingId") REFERENCES "bookings"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'provider_booking_notifications_providerProfileId_fkey'
  ) THEN
    ALTER TABLE "provider_booking_notifications"
      ADD CONSTRAINT "provider_booking_notifications_providerProfileId_fkey"
      FOREIGN KEY ("providerProfileId") REFERENCES "provider_profiles"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
