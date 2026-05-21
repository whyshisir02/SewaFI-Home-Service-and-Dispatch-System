/*
  Warnings:

  - The values [UNPAID] on the enum `PaymentStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `isVerified` on the `provider_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `provider_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `rating` on the `provider_profiles` table. All the data in the column will be lost.
  - The `availability` column on the `provider_profiles` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `providerProfileId` on the `provider_services` table. All the data in the column will be lost.
  - You are about to drop the column `specialization` on the `provider_services` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `service_categories` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[providerId,serviceId]` on the table `provider_services` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `basePrice` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `categoryId` to the `provider_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `providerId` to the `provider_services` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProviderStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentStatus_new" AS ENUM ('PENDING', 'PAID', 'REFUNDED', 'CANCELLATION_FEE');
ALTER TABLE "bookings" ALTER COLUMN "paymentStatus" DROP DEFAULT;
ALTER TABLE "bookings" ALTER COLUMN "paymentStatus" TYPE "PaymentStatus_new" USING ("paymentStatus"::text::"PaymentStatus_new");
ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old";
ALTER TYPE "PaymentStatus_new" RENAME TO "PaymentStatus";
DROP TYPE "PaymentStatus_old";
ALTER TABLE "bookings" ALTER COLUMN "paymentStatus" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "provider_services" DROP CONSTRAINT "provider_services_providerProfileId_fkey";

-- DropIndex
DROP INDEX "bookings_serviceId_idx";

-- DropIndex
DROP INDEX "provider_profiles_availability_idx";

-- DropIndex
DROP INDEX "provider_profiles_location_idx";

-- DropIndex
DROP INDEX "provider_services_providerProfileId_idx";

-- DropIndex
DROP INDEX "provider_services_providerProfileId_serviceId_key";

-- DropIndex
DROP INDEX "provider_services_serviceId_idx";

-- DropIndex
DROP INDEX "refresh_tokens_userId_idx";

-- DropIndex
DROP INDEX "reviews_authorId_idx";

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "basePrice" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "cancellationFee" DECIMAL(10,2),
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "cancelledBy" TEXT,
ADD COLUMN     "district" TEXT,
ADD COLUMN     "municipality" TEXT,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "province" TEXT,
ADD COLUMN     "startedAt" TIMESTAMP(3),
ALTER COLUMN "paymentStatus" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "provider_profiles" DROP COLUMN "isVerified",
DROP COLUMN "location",
DROP COLUMN "rating",
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "categoryId" TEXT NOT NULL,
ADD COLUMN     "citizenshipBack" TEXT,
ADD COLUMN     "citizenshipBackPublicId" TEXT,
ADD COLUMN     "citizenshipFront" TEXT,
ADD COLUMN     "citizenshipFrontPublicId" TEXT,
ADD COLUMN     "citizenshipNumber" TEXT,
ADD COLUMN     "expertise" TEXT[],
ADD COLUMN     "isCurrentlyBusy" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "status" "ProviderStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
ADD COLUMN     "totalEarnings" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalReviews" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "availability",
ADD COLUMN     "availability" TEXT NOT NULL DEFAULT 'Available';

-- AlterTable
ALTER TABLE "provider_services" DROP COLUMN "providerProfileId",
DROP COLUMN "specialization",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "providerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "photoPublicIds" TEXT[],
ADD COLUMN     "photos" TEXT[],
ALTER COLUMN "rating" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "service_categories" DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "district" TEXT,
ADD COLUMN     "municipality" TEXT,
ADD COLUMN     "province" TEXT,
ADD COLUMN     "streetAddress" TEXT,
ADD COLUMN     "ward" TEXT;

-- DropEnum
DROP TYPE "AvailabilityStatus";

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nepal_locations" (
    "id" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "municipality" TEXT NOT NULL,

    CONSTRAINT "nepal_locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

-- CreateIndex
CREATE INDEX "nepal_locations_province_idx" ON "nepal_locations"("province");

-- CreateIndex
CREATE INDEX "nepal_locations_district_idx" ON "nepal_locations"("district");

-- CreateIndex
CREATE UNIQUE INDEX "nepal_locations_province_district_municipality_key" ON "nepal_locations"("province", "district", "municipality");

-- CreateIndex
CREATE INDEX "provider_profiles_categoryId_idx" ON "provider_profiles"("categoryId");

-- CreateIndex
CREATE INDEX "provider_profiles_status_idx" ON "provider_profiles"("status");

-- CreateIndex
CREATE UNIQUE INDEX "provider_services_providerId_serviceId_key" ON "provider_services"("providerId", "serviceId");

-- AddForeignKey
ALTER TABLE "provider_profiles" ADD CONSTRAINT "provider_profiles_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "service_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_services" ADD CONSTRAINT "provider_services_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "provider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
