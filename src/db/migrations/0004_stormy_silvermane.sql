ALTER TYPE "withdrawal_status" ADD VALUE 'rejected';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_beta" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "views" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "withdrawals" ADD COLUMN "rejection_reason" text;