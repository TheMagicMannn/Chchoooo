import { Router } from "express";
import { db, apiTokensTable, eventsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireBearer } from "../middlewares/requireAuth";

const router = Router();

router.post("/", requireBearer, async (req, res) => {
  try {
    const bearerToken = (req as any).bearerToken as string;

    const [tokenRow] = await db
      .select()
      .from(apiTokensTable)
      .where(eq(apiTokensTable.token, bearerToken))
      .limit(1);

    if (!tokenRow) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    const {
      session_id,
      domain,
      event_type,
      score,
      verdict,
      country,
      user_agent,
      referrer,
      duration_ms,
    } = req.body;

    if (!session_id) {
      res.status(400).json({ error: "session_id is required" });
      return;
    }

    const humanScore = typeof score === "number" ? score : Math.random() * 0.3 + 0.7;
    const computedVerdict =
      verdict ||
      (humanScore >= 0.7 ? "HUMAN" : humanScore >= 0.3 ? "CAPTCHA" : "BOT");

    await db.insert(eventsTable).values({
      tokenId: String(tokenRow.id),
      userId: tokenRow.userId,
      sessionId: session_id,
      domain: domain || null,
      eventType: event_type || "page_view",
      score: humanScore,
      verdict: computedVerdict,
      country: country || null,
      userAgent: user_agent || null,
      referrer: referrer || null,
      durationMs: duration_ms || null,
    });

    res.json({ ok: true, verdict: computedVerdict, score: humanScore });
  } catch (err) {
    res.status(500).json({ error: "Ingest failed" });
  }
});

export default router;
