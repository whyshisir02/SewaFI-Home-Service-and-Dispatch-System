-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "link" TEXT;

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "subCategoryId" TEXT;

-- CreateTable
CREATE TABLE "provider_areas" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "municipality" TEXT,

    CONSTRAINT "provider_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_sub_categories" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "subCategoryId" TEXT NOT NULL,

    CONSTRAINT "provider_sub_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "categoryId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sub_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "provider_areas_providerId_idx" ON "provider_areas"("providerId");

-- CreateIndex
CREATE INDEX "provider_areas_province_district_idx" ON "provider_areas"("province", "district");

-- CreateIndex
CREATE UNIQUE INDEX "provider_sub_categories_providerId_subCategoryId_key" ON "provider_sub_categories"("providerId", "subCategoryId");

-- CreateIndex
CREATE INDEX "sub_categories_categoryId_idx" ON "sub_categories"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "sub_categories_name_categoryId_key" ON "sub_categories"("name", "categoryId");

-- CreateIndex
CREATE INDEX "services_subCategoryId_idx" ON "services"("subCategoryId");

-- AddForeignKey
ALTER TABLE "provider_areas" ADD CONSTRAINT "provider_areas_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "provider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_sub_categories" ADD CONSTRAINT "provider_sub_categories_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "provider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_sub_categories" ADD CONSTRAINT "provider_sub_categories_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "sub_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_categories" ADD CONSTRAINT "sub_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "service_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "sub_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
