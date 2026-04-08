import { pgTable, uuid, varchar, timestamp, boolean } from 'drizzle-orm/pg-core';
import { users } from './users';

export const authOtps = pgTable('auth_otps', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  otpHash: varchar('otp_hash', { length: 255 }).notNull(),
  purpose: varchar('purpose', { length: 50 }).notNull(), // e.g. 'bank_change'
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  used: boolean('used').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type AuthOtp = typeof authOtps.$inferSelect;
export type NewAuthOtp = typeof authOtps.$inferInsert;
