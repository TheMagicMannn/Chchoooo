import { pgTable, text, timestamp, serial, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const domainsTable = pgTable("domains", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  domain: text("domain").notNull(),
  verificationToken: text("verification_token"),
  verified: boolean("verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDomainSchema = createInsertSchema(domainsTable).omit({ id: true, createdAt: true });
export type InsertDomain = z.infer<typeof insertDomainSchema>;
export type Domain = typeof domainsTable.$inferSelect;
