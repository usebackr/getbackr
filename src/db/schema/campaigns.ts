import {
  pgTable,
  uuid,
  varchar,
  text,
  numeric,
  date,
  timestamp,
  pgEnum,
  integer,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const campaignStatusEnum = pgEnum('campaign_status', [
  'draft',
  'active',
  'closed',
  'cancelled',
]);

export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  creatorId: uuid('creator_id')
    .notNull()
    .references(() => users.id),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  coverImageUrl: text('cover_image_url'),
  category: varchar('category', { length: 50 }),
  goalAmount: numeric('goal_amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
  status: campaignStatusEnum('status').notNull().default('draft'),
  endDate: date('end_date').notNull(),
  ogImageUrl: text('og_image_url'),
  views: integer('views').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;
