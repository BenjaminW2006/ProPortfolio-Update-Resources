CREATE TABLE "site_settings" (
	"id" integer PRIMARY KEY NOT NULL,
	"data" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "category" text;