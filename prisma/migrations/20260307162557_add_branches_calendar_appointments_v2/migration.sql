/*
  Warnings:

  - Added the required column `categoryId` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `categoryNameSnapshot` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerNameSnapshot` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `durationMin` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `professionalNameSnapshot` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serviceNameSnapshot` to the `Appointment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AppointmentSource" AS ENUM ('PANEL', 'WHATSAPP', 'WEB', 'SYSTEM', 'IMPORTED');

-- CreateEnum
CREATE TYPE "CalendarBlockScope" AS ENUM ('TENANT', 'BRANCH', 'PROFESSIONAL');

-- CreateEnum
CREATE TYPE "CalendarBlockType" AS ENUM ('BREAK', 'LUNCH', 'MEETING', 'MAINTENANCE', 'HOLIDAY', 'MANUAL', 'OTHER');

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "branchId" TEXT,
ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "categoryId" TEXT NOT NULL,
ADD COLUMN     "categoryNameSnapshot" TEXT NOT NULL,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "createdByUserId" TEXT,
ADD COLUMN     "customerNameSnapshot" TEXT NOT NULL,
ADD COLUMN     "durationMin" INTEGER NOT NULL,
ADD COLUMN     "finalPrice" DECIMAL(10,2),
ADD COLUMN     "professionalNameSnapshot" TEXT NOT NULL,
ADD COLUMN     "serviceNameSnapshot" TEXT NOT NULL,
ADD COLUMN     "source" "AppointmentSource" NOT NULL DEFAULT 'PANEL';

-- AlterTable
ALTER TABLE "BusinessHour" ADD COLUMN     "branchId" TEXT;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "lastVisitAt" TIMESTAMP(3),
ADD COLUMN     "noShowCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "preferredCategoryId" TEXT,
ADD COLUMN     "preferredProfessionalId" TEXT,
ADD COLUMN     "totalVisits" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Professional" ADD COLUMN     "branchId" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ProfessionalHour" ADD COLUMN     "branchId" TEXT;

-- AlterTable
ALTER TABLE "ProfessionalTimeOff" ADD COLUMN     "branchId" TEXT;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "branchId" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarBlock" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT,
    "professionalId" TEXT,
    "scope" "CalendarBlockScope" NOT NULL,
    "type" "CalendarBlockType" NOT NULL DEFAULT 'MANUAL',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Branch_tenantId_isActive_idx" ON "Branch"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "Branch_tenantId_deletedAt_idx" ON "Branch"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "CalendarBlock_tenantId_startAt_idx" ON "CalendarBlock"("tenantId", "startAt");

-- CreateIndex
CREATE INDEX "CalendarBlock_branchId_idx" ON "CalendarBlock"("branchId");

-- CreateIndex
CREATE INDEX "CalendarBlock_professionalId_idx" ON "CalendarBlock"("professionalId");

-- CreateIndex
CREATE INDEX "CalendarBlock_tenantId_scope_startAt_idx" ON "CalendarBlock"("tenantId", "scope", "startAt");

-- CreateIndex
CREATE INDEX "Appointment_tenantId_branchId_startAt_idx" ON "Appointment"("tenantId", "branchId", "startAt");

-- CreateIndex
CREATE INDEX "Appointment_tenantId_professionalId_startAt_endAt_idx" ON "Appointment"("tenantId", "professionalId", "startAt", "endAt");

-- CreateIndex
CREATE INDEX "Appointment_tenantId_categoryId_startAt_idx" ON "Appointment"("tenantId", "categoryId", "startAt");

-- CreateIndex
CREATE INDEX "Appointment_tenantId_source_idx" ON "Appointment"("tenantId", "source");

-- CreateIndex
CREATE INDEX "Appointment_branchId_idx" ON "Appointment"("branchId");

-- CreateIndex
CREATE INDEX "Appointment_categoryId_idx" ON "Appointment"("categoryId");

-- CreateIndex
CREATE INDEX "Appointment_createdByUserId_idx" ON "Appointment"("createdByUserId");

-- CreateIndex
CREATE INDEX "BusinessHour_branchId_idx" ON "BusinessHour"("branchId");

-- CreateIndex
CREATE INDEX "Category_tenantId_deletedAt_idx" ON "Category"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "Customer_preferredCategoryId_idx" ON "Customer"("preferredCategoryId");

-- CreateIndex
CREATE INDEX "Customer_preferredProfessionalId_idx" ON "Customer"("preferredProfessionalId");

-- CreateIndex
CREATE INDEX "Customer_tenantId_deletedAt_idx" ON "Customer"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "Professional_branchId_idx" ON "Professional"("branchId");

-- CreateIndex
CREATE INDEX "Professional_tenantId_deletedAt_idx" ON "Professional"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "ProfessionalHour_branchId_idx" ON "ProfessionalHour"("branchId");

-- CreateIndex
CREATE INDEX "ProfessionalTimeOff_branchId_idx" ON "ProfessionalTimeOff"("branchId");

-- CreateIndex
CREATE INDEX "Service_tenantId_deletedAt_idx" ON "Service"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "User_branchId_idx" ON "User"("branchId");

-- CreateIndex
CREATE INDEX "User_tenantId_deletedAt_idx" ON "User"("tenantId", "deletedAt");

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_preferredCategoryId_fkey" FOREIGN KEY ("preferredCategoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_preferredProfessionalId_fkey" FOREIGN KEY ("preferredProfessionalId") REFERENCES "Professional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Professional" ADD CONSTRAINT "Professional_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessHour" ADD CONSTRAINT "BusinessHour_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalHour" ADD CONSTRAINT "ProfessionalHour_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalTimeOff" ADD CONSTRAINT "ProfessionalTimeOff_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarBlock" ADD CONSTRAINT "CalendarBlock_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarBlock" ADD CONSTRAINT "CalendarBlock_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarBlock" ADD CONSTRAINT "CalendarBlock_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;
