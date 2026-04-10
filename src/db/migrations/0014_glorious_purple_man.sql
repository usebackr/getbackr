ALTER TABLE "users" ADD COLUMN "drip_status" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "kyc_reminder_sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "contributions" ADD COLUMN "referral_source" varchar(50);