ALTER TABLE "flashcards" ALTER COLUMN "term" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "flashcards" ALTER COLUMN "source" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "flashcards" ALTER COLUMN "page" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "flashcards" ALTER COLUMN "key_concept" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "flashcards" ALTER COLUMN "difficulty" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "flashcards" ALTER COLUMN "index" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "flashcards" ADD COLUMN "language" varchar(10) DEFAULT 'en' NOT NULL;