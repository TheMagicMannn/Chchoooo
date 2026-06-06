import { Router } from "express";
import { db, apiTokensTable, eventsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireBearer } from "../middlewares/requireAuth";
import { tokenRateLimit } from "../middlewares/tokenRateLimit";
import { monthlyQuota } from "../middlewares/monthlyQuota";
import { computeScore } from "../lib/scorer";
import { dispatchEvent } from "../lib/dispatch";
import { countryFromRequest } from "../lib/geoip";
import { z } from "zod";

const router = Router();

const ingestBodySchema = z.object({
  session_id: z.string().min(1).max(128),
  domain: z.string().max(253).optional().nullable(),
  event_type: z.string().max(64).optional().nullable(),
  referrer: z.string().max(2048).optional().nullable(),
  duration_ms: z.number().int().nonnegative().max(86_400_000).optional().nullable(),
  signals: z.record(z.unknown()).optional().nullable(),
});

router.post("/", requireBearer, tokenRateLimit, monthlyQuota, async (req, res) => {
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

    const parsed = ingestBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body", details: parsed.error.flatten().fieldErrors });
      return;
    }

    const {
      session_id,
      domain,
      event_type,
      referrer,
      duration_ms,
      signals,
    } = parsed.data;

    const serverUserAgent = req.headers["user-agent"] ?? null;

    const result = computeScore({
      userAgent: serverUserAgent,
      signals:   signals ?? null,
      referrer:  referrer ?? null,
      domain:    domain ?? null,
    });

    await Promise.all([
      db.insert(eventsTable).values({
        tokenId:    String(tokenRow.id),
        userId:     tokenRow.userId,
        sessionId:  session_id,
        domain:     domain     || null,
        eventType:  event_type || "page_view",
        score:      result.score,
        verdict:    result.verdict,
        country:    countryFromRequest(req),
        userAgent:  serverUserAgent,
        referrer:   referrer   || null,
        durationMs: duration_ms || null,
        signals:    signals    ?? null,
        flags:      result.flags,
        factors:    result.factors,
      }),
      db.update(apiTokensTable)
        .set({
          lastUsedAt: new Date(),
          usageCount: sql`${apiTokensTable.usageCount} + 1`,
        })
        .where(eq(apiTokensTable.id, tokenRow.id)),
    ]);

    res.json({
      ok:      true,
      verdict: result.verdict,
      score:   result.score,
      flags:   result.flags,
    });

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
