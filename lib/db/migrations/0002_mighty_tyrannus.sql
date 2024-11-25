ALTER TABLE "users" ADD COLUMN "avatar_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "main_language" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "preferred_languages" jsonb DEFAULT '["en"]'::jsonb;