-- DropIndex
DROP INDEX "booking_status_history_bookingId_createdAt_idx";

-- CreateIndex
CREATE INDEX "booking_status_history_bookingId_idx" ON "booking_status_history"("bookingId");

-- CreateIndex
CREATE INDEX "booking_status_history_status_idx" ON "booking_status_history"("status");

-- CreateIndex
CREATE INDEX "booking_status_history_createdAt_idx" ON "booking_status_history"("createdAt");

-- CreateIndex
CREATE INDEX "bookings_addressProvince_addressDistrict_addressMunicipalit_idx" ON "bookings"("addressProvince", "addressDistrict", "addressMunicipality");
