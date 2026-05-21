-- AlterTable
ALTER TABLE "services" ADD COLUMN     "imagePublicId" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatarPublicId" TEXT,
ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false;
