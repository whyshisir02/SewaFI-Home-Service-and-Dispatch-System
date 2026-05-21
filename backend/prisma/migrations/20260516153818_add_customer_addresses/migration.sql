-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "addressDistrict" TEXT,
ADD COLUMN     "addressLabel" TEXT,
ADD COLUMN     "addressLandmark" TEXT,
ADD COLUMN     "addressLatitude" DOUBLE PRECISION,
ADD COLUMN     "addressLongitude" DOUBLE PRECISION,
ADD COLUMN     "addressMunicipality" TEXT,
ADD COLUMN     "addressProvince" TEXT,
ADD COLUMN     "addressStreet" TEXT,
ADD COLUMN     "addressWard" TEXT,
ADD COLUMN     "contactName" TEXT,
ADD COLUMN     "contactPhone" TEXT;

-- CreateTable
CREATE TABLE "customer_addresses" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "label" TEXT,
    "fullName" TEXT,
    "phone" TEXT,
    "province" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "municipality" TEXT NOT NULL,
    "ward" TEXT,
    "streetAddress" TEXT NOT NULL,
    "landmark" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_addresses_customerId_idx" ON "customer_addresses"("customerId");

-- CreateIndex
CREATE INDEX "customer_addresses_province_district_municipality_idx" ON "customer_addresses"("province", "district", "municipality");

-- AddForeignKey
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
