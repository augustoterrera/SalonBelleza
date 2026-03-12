-- Add priceIsFrom to Service (was missing from initial migration)
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "priceIsFrom" BOOLEAN NOT NULL DEFAULT false;
