import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const siteImagesTable = pgTable("site_images", {
  id: serial("id").primaryKey(),
  slot: text("slot").notNull().unique(),
  objectPath: text("object_path").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const insertSiteImageSchema = createInsertSchema(siteImagesTable).omit({ id: true, uploadedAt: true });
export type InsertSiteImage = z.infer<typeof insertSiteImageSchema>;
export type SiteImage = typeof siteImagesTable.$inferSelect;
