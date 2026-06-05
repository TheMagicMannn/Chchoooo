import { Router } from "express";
import { db, alertRulesTable, eventsTable } from "@workspace/db";
import { eq, and, gte, count, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const rows = await db
      .select()
      .from(alertRulesTable)
      .where(eq(alertRulesTable.userId, userId))
      .orderBy(alertRulesTable.createdAt);
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Failed to fetch alert rules" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { name, condition, threshold, domain, action } = req.body;
    if (!name) {
      res.status(400).json({ error: "name is required" });
      return;
    }
    const [row] = await db
      .insert(alertRulesTable)
      .values({
        userId,
        name: String(name),
        condition: condition || "score_below",
        threshold: typeof threshold === "number" ? threshold : 0.3,
        domain: domain || null,
        action: action || "flag",
        enabled: true,
      })
      .returning();
    res.status(201).json(row);
  } catch {
    res.status(500).json({ error: "Failed to create alert rule" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const id = Number(req.params.id);
    await db
      .delete(alertRulesTable)
      .where(and(eq(alertRulesTable.id, id), eq(alertRulesTable.userId, userId)));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to delete alert rule" });
  }
});

router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const id = Number(req.params.id);
    const { enabled, threshold, action, name } = req.body;
    const update: Record<string, any> = {};
    if (typeof enabled === "boolean") update.enabled = enabled;
    if (typeof threshold === "number") update.threshold = threshold;
    if (action) update.action = action;
    if (name) update.name = name;
    const [row] = await db
      .update(alertRulesTable)
      .set(update)
      .where(and(eq(alertRulesTable.id, id), eq(alertRulesTable.userId, userId)))
      .returning();
    res.json(row);
  } catch {
    res.status(500).json({ error: "Failed to update alert rule" });
  }
});

router.get("/stats", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totals] = await db
      .select({
        botsToday: sql<number>`count(*) filter (where ${eventsTable.verdict} = 'BOT')`,
        captchaToday: sql<number>`count(*) filter (where ${eventsTable.verdict} = 'CAPTCHA')`,
        total: count(),
      })
      .from(eventsTable)
      .where(and(eq(eventsTable.userId, userId), gte(eventsTable.createdAt, today)));

    const rules = await db
      .select()
      .from(alertRulesTable)
      .where(and(eq(alertRulesTable.userId, userId), eq(alertRulesTable.enabled, true)));

    res.json({
      botsToday: Number(totals?.botsToday ?? 0),
      captchaToday: Number(totals?.captchaToday ?? 0),
      totalToday: Number(totals?.total ?? 0),
      activeRules: rules.length,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch alert stats" });
  }
});

export default router;
