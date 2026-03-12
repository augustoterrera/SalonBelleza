-- Add apiKey to Tenant
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "apiKey" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Tenant_apiKey_key" ON "Tenant"("apiKey");

-- Add break time columns to BusinessHour
ALTER TABLE "BusinessHour" ADD COLUMN IF NOT EXISTS "breakStartTime" TEXT;
ALTER TABLE "BusinessHour" ADD COLUMN IF NOT EXISTS "breakEndTime" TEXT;
