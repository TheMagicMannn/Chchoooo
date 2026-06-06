import { Router } from "express";
import { db, eventsTable, usersTable } from "@workspace/db";
import { eq, and, gte, count } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { PLAN_MONTHLY_LIMITS } from "../middlewares/monthlyQuota";
import { stripeStorage } from "../stripeStorage";
import { getUncachableStripeClient } from "../stripeClient";
import { logger } from "../lib/logger";

const router = Router();

const PLAN_PRICES: Record<string, string> = {
  free:       "$0",
  growth:     "$49.99",
  enterprise: "$499.00",
};

const PLAN_LABELS: Record<string, string> = {
  free:       "Free",
  growth:     "Growth",
  enterprise: "Enterprise",
};

function startOfMonth(): Date {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function startOfNextMonth(): Date {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() + 1, 1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

router.get("/usage", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;

    const [userRows, countRows] = await Promise.all([
      db.select({ plan: usersTable.plan })
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1),
      db.select({ value: count() })
        .from(eventsTable)
        .where(and(
          eq(eventsTable.userId, userId),
          gte(eventsTable.createdAt, startOfMonth()),
        )),
    ]);

    const plan      = userRows[0]?.plan ?? "free";
    const used      = Number(countRows[0]?.value ?? 0);
    const quota     = PLAN_MONTHLY_LIMITS[plan] ?? PLAN_MONTHLY_LIMITS.free;
    const resetAt   = startOfNextMonth().toISOString();
    const pctUsed   = quota > 0 ? Math.min(100, Math.round((used / quota) * 100)) : 0;

    res.json({
      plan,
      planLabel:  PLAN_LABELS[plan]  ?? plan,
      price:      PLAN_PRICES[plan]  ?? "$0",
      eventsUsed: used,
      quota,
      pctUsed,
      resetAt,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch billing usage" });
  }
});

export default router;
