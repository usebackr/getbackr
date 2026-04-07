ALTER TABLE "project_wallets" ADD COLUMN "subaccount_code" varchar(100);--> statement-breakpoint
ALTER TABLE "contributions" ADD COLUMN "message" varchar(500);--> statement-breakpoint
ALTER TABLE "withdrawals" ADD COLUMN "reason" text;--> statement-breakpoint
ALTER TABLE "withdrawals" ADD COLUMN "account_number" varchar(50);--> statement-breakpoint
ALTER TABLE "withdrawals" ADD COLUMN "bank_code" varchar(50);--> statement-breakpoint
ALTER TABLE "withdrawals" ADD COLUMN "account_name" varchar(255);--> statement-breakpoint
ALTER TABLE "withdrawals" ADD COLUMN "payout_reference" varchar(100);--> statement-breakpoint
ALTER TABLE "spending_logs" ADD COLUMN "withdrawal_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "spending_logs" ADD CONSTRAINT "spending_logs_withdrawal_id_withdrawals_id_fk" FOREIGN KEY ("withdrawal_id") REFERENCES "public"."withdrawals"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
