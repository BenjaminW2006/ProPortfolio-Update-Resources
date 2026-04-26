-- Create the new projects table
CREATE TABLE IF NOT EXISTS "projects" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "date" text NOT NULL,
        "location" text NOT NULL,
        "description" text DEFAULT '' NOT NULL,
        "cover_object_path" text,
        "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Evolve site_images: make slot nullable and add project_id FK
ALTER TABLE "site_images" ALTER COLUMN "slot" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "site_images" ADD COLUMN IF NOT EXISTS "project_id" integer;
--> statement-breakpoint
ALTER TABLE "site_images" ADD CONSTRAINT "site_images_project_id_projects_id_fk"
        FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action
        NOT VALID;
--> statement-breakpoint
ALTER TABLE "site_images" VALIDATE CONSTRAINT "site_images_project_id_projects_id_fk";
