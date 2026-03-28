import { pgTable, uuid, numeric, varchar, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { campaigns } from './campaigns';

export const boostTierEnum = pgEnum('boost_tier', ['basic', 'standard', 'premium']);
export const boostStatusEnum = pgEnum('boost_status', ['pending', 'active', 'expired']);

export const boostPurchases = pgTable('boost_purchases', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id')
    .notNull()
    .references(() => campaigns.id),
  tier: boostTierEnum('tier').notNull(),
  priceAmount: numeric('price_amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  paymentReference: varchar('payment_reference', { length: 100 }),
  status: boostStatusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type BoostPurchase = typeof boostPurchases.$inferSelect;
export type NewBoostPurchase = typeof boostPurchases.$inferInsert;
