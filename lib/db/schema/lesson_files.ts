import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const lesson_files = pgTable('lesson_files', {
  id: serial('id').primaryKey(),
  file_name: text('file_name').notNull(),
  file_url: text('file_url').notNull(),
  mime_type: text('mime_type').notNull(),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});
