-- Add logoUrl to Tenant
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;

-- Add icon to Category
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "icon" TEXT;
