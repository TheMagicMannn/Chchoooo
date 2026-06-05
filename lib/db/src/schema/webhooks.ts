import { pgTable, text, timestamp, serial, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const webhooksTable = pgTable("webhooks", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  url: text("url").notNull(),
  events: text("events").notNull().default("block,flag"),
  secret: text("secret"),
  enabled: boolean("enabled").notNull().default(true),
  lastFiredAt: timestamp("last_fired_at"),
  lastStatus: text("last_status"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWebhookSchema = createInsertSchema(webhooksTable).omit({ id: true, createdAt: true, lastFiredAt: true, lastStatus: true });
export type InsertWebhook = z.infer<typeof insertWebhookSchema>;
export type Webhook = typeof webhooksTable.$inferSelect;
