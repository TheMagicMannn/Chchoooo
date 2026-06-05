import { pgTable, text, timestamp, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const apiTokensTable = pgTable("api_tokens", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  token: text("token").notNull().unique(),
  label: text("label").notNull().default("default"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertApiTokenSchema = createInsertSchema(apiTokensTable).omit({ id: true, createdAt: true });
export type InsertApiToken = z.infer<typeof insertApiTokenSchema>;
export type ApiToken = typeof apiTokensTable.$inferSelect;
