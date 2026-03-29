-- 2. Update the default value for the column
ALTER TABLE "users" ALTER COLUMN "kyc_status" SET DEFAULT 'unsubmitted';
--> statement-breakpoint

-- 3. Transition existing "Fake Pending" users to 'unsubmitted'
-- These are users whose status is 'pending' but have never actually submitted a KYC profile record.
UPDATE "users" 
SET "kyc_status" = 'unsubmitted' 
WHERE "kyc_status" = 'pending' 
AND NOT EXISTS (
    SELECT 1 FROM "kyc_profiles" WHERE "kyc_profiles"."user_id" = "users"."id"
);
