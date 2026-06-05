import { pgTable, text, timestamp, serial, real, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const eventsTable = pgTable("events", {
  id: serial("id").primaryKey(),
  tokenId: text("token_id").notNull(),
  userId: text("user_id").notNull(),
  sessionId: text("session_id").notNull(),
  domain: text("domain"),
  eventType: text("event_type").notNull().default("page_view"),
  score: real("score"),
  verdict: text("verdict"),
  country: text("country"),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  durationMs: real("duration_ms"),
  signals: json("signals"),
  flags: json("flags"),
  factors: json("factors"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertEventSchema = createInsertSchema(eventsTable).omit({ id: true, createdAt: true });
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof eventsTable.$inferSelect;
