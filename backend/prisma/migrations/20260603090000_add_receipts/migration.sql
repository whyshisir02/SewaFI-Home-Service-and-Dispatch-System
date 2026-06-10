CREATE TABLE "receipts" (
    "id" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "providerId" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'NPR',
    "grossAmount" DECIMAL(10,2),
    "finalAmount" DECIMAL(10,2),
    "platformFeeAmount" DECIMAL(10,2),
    "providerEarningAmount" DECIMAL(10,2),
    "paymentMethod" "PaymentMethod",
    "paymentCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "receipts_receiptNumber_key" ON "receipts"("receiptNumber");
CREATE UNIQUE INDEX "receipts_paymentId_key" ON "receipts"("paymentId");
CREATE UNIQUE INDEX "receipts_bookingId_key" ON "receipts"("bookingId");
CREATE INDEX "receipts_customerId_createdAt_idx" ON "receipts"("customerId", "createdAt");
CREATE INDEX "receipts_providerId_idx" ON "receipts"("providerId");
CREATE INDEX "receipts_paymentCompletedAt_idx" ON "receipts"("paymentCompletedAt");

ALTER TABLE "receipts" ADD CONSTRAINT "receipts_paymentId_fkey"
FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "receipts" ADD CONSTRAINT "receipts_bookingId_fkey"
FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
