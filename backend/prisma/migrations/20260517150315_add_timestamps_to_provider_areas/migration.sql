-- AlterTable
ALTER TABLE "provider_areas" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "provider_areas_province_district_municipality_idx" ON "provider_areas"("province", "district", "municipality");
