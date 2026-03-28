import { pgTable, uuid, numeric, varchar, timestamp } from 'drizzle-orm/pg-core';
import { campaigns } from './campaigns';

export const projectWallets = pgTable('project_wallets', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id')
    .notNull()
    .unique()
    .references(() => campaigns.id),
  balance: numeric('balance', { precision: 15, scale: 2 }).notNull().default('0'),
  totalReceived: numeric('total_received', { precision: 15, scale: 2 }).notNull().default('0'),
  totalWithdrawn: numeric('total_withdrawn', { precision: 15, scale: 2 }).notNull().default('0'),
  currency: varchar('currency', { length: 3 }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type ProjectWallet = typeof projectWallets.$inferSelect;
export type NewProjectWallet = typeof projectWallets.$inferInsert;
