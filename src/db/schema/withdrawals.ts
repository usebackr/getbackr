import { pgTable, uuid, numeric, varchar, timestamp, pgEnum, text } from 'drizzle-orm/pg-core';
import { projectWallets } from './projectWallets';
import { users } from './users';

export const withdrawalStatusEnum = pgEnum('withdrawal_status', [
  'pending_otp',
  'processing',
  'completed',
  'expired',
  'rejected',
]);

export const withdrawals = pgTable('withdrawals', {
  id: uuid('id').primaryKey().defaultRandom(),
  walletId: uuid('wallet_id')
    .notNull()
    .references(() => projectWallets.id),
  creatorId: uuid('creator_id')
    .notNull()
    .references(() => users.id),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  otpCodeHash: varchar('otp_code_hash', { length: 255 }),
  otpExpiresAt: timestamp('otp_expires_at', { withTimezone: true }),
  status: withdrawalStatusEnum('status').notNull().default('pending_otp'),
  rejectionReason: text('rejection_reason'),
  paymentReference: varchar('payment_reference', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Withdrawal = typeof withdrawals.$inferSelect;
export type NewWithdrawal = typeof withdrawals.$inferInsert;
