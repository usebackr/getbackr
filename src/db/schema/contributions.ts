import { pgTable, uuid, varchar, numeric, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { campaigns } from './campaigns';
import { users } from './users';

export const contributionStatusEnum = pgEnum('contribution_status', [
  'pending',
  'confirmed',
  'failed',
]);

export const contributions = pgTable('contributions', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id')
    .notNull()
    .references(() => campaigns.id),
  backerId: uuid('backer_id').references(() => users.id),
  backerEmail: varchar('backer_email', { length: 255 }).notNull(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  platformFee: numeric('platform_fee', { precision: 15, scale: 2 }).notNull(),
  netAmount: numeric('net_amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
  anonymous: boolean('anonymous').notNull().default(false),
  backerName: varchar('backer_name', { length: 255 }),
  paymentReference: varchar('payment_reference', { length: 100 }).notNull().unique(),
  paymentMethod: varchar('payment_method', { length: 50 }),
  status: contributionStatusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Contribution = typeof contributions.$inferSelect;
export type NewContribution = typeof contributions.$inferInsert;
