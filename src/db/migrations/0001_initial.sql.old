-- Migration: 0001_initial
-- Creates all tables for the Backr platform

-- Enums
CREATE TYPE kyc_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE premium_status AS ENUM ('none', 'active', 'grace');
CREATE TYPE campaign_status AS ENUM ('draft', 'active', 'closed', 'cancelled');
CREATE TYPE contribution_status AS ENUM ('pending', 'confirmed', 'failed');
CREATE TYPE withdrawal_status AS ENUM ('pending_otp', 'processing', 'completed', 'expired');
CREATE TYPE boost_tier AS ENUM ('basic', 'standard', 'premium');
CREATE TYPE boost_status AS ENUM ('pending', 'active', 'expired');
CREATE TYPE recipient_source AS ENUM ('backers', 'imported', 'both');
CREATE TYPE email_campaign_status AS ENUM ('draft', 'sending', 'sent', 'failed');
CREATE TYPE contact_source AS ENUM ('backer', 'imported');
CREATE TYPE subscription_plan AS ENUM ('monthly', 'yearly');
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired', 'grace');

-- users
CREATE TABLE users (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                VARCHAR(255) NOT NULL UNIQUE,
  password_hash        VARCHAR(255) NOT NULL,
  display_name         VARCHAR(100) NOT NULL,
  username             VARCHAR(50) UNIQUE,
  bio                  TEXT,
  avatar_url           TEXT,
  category             VARCHAR(50),
  social_links         JSONB,
  email_verified       BOOLEAN NOT NULL DEFAULT false,
  kyc_status           kyc_status NOT NULL DEFAULT 'pending',
  kyc_rejection_reason TEXT,
  totp_secret          TEXT,
  sms_2fa_phone        VARCHAR(20),
  failed_login_count   INT NOT NULL DEFAULT 0,
  locked_until         TIMESTAMPTZ,
  premium_status       premium_status NOT NULL DEFAULT 'none',
  premium_expires_at   TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_users_kyc_status ON users (kyc_status);

-- campaigns
CREATE TABLE campaigns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id      UUID NOT NULL REFERENCES users (id),
  slug            VARCHAR(100) NOT NULL UNIQUE,
  title           VARCHAR(200) NOT NULL,
  description     TEXT,
  cover_image_url TEXT,
  category        VARCHAR(50),
  goal_amount     NUMERIC(15, 2) NOT NULL,
  currency        VARCHAR(3) NOT NULL,
  status          campaign_status NOT NULL DEFAULT 'draft',
  end_date        DATE NOT NULL,
  og_image_url    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_campaigns_creator_id ON campaigns (creator_id);
CREATE INDEX idx_campaigns_status ON campaigns (status);
CREATE INDEX idx_campaigns_category ON campaigns (category);
CREATE INDEX idx_campaigns_created_at ON campaigns (created_at DESC);
CREATE INDEX idx_campaigns_slug ON campaigns (slug);

-- Full-text search index on title and description
CREATE INDEX idx_campaigns_fts ON campaigns USING gin(
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
);

-- project_wallets
CREATE TABLE project_wallets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     UUID NOT NULL UNIQUE REFERENCES campaigns (id),
  balance         NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_received  NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_withdrawn NUMERIC(15, 2) NOT NULL DEFAULT 0,
  currency        VARCHAR(3) NOT NULL,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_wallets_campaign_id ON project_wallets (campaign_id);

-- contributions
CREATE TABLE contributions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id       UUID NOT NULL REFERENCES campaigns (id),
  backer_id         UUID REFERENCES users (id),
  backer_email      VARCHAR(255) NOT NULL,
  amount            NUMERIC(15, 2) NOT NULL,
  platform_fee      NUMERIC(15, 2) NOT NULL,
  net_amount        NUMERIC(15, 2) NOT NULL,
  currency          VARCHAR(3) NOT NULL,
  anonymous         BOOLEAN NOT NULL DEFAULT false,
  payment_reference VARCHAR(100) NOT NULL UNIQUE,
  payment_method    VARCHAR(50),
  status            contribution_status NOT NULL DEFAULT 'pending',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contributions_campaign_id ON contributions (campaign_id);
CREATE INDEX idx_contributions_backer_id ON contributions (backer_id);
CREATE INDEX idx_contributions_status ON contributions (status);
CREATE INDEX idx_contributions_payment_reference ON contributions (payment_reference);

-- withdrawals
CREATE TABLE withdrawals (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id         UUID NOT NULL REFERENCES project_wallets (id),
  creator_id        UUID NOT NULL REFERENCES users (id),
  amount            NUMERIC(15, 2) NOT NULL,
  otp_code_hash     VARCHAR(255),
  otp_expires_at    TIMESTAMPTZ,
  status            withdrawal_status NOT NULL DEFAULT 'pending_otp',
  payment_reference VARCHAR(100),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_withdrawals_wallet_id ON withdrawals (wallet_id);
CREATE INDEX idx_withdrawals_creator_id ON withdrawals (creator_id);
CREATE INDEX idx_withdrawals_status ON withdrawals (status);

-- spending_logs
CREATE TABLE spending_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id  UUID NOT NULL REFERENCES campaigns (id),
  description  TEXT NOT NULL,
  amount       NUMERIC(15, 2) NOT NULL,
  entry_date   DATE NOT NULL,
  receipt_url  TEXT,
  deleted_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_spending_logs_campaign_id ON spending_logs (campaign_id);
CREATE INDEX idx_spending_logs_deleted_at ON spending_logs (deleted_at);

-- campaign_updates
CREATE TABLE campaign_updates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id  UUID NOT NULL REFERENCES campaigns (id),
  title        VARCHAR(200) NOT NULL,
  body         TEXT NOT NULL,
  media_url    TEXT,
  deleted_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_campaign_updates_campaign_id ON campaign_updates (campaign_id);
CREATE INDEX idx_campaign_updates_created_at ON campaign_updates (created_at DESC);

-- boost_purchases
CREATE TABLE boost_purchases (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id       UUID NOT NULL REFERENCES campaigns (id),
  tier              boost_tier NOT NULL,
  price_amount      NUMERIC(10, 2) NOT NULL,
  currency          VARCHAR(3) NOT NULL,
  starts_at         TIMESTAMPTZ,
  expires_at        TIMESTAMPTZ,
  payment_reference VARCHAR(100),
  status            boost_status NOT NULL DEFAULT 'pending',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_boost_purchases_campaign_id ON boost_purchases (campaign_id);
CREATE INDEX idx_boost_purchases_status ON boost_purchases (status);
CREATE INDEX idx_boost_purchases_expires_at ON boost_purchases (expires_at);

-- email_campaigns
CREATE TABLE email_campaigns (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id       UUID NOT NULL REFERENCES users (id),
  campaign_id      UUID REFERENCES campaigns (id),
  subject          VARCHAR(255) NOT NULL,
  body_html        TEXT NOT NULL,
  recipient_source recipient_source NOT NULL,
  status           email_campaign_status NOT NULL DEFAULT 'draft',
  sent_count       INT NOT NULL DEFAULT 0,
  open_count       INT NOT NULL DEFAULT 0,
  click_count      INT NOT NULL DEFAULT 0,
  sent_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_campaigns_creator_id ON email_campaigns (creator_id);
CREATE INDEX idx_email_campaigns_campaign_id ON email_campaigns (campaign_id);

-- email_contacts
CREATE TABLE email_contacts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id       UUID NOT NULL REFERENCES users (id),
  email            VARCHAR(255) NOT NULL,
  unsubscribed     BOOLEAN NOT NULL DEFAULT false,
  unsubscribed_at  TIMESTAMPTZ,
  source           contact_source NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_contacts_creator_id ON email_contacts (creator_id);
CREATE INDEX idx_email_contacts_email ON email_contacts (email);
CREATE UNIQUE INDEX idx_email_contacts_creator_email ON email_contacts (creator_id, email);

-- subscriptions
CREATE TABLE subscriptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id            UUID NOT NULL REFERENCES users (id),
  plan                  subscription_plan NOT NULL,
  status                subscription_status NOT NULL,
  current_period_start  TIMESTAMPTZ NOT NULL,
  current_period_end    TIMESTAMPTZ NOT NULL,
  payment_reference     VARCHAR(100),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_creator_id ON subscriptions (creator_id);
CREATE INDEX idx_subscriptions_status ON subscriptions (status);

-- audit_logs
CREATE TABLE audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id      UUID,
  event_type    VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id   UUID,
  metadata      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_actor_id ON audit_logs (actor_id);
CREATE INDEX idx_audit_logs_event_type ON audit_logs (event_type);
CREATE INDEX idx_audit_logs_resource_type_id ON audit_logs (resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at DESC);
