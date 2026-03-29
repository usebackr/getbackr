ALTER TABLE "kyc_profiles" ADD COLUMN IF NOT EXISTS "selfie_url" varchar(1024);--> statement-breakpoint
ALTER TABLE "kyc_profiles" ADD COLUMN IF NOT EXISTS "rejection_reason" text;