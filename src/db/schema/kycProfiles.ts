import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const kycProfiles = pgTable('kyc_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull()
    .unique(),
  legalName: varchar('legal_name', { length: 255 }).notNull(),
  idType: varchar('id_type', { length: 50 }).notNull(),
  idNumber: varchar('id_number', { length: 100 }).notNull(),
  documentUrl: varchar('document_url', { length: 1024 }),   // ID document
  selfieUrl: varchar('selfie_url', { length: 1024 }),       // Selfie photo
  rejectionReason: text('rejection_reason'),                // Populated on admin reject
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type KycProfile = typeof kycProfiles.$inferSelect;
export type NewKycProfile = typeof kycProfiles.$inferInsert;
