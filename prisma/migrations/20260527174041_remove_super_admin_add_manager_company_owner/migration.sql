-- Remove SUPER_ADMIN from user_role enum and update existing records
-- AlterEnum
BEGIN;
-- First update any existing SUPER_ADMIN users to ADMIN
UPDATE "users" SET "role" = 'ADMIN' WHERE "role" = 'SUPER_ADMIN';

CREATE TYPE "user_role_new" AS ENUM ('PLATFORM_ADMIN', 'ADMIN', 'MANAGER', 'SELLER');
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "user_role_new" USING ("role"::text::"user_role_new");
ALTER TYPE "user_role" RENAME TO "user_role_old";
ALTER TYPE "user_role_new" RENAME TO "user_role";
DROP TYPE "user_role_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'SELLER';
COMMIT;

-- AlterTable: add owner_id to companies
ALTER TABLE "companies" ADD COLUMN "owner_id" TEXT;

-- AlterTable: add manager_id to users
ALTER TABLE "users" ADD COLUMN "manager_id" TEXT;

-- CreateIndex
CREATE INDEX "companies_tenant_id_owner_id_idx" ON "companies"("tenant_id", "owner_id");

-- CreateIndex
CREATE INDEX "users_tenant_id_manager_id_idx" ON "users"("tenant_id", "manager_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
