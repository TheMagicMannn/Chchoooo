import { Router } from "express";
import { db, eventsTable } from "@workspace/db";
import { eq, and, gte, desc, sql, count, lt } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.get("/stats", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;

    const [totals] = await db
      .select({
        totalEvents: count(),
        humanCount: sql<number>`count(*) filter (where ${eventsTable.verdict} = 'HUMAN')`,
        botCount: sql<number>`count(*) filter (where ${eventsTable.verdict} = 'BOT')`,
        avgScore: sql<number>`coalesce(avg(${eventsTable.score}), 0)`,
      })
      .from(eventsTable)
      .where(eq(eventsTable.userId, userId));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [todayStats] = await db
      .select({ sessionCount: count() })
      .from(eventsTable)
      .where(and(eq(eventsTable.userId, userId), gte(eventsTable.createdAt, today)));

    const recentEvents = await db
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.userId, userId))
      .orderBy(desc(eventsTable.createdAt))
      .limit(10);

    res.json({
      totalEvents: Number(totals?.totalEvents ?? 0),
      humanCount: Number(totals?.humanCount ?? 0),
      botCount: Number(totals?.botCount ?? 0),
      avgScore: Number(totals?.avgScore ?? 0),
      sessionsToday: Number(todayStats?.sessionCount ?? 0),
      humanRate:
        Number(totals?.totalEvents) > 0
          ? Math.round((Number(totals?.humanCount) / Number(totals?.totalEvents)) * 100)
          : 0,
      recentEvents,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

router.get("/logs", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Number(req.query.offset) || 0;

    const logs = await db
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.userId, userId))
      .orderBy(desc(eventsTable.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(eventsTable)
      .where(eq(eventsTable.userId, userId));

    res.json({ logs, total: Number(total) });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

router.get("/score-dist", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;

    const [dist] = await db
      .select({
        bucket0: sql<number>`count(*) filter (where ${eventsTable.score} < 0.2)`,
        bucket1: sql<number>`count(*) filter (where ${eventsTable.score} >= 0.2 and ${eventsTable.score} < 0.4)`,
        bucket2: sql<number>`count(*) filter (where ${eventsTable.score} >= 0.4 and ${eventsTable.score} < 0.6)`,
        bucket3: sql<number>`count(*) filter (where ${eventsTable.score} >= 0.6 and ${eventsTable.score} < 0.8)`,
        bucket4: sql<number>`count(*) filter (where ${eventsTable.score} >= 0.8)`,
      })
      .from(eventsTable)
      .where(eq(eventsTable.userId, userId));

    res.json([
      { bucket: "0.0–0.2", count: Number(dist?.bucket0 ?? 0) },
      { bucket: "0.2–0.4", count: Number(dist?.bucket1 ?? 0) },
      { bucket: "0.4–0.6", count: Number(dist?.bucket2 ?? 0) },
      { bucket: "0.6–0.8", count: Number(dist?.bucket3 ?? 0) },
      { bucket: "0.8–1.0", count: Number(dist?.bucket4 ?? 0) },
    ]);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch score distribution" });
  }
});

export default router;
