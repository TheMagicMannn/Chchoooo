import { pgTable, text, timestamp, serial, real, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const alertRulesTable = pgTable("alert_rules", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  condition: text("condition").notNull().default("score_below"),
  threshold: real("threshold").notNull().default(0.3),
  domain: text("domain"),
  action: text("action").notNull().default("flag"),
  enabled: boolean("enabled").notNull().default(true),
  triggeredCount: integer("triggered_count").notNull().default(0),
  lastTriggeredAt: timestamp("last_triggered_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAlertRuleSchema = createInsertSchema(alertRulesTable).omit({ id: true, createdAt: true, lastTriggeredAt: true, triggeredCount: true });
export type InsertAlertRule = z.infer<typeof insertAlertRuleSchema>;
export type AlertRule = typeof alertRulesTable.$inferSelect;
