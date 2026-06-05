import { Router } from "express";
import { db, apiTokensTable, eventsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireBearer } from "../middlewares/requireAuth";
import { tokenRateLimit } from "../middlewares/tokenRateLimit";
import { computeScore } from "../lib/scorer";
import { dispatchEvent } from "../lib/dispatch";

const router = Router();

router.post("/", requireBearer, tokenRateLimit, async (req, res) => {
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
      referrer,
      duration_ms,
      signals,
    } = req.body;

    if (!session_id) {
      res.status(400).json({ error: "session_id is required" });
      return;
    }

    const serverUserAgent = req.headers["user-agent"] ?? null;

    const result = computeScore({
      userAgent: serverUserAgent,
      signals:   signals ?? null,
      referrer:  referrer ?? null,
      domain:    domain ?? null,
    });

    await db.insert(eventsTable).values({
      tokenId:    String(tokenRow.id),
      userId:     tokenRow.userId,
      sessionId:  session_id,
      domain:     domain     || null,
      eventType:  event_type || "page_view",
      score:      result.score,
      verdict:    result.verdict,
      country:    null,
      userAgent:  serverUserAgent,
      referrer:   referrer   || null,
      durationMs: duration_ms || null,
      signals:    signals    ?? null,
      flags:      result.flags,
      factors:    result.factors,
    });

    // Respond immediately — don't block on alert/webhook delivery
    res.json({
      ok:      true,
      verdict: result.verdict,
      score:   result.score,
      flags:   result.flags,
    });

    // Fire-and-forget: evaluate alert rules, dispatch webhooks
    dispatchEvent({
      userId:    tokenRow.userId,
      sessionId: session_id,
      verdict:   result.verdict,
      score:     result.score,
      domain:    domain    || null,
      eventType: event_type || "page_view",
      flags:     result.flags,
    });

  } catch (err) {
    res.status(500).json({ error: "Ingest failed" });
  }
});

export default router;
