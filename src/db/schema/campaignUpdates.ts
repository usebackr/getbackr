import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { campaigns } from './campaigns';

export const campaignUpdates = pgTable('campaign_updates', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id')
    .notNull()
    .references(() => campaigns.id),
  title: varchar('title', { length: 200 }).notNull(),
  body: text('body').notNull(),
  mediaUrl: text('media_url'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type CampaignUpdate = typeof campaignUpdates.$inferSelect;
export type NewCampaignUpdate = typeof campaignUpdates.$inferInsert;
