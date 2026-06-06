import { pgTable, text, timestamp, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const apiTokensTable = pgTable("api_tokens", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  token: text("token").notNull().unique(),
  label: text("label").notNull().default("default"),
  linkedDomainId: integer("linked_domain_id"),
  usageCount: integer("usage_count").notNull().default(0),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertApiTokenSchema = createInsertSchema(apiTokensTable).omit({ id: true, createdAt: true });
export type InsertApiToken = z.infer<typeof insertApiTokenSchema>;
export type ApiToken = typeof apiTokensTable.$inferSelect;
