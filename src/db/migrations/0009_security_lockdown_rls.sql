-- Migration: 0009_security_lockdown_rls
-- Purpose: Enable RLS on all tables and define strict access policies to resolve Supabase security alerts.

-- 1. Enable RLS on ALL tables
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "campaigns" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "project_wallets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "contributions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "withdrawals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "spending_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "campaign_updates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "boost_purchases" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "email_campaigns" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "email_contacts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bank_accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "kyc_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "password_resets" ENABLE ROW LEVEL SECURITY;

-- 2. Define Public (Anonymous) Access Policies
-- Only non-sensitive public metadata should be visible via the external REST API.

-- Campaigns are public
DROP POLICY IF EXISTS "Campaigns are viewable by everyone" ON "campaigns";
CREATE POLICY "Campaigns are viewable by everyone" 
ON "campaigns" FOR SELECT 
USING (true);

-- Campaign updates are public
DROP POLICY IF EXISTS "Campaign updates are viewable by everyone" ON "campaign_updates";
CREATE POLICY "Campaign updates are viewable by everyone" 
ON "campaign_updates" FOR SELECT 
USING (true);

-- Contributions (public view)
-- Note: We allow viewing confirmed contributions so the community can see the support.
DROP POLICY IF EXISTS "Confirmed contributions are viewable by everyone" ON "contributions";
CREATE POLICY "Confirmed contributions are viewable by everyone" 
ON "contributions" FOR SELECT 
USING ("status" = 'confirmed');

-- Spending logs are public for transparency
DROP POLICY IF EXISTS "Spending logs are viewable by everyone" ON "spending_logs";
CREATE POLICY "Spending logs are viewable by everyone" 
ON "spending_logs" FOR SELECT 
USING (true);

-- 3. Define Authenticated User Policies (via Supabase Auth if used)
-- Even if the app uses custom auth, defining these ensures that if Supabase Auth is enabled, 
-- users can only touch their own data.

DROP POLICY IF EXISTS "Users can view their own profile" ON "users";
CREATE POLICY "Users can view their own profile" 
ON "users" FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON "users";
CREATE POLICY "Users can update their own profile" 
ON "users" FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- 4. Lockdown Sensitive Tables (No Public Access)
-- The following tables have NO public policies. 
-- They are only accessible via the Service Role/Postgres Owner (which the Next.js app uses).
-- - kyc_profiles
-- - bank_accounts
-- - withdrawals
-- - project_wallets
-- - audit_logs
-- - subscriptions
-- - email_contacts
-- - email_campaigns

-- 5. Service Role Override
-- Next.js server actions using a service role key will bypass RLS anyway, 
-- but we can explicitly allow it for clarity in some environments.
-- (Supabase standard behavior is that service_role bypasses RLS)
