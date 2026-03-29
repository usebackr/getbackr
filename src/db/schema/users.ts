import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  pgEnum,
  jsonb,
} from 'drizzle-orm/pg-core';

export const kycStatusEnum = pgEnum('kyc_status', ['unsubmitted', 'pending', 'verified', 'rejected']);
export const premiumStatusEnum = pgEnum('premium_status', ['none', 'active', 'grace']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  username: varchar('username', { length: 50 }).unique(),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  category: varchar('category', { length: 50 }),
  socialLinks: jsonb('social_links'),
  emailVerified: boolean('email_verified').notNull().default(false),
  kycStatus: kycStatusEnum('kyc_status').notNull().default('unsubmitted'),
  kycRejectionReason: text('kyc_rejection_reason'),
  totpSecret: text('totp_secret'),
  sms2faPhone: varchar('sms_2fa_phone', { length: 20 }),
  failedLoginCount: integer('failed_login_count').notNull().default(0),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
  premiumStatus: premiumStatusEnum('premium_status').notNull().default('none'),
  premiumExpiresAt: timestamp('premium_expires_at', { withTimezone: true }),
  isBeta: boolean('is_beta').notNull().default(false),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
