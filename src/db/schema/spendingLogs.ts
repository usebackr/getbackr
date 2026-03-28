import { pgTable, uuid, text, numeric, date, timestamp } from 'drizzle-orm/pg-core';
import { campaigns } from './campaigns';

export const spendingLogs = pgTable('spending_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id')
    .notNull()
    .references(() => campaigns.id),
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  entryDate: date('entry_date').notNull(),
  receiptUrl: text('receipt_url'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type SpendingLog = typeof spendingLogs.$inferSelect;
export type NewSpendingLog = typeof spendingLogs.$inferInsert;
