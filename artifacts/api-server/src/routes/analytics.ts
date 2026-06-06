import { Router } from "express";
import { db, eventsTable } from "@workspace/db";
import { eq, and, gte, lte, desc, sql, count } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

function getRangeStart(range: string): Date {
  const now = new Date();
  switch (range) {
    case "1h": return new Date(now.getTime() - 60 * 60 * 1000);
    case "6h": return new Date(now.getTime() - 6 * 60 * 60 * 1000);
    case "24h": return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case "7d": return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d": return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "90d": return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    default: return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
}

router.get("/overview", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const range = String(req.query.range || "7d");
    const since = getRangeStart(range);

    const [totals] = await db
      .select({
        totalEvents: count(),
        humanCount: sql<number>`count(*) filter (where ${eventsTable.verdict} = 'HUMAN')`,
        botCount: sql<number>`count(*) filter (where ${eventsTable.verdict} = 'BOT')`,
        captchaCount: sql<number>`count(*) filter (where ${eventsTable.verdict} = 'CAPTCHA')`,
        avgScore: sql<number>`coalesce(avg(${eventsTable.score}), 0)`,
      })
      .from(eventsTable)
      .where(and(eq(eventsTable.userId, userId), gte(eventsTable.createdAt, since)));

    const total = Number(totals?.totalEvents ?? 0);
    const humanCount = Number(totals?.humanCount ?? 0);
    const botCount = Number(totals?.botCount ?? 0);
    const captchaCount = Number(totals?.captchaCount ?? 0);

    res.json({
      totalEvents: total,
      humanCount,
      botCount,
      captchaCount,
      avgScore: Number(totals?.avgScore ?? 0),
      humanRate: total > 0 ? Math.round((humanCount / total) * 100) : 0,
      botRate: total > 0 ? Math.round((botCount / total) * 100) : 0,
      range,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch overview" });
  }
});

router.get("/hourly", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const range = String(req.query.range || "7d");
    const since = getRangeStart(range);

    // truncUnit is always "hour" or "day" (controlled by our code, safe to inline)
    const truncUnit: "hour" | "day" =
      range === "1h" || range === "6h" || range === "24h" ? "hour" : "day";
    // date_trunc requires a string literal as its first arg — use sql.raw to avoid
    // passing it as a bound parameter ($1), which PostgreSQL rejects.
    const truncExpr = sql`date_trunc(${sql.raw(`'${truncUnit}'`)}, ${eventsTable.createdAt})`;

    const rows = await db
      .select({
        bucket: sql<string>`${truncExpr}::text`,
        total: count(),
        human: sql<number>`count(*) filter (where ${eventsTable.verdict} = 'HUMAN')`,
        bot: sql<number>`count(*) filter (where ${eventsTable.verdict} = 'BOT')`,
        avgScore: sql<number>`coalesce(avg(${eventsTable.score}), 0)`,
      })
      .from(eventsTable)
      .where(and(eq(eventsTable.userId, userId), gte(eventsTable.createdAt, since)))
      .groupBy(truncExpr)
      .orderBy(truncExpr);

    const formatted = rows.map((r) => ({
      t: r.bucket,
      total: Number(r.total),
      human: Number(r.human),
      bot: Number(r.bot),
      avgScore: Number(r.avgScore),
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch hourly data" });
  }
});

router.get("/geo", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const range = String(req.query.range || "7d");
    const since = getRangeStart(range);

    const rows = await db
      .select({
        country: eventsTable.country,
        total: count(),
        human: sql<number>`count(*) filter (where ${eventsTable.verdict} = 'HUMAN')`,
        bot: sql<number>`count(*) filter (where ${eventsTable.verdict} = 'BOT')`,
      })
      .from(eventsTable)
      .where(
        and(
          eq(eventsTable.userId, userId),
          gte(eventsTable.createdAt, since),
          sql`${eventsTable.country} is not null`
        )
      )
      .groupBy(eventsTable.country)
      .orderBy(desc(count()))
      .limit(10);

    res.json(
      rows.map((r) => ({
        country: r.country || "Unknown",
        sessions: Number(r.total),
        humanCount: Number(r.human),
        botCount: Number(r.bot),
        humanRate: Number(r.total) > 0 ? Math.round((Number(r.human) / Number(r.total)) * 100) : 0,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch geo data" });
  }
});

router.get("/breakdown", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const range = String(req.query.range || "7d");
    const since = getRangeStart(range);

    const byEventType = await db
      .select({
        eventType: eventsTable.eventType,
        total: count(),
        human: sql<number>`count(*) filter (where ${eventsTable.verdict} = 'HUMAN')`,
        bot: sql<number>`count(*) filter (where ${eventsTable.verdict} = 'BOT')`,
      })
      .from(eventsTable)
      .where(and(eq(eventsTable.userId, userId), gte(eventsTable.createdAt, since)))
      .groupBy(eventsTable.eventType)
      .orderBy(desc(count()))
      .limit(8);

    const byDomain = await db
      .select({
        domain: eventsTable.domain,
        total: count(),
        human: sql<number>`count(*) filter (where ${eventsTable.verdict} = 'HUMAN')`,
        bot: sql<number>`count(*) filter (where ${eventsTable.verdict} = 'BOT')`,
        avgScore: sql<number>`coalesce(avg(${eventsTable.score}), 0)`,
      })
      .from(eventsTable)
      .where(
        and(
          eq(eventsTable.userId, userId),
          gte(eventsTable.createdAt, since),
          sql`${eventsTable.domain} is not null`
        )
      )
      .groupBy(eventsTable.domain)
      .orderBy(desc(count()))
      .limit(10);

    const scoreDistribution = [
      { bucket: "0.0–0.2", count: 0 },
      { bucket: "0.2–0.4", count: 0 },
      { bucket: "0.4–0.6", count: 0 },
      { bucket: "0.6–0.8", count: 0 },
      { bucket: "0.8–1.0", count: 0 },
    ];

    const distRows = await db
      .select({
        bucket: sql<string>`
          case
            when ${eventsTable.score} < 0.2 then '0.0–0.2'
            when ${eventsTable.score} < 0.4 then '0.2–0.4'
            when ${eventsTable.score} < 0.6 then '0.4–0.6'
            when ${eventsTable.score} < 0.8 then '0.6–0.8'
            else '0.8–1.0'
          end
        `,
        count: count(),
      })
      .from(eventsTable)
      .where(
        and(
          eq(eventsTable.userId, userId),
          gte(eventsTable.createdAt, since),
          sql`${eventsTable.score} is not null`
        )
      )
      .groupBy(
        sql`
          case
            when ${eventsTable.score} < 0.2 then '0.0–0.2'
            when ${eventsTable.score} < 0.4 then '0.2–0.4'
            when ${eventsTable.score} < 0.6 then '0.4–0.6'
            when ${eventsTable.score} < 0.8 then '0.6–0.8'
            else '0.8–1.0'
          end
        `
      );

    distRows.forEach((r) => {
      const idx = scoreDistribution.findIndex((b) => b.bucket === r.bucket);
      if (idx !== -1) scoreDistribution[idx].count = Number(r.count);
    });

    res.json({
      byEventType: byEventType.map((r) => ({
        eventType: r.eventType,
        total: Number(r.total),
        human: Number(r.human),
        bot: Number(r.bot),
      })),
      byDomain: byDomain.map((r) => ({
        domain: r.domain || "unknown",
        total: Number(r.total),
        human: Number(r.human),
        bot: Number(r.bot),
        avgScore: Number(r.avgScore),
        humanRate: Number(r.total) > 0 ? Math.round((Number(r.human) / Number(r.total)) * 100) : 0,
      })),
      scoreDistribution,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch breakdown" });
  }
});

router.get("/recent-sessions", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const limit = Math.min(Number(req.query.limit) || 10, 50);

    const sessions = await db
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.userId, userId))
      .orderBy(desc(eventsTable.createdAt))
      .limit(limit);

    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch recent sessions" });
  }
});

export default router;
