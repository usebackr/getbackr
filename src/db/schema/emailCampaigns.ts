import { pgTable, uuid, varchar, text, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';
import { campaigns } from './campaigns';

export const recipientSourceEnum = pgEnum('recipient_source', ['backers', 'imported', 'both']);
export const emailCampaignStatusEnum = pgEnum('email_campaign_status', [
  'draft',
  'sending',
  'sent',
  'failed',
]);

export const emailCampaigns = pgTable('email_campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  creatorId: uuid('creator_id')
    .notNull()
    .references(() => users.id),
  campaignId: uuid('campaign_id').references(() => campaigns.id),
  subject: varchar('subject', { length: 255 }).notNull(),
  bodyHtml: text('body_html').notNull(),
  recipientSource: recipientSourceEnum('recipient_source').notNull(),
  status: emailCampaignStatusEnum('status').notNull().default('draft'),
  sentCount: integer('sent_count').notNull().default(0),
  openCount: integer('open_count').notNull().default(0),
  clickCount: integer('click_count').notNull().default(0),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type EmailCampaign = typeof emailCampaigns.$inferSelect;
export type NewEmailCampaign = typeof emailCampaigns.$inferInsert;
