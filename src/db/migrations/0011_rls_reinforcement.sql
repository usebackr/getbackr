-- Migration: 0011_rls_reinforcement
-- Purpose: Bridge RLS security gaps and ensure total user data isolation.

-- 1. Notifications Isolation
-- Users should own their notifications completely.
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON "notifications";
CREATE POLICY "Users can view their own notifications"
ON "notifications" FOR SELECT
TO authenticated
USING (auth.uid() = "user_id");

DROP POLICY IF EXISTS "Users can update their own notifications" ON "notifications";
CREATE POLICY "Users can update their own notifications"
ON "notifications" FOR UPDATE
TO authenticated
USING (auth.uid() = "user_id");

DROP POLICY IF EXISTS "Users can delete their own notifications" ON "notifications";
CREATE POLICY "Users can delete their own notifications"
ON "notifications" FOR DELETE
TO authenticated
USING (auth.uid() = "user_id");

-- 2. Subscription Data Isolation
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own subscriptions" ON "subscriptions";
CREATE POLICY "Users can view their own subscriptions"
ON "subscriptions" FOR SELECT
TO authenticated
USING (auth.uid() = "creator_id");

-- 3. KYC Profile Self-Service
-- Allow users to see their own verification status.
ALTER TABLE "kyc_profiles" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own KYC profile" ON "kyc_profiles";
CREATE POLICY "Users can view their own KYC profile"
ON "kyc_profiles" FOR SELECT
TO authenticated
USING (auth.uid() = "user_id");

-- 4. Bank Account Management
-- Ensure users can also update/delete their own bank accounts.
DROP POLICY IF EXISTS "Users can update their own bank accounts" ON "bank_accounts";
CREATE POLICY "Users can update their own bank accounts"
ON "bank_accounts" FOR UPDATE
TO authenticated
USING (auth.uid() = "user_id");

DROP POLICY IF EXISTS "Users can delete their own bank accounts" ON "bank_accounts";
CREATE POLICY "Users can delete their own bank accounts"
ON "bank_accounts" FOR DELETE
TO authenticated
USING (auth.uid() = "user_id");

-- 5. Strict Admin Lockdown for Audit Logs
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
-- No public/authenticated policies means only service_role/postgres can read.

-- 6. Email System Privacy
ALTER TABLE "email_campaigns" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "email_contacts" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Creators can view their own email campaigns" ON "email_campaigns";
CREATE POLICY "Creators can view their own email campaigns"
ON "email_campaigns" FOR SELECT
TO authenticated
USING (auth.uid() = "creator_id");

DROP POLICY IF EXISTS "Creators can view their own email contacts" ON "email_contacts";
CREATE POLICY "Creators can view their own email contacts"
ON "email_contacts" FOR SELECT
TO authenticated
USING (auth.uid() = "creator_id");
