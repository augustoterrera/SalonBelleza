/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `BusinessHour` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `ProfessionalHour` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tenantId,branchId,dayOfWeek]` on the table `BusinessHour` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[professionalId,dayOfWeek]` on the table `ProfessionalHour` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "BusinessHour" DROP CONSTRAINT "BusinessHour_branchId_fkey";

-- DropForeignKey
ALTER TABLE "BusinessHour" DROP CONSTRAINT "BusinessHour_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "CalendarBlock" DROP CONSTRAINT "CalendarBlock_branchId_fkey";

-- DropForeignKey
ALTER TABLE "CalendarBlock" DROP CONSTRAINT "CalendarBlock_professionalId_fkey";

-- DropForeignKey
ALTER TABLE "CalendarBlock" DROP CONSTRAINT "CalendarBlock_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "ProfessionalHour" DROP CONSTRAINT "ProfessionalHour_branchId_fkey";

-- DropForeignKey
ALTER TABLE "ProfessionalHour" DROP CONSTRAINT "ProfessionalHour_professionalId_fkey";

-- DropForeignKey
ALTER TABLE "ProfessionalHour" DROP CONSTRAINT "ProfessionalHour_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "ProfessionalTimeOff" DROP CONSTRAINT "ProfessionalTimeOff_branchId_fkey";

-- DropForeignKey
ALTER TABLE "ProfessionalTimeOff" DROP CONSTRAINT "ProfessionalTimeOff_professionalId_fkey";

-- DropForeignKey
ALTER TABLE "ProfessionalTimeOff" DROP CONSTRAINT "ProfessionalTimeOff_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Service" DROP CONSTRAINT "Service_tenantId_fkey";

-- DropIndex
DROP INDEX "Appointment_categoryId_idx";

-- DropIndex
DROP INDEX "Appointment_createdByUserId_idx";

-- DropIndex
DROP INDEX "Appointment_tenantId_branchId_startAt_idx";

-- DropIndex
DROP INDEX "Appointment_tenantId_categoryId_startAt_idx";

-- DropIndex
DROP INDEX "Appointment_tenantId_customerId_idx";

-- DropIndex
DROP INDEX "Appointment_tenantId_professionalId_startAt_endAt_idx";

-- DropIndex
DROP INDEX "Appointment_tenantId_source_idx";

-- DropIndex
DROP INDEX "Appointment_tenantId_status_idx";

-- DropIndex
DROP INDEX "Branch_tenantId_deletedAt_idx";

-- DropIndex
DROP INDEX "Branch_tenantId_isActive_idx";

-- DropIndex
DROP INDEX "BusinessHour_branchId_idx";

-- DropIndex
DROP INDEX "BusinessHour_tenantId_dayOfWeek_idx";

-- DropIndex
DROP INDEX "CalendarBlock_branchId_idx";

-- DropIndex
DROP INDEX "CalendarBlock_professionalId_idx";

-- DropIndex
DROP INDEX "CalendarBlock_tenantId_scope_startAt_idx";

-- DropIndex
DROP INDEX "CalendarBlock_tenantId_startAt_idx";

-- DropIndex
DROP INDEX "Category_tenantId_deletedAt_idx";

-- DropIndex
DROP INDEX "Category_tenantId_isActive_idx";

-- DropIndex
DROP INDEX "Customer_preferredCategoryId_idx";

-- DropIndex
DROP INDEX "Customer_preferredProfessionalId_idx";

-- DropIndex
DROP INDEX "Customer_tenantId_deletedAt_idx";

-- DropIndex
DROP INDEX "Customer_tenantId_name_idx";

-- DropIndex
DROP INDEX "Customer_tenantId_phone_idx";

-- DropIndex
DROP INDEX "Customer_tenantId_whatsapp_idx";

-- DropIndex
DROP INDEX "Professional_branchId_idx";

-- DropIndex
DROP INDEX "Professional_tenantId_deletedAt_idx";

-- DropIndex
DROP INDEX "Professional_tenantId_isActive_idx";

-- DropIndex
DROP INDEX "Professional_tenantId_name_idx";

-- DropIndex
DROP INDEX "ProfessionalCategory_categoryId_idx";

-- DropIndex
DROP INDEX "ProfessionalHour_branchId_idx";

-- DropIndex
DROP INDEX "ProfessionalHour_tenantId_professionalId_dayOfWeek_idx";

-- DropIndex
DROP INDEX "ProfessionalService_serviceId_idx";

-- DropIndex
DROP INDEX "ProfessionalTimeOff_branchId_idx";

-- DropIndex
DROP INDEX "ProfessionalTimeOff_tenantId_professionalId_startAt_idx";

-- DropIndex
DROP INDEX "Service_tenantId_categoryId_idx";

-- DropIndex
DROP INDEX "Service_tenantId_categoryId_name_key";

-- DropIndex
DROP INDEX "Service_tenantId_deletedAt_idx";

-- DropIndex
DROP INDEX "Service_tenantId_isActive_idx";

-- DropIndex
DROP INDEX "User_branchId_idx";

-- DropIndex
DROP INDEX "User_professionalId_idx";

-- DropIndex
DROP INDEX "User_tenantId_deletedAt_idx";

-- DropIndex
DROP INDEX "User_tenantId_role_idx";

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "customerPhoneSnapshot" TEXT,
ADD COLUMN     "customerWhatsappSnapshot" TEXT;

-- AlterTable
ALTER TABLE "BusinessHour" DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "source" TEXT;

-- AlterTable
ALTER TABLE "ProfessionalHour" DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "allowOnlineBooking" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "serviceId" TEXT,
    "productId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "discount" DECIMAL(10,2),
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT,
    "total" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleItem" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "productId" TEXT,
    "serviceId" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SaleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Automation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "triggerMin" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Automation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT,
    "appointmentId" TEXT,
    "channel" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Appointment_customerId_idx" ON "Appointment"("customerId");

-- CreateIndex
CREATE INDEX "Branch_tenantId_idx" ON "Branch"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessHour_tenantId_branchId_dayOfWeek_key" ON "BusinessHour"("tenantId", "branchId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "Customer_tenantId_idx" ON "Customer"("tenantId");

-- CreateIndex
CREATE INDEX "Professional_tenantId_idx" ON "Professional"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalHour_professionalId_dayOfWeek_key" ON "ProfessionalHour"("professionalId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessHour" ADD CONSTRAINT "BusinessHour_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessHour" ADD CONSTRAINT "BusinessHour_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalHour" ADD CONSTRAINT "ProfessionalHour_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalHour" ADD CONSTRAINT "ProfessionalHour_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalHour" ADD CONSTRAINT "ProfessionalHour_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalTimeOff" ADD CONSTRAINT "ProfessionalTimeOff_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalTimeOff" ADD CONSTRAINT "ProfessionalTimeOff_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalTimeOff" ADD CONSTRAINT "ProfessionalTimeOff_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarBlock" ADD CONSTRAINT "CalendarBlock_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarBlock" ADD CONSTRAINT "CalendarBlock_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarBlock" ADD CONSTRAINT "CalendarBlock_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Automation" ADD CONSTRAINT "Automation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageLog" ADD CONSTRAINT "MessageLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageLog" ADD CONSTRAINT "MessageLog_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageLog" ADD CONSTRAINT "MessageLog_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
