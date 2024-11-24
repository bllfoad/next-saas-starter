import { pgTable, serial, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';

export const flashcards = pgTable('flashcards', {
  id: serial('id').primaryKey(),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  hint: text('hint'),
  difficulty: integer('difficulty').notNull(),
  sourceFile: text('source_file').notNull(),
  vectorEmbedding: text('vector_embedding').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const learningPaths = pgTable('learning_paths', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  difficulty: integer('difficulty').notNull(),
  order: integer('order').notNull(),
  flashcardIds: jsonb('flashcard_ids').notNull(),
  prerequisites: jsonb('prerequisites'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const userProgress = pgTable('user_progress', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  flashcardId: integer('flashcard_id').notNull(),
  pathId: integer('path_id').notNull(),
  status: text('status').notNull(), // 'not_started', 'in_progress', 'completed'
  correctAttempts: integer('correct_attempts').default(0),
  totalAttempts: integer('total_attempts').default(0),
  lastReviewedAt: timestamp('last_reviewed_at'),
  nextReviewAt: timestamp('next_review_at'),
  createdAt: timestamp('created_at').defaultNow(),
});
