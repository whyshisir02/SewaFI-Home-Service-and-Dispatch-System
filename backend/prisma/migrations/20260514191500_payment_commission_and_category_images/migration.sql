-- Extend existing payment status enum safely.
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'AWAITING_CONFIRMATION';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'CONFIRMED';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'DISPUTED';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';

-- New enums for payment tracking.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentMethod') THEN
    CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'MANUAL', 'ESEWA', 'KHALTI', 'BANK_TRANSFER');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PayoutStatus') THEN
    CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'SETTLED', 'HOLD', 'CANCELLED');
  END IF;
END $$;

-- Category image fields for direct admin upload support.
ALTER TABLE "service_categories"
  ADD COLUMN IF NOT EXISTS "imageUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "imagePublicId" TEXT;

-- Booking-level compatibility fields.
ALTER TABLE "bookings"
  ADD COLUMN IF NOT EXISTS "estimatedAmount" DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS "finalAmount" DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS "providerProposedAmount" DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS "providerCompletionNote" TEXT,
  ADD COLUMN IF NOT EXISTS "customerConfirmedAt" TIMESTAMP(3);

-- Payment tracking table.
CREATE TABLE IF NOT EXISTS "payments" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "providerId" TEXT,
  "grossAmount" DECIMAL(10, 2),
  "estimatedAmount" DECIMAL(10, 2),
  "providerProposedAmount" DECIMAL(10, 2),
  "finalAmount" DECIMAL(10, 2),
  "platformFeePercent" DECIMAL(5, 2) NOT NULL DEFAULT 10.00,
  "platformFeeAmount" DECIMAL(10, 2),
  "providerEarningAmount" DECIMAL(10, 2),
  "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
  "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "payoutStatus" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
  "providerNote" TEXT,
  "customerNote" TEXT,
  "disputeReason" TEXT,
  "adminNote" TEXT,
  "proposedAt" TIMESTAMP(3),
  "confirmedAt" TIMESTAMP(3),
  "paidAt" TIMESTAMP(3),
  "disputedAt" TIMESTAMP(3),
  "settledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "payments_bookingId_key" ON "payments"("bookingId");
CREATE INDEX IF NOT EXISTS "payments_customerId_idx" ON "payments"("customerId");
CREATE INDEX IF NOT EXISTS "payments_providerId_idx" ON "payments"("providerId");
CREATE INDEX IF NOT EXISTS "payments_paymentStatus_idx" ON "payments"("paymentStatus");
CREATE INDEX IF NOT EXISTS "payments_payoutStatus_idx" ON "payments"("payoutStatus");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'payments_bookingId_fkey'
  ) THEN
    ALTER TABLE "payments"
      ADD CONSTRAINT "payments_bookingId_fkey"
      FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'payments_customerId_fkey'
  ) THEN
    ALTER TABLE "payments"
      ADD CONSTRAINT "payments_customerId_fkey"
      FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'payments_providerId_fkey'
  ) THEN
    ALTER TABLE "payments"
      ADD CONSTRAINT "payments_providerId_fkey"
      FOREIGN KEY ("providerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
