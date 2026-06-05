/**
 * Monthly event quota enforcement for /api/ingest.
 *
 * Quota is shared across all API tokens that belong to the same user
 * (a user with two sites still has one monthly budget).
 *
 * Plan quotas:
 *   free       →     10,000 events / month
 *   growth     →  1,000,000 events / month   ($49.99/mo, ~70% gross margin)
 *   enterprise → 20,000,000 events / month   ($499/mo,  ~70% gross margin)
 *
 * The count is cached per user for CACHE_TTL_MS to avoid a DB round-trip on
 * every single request. The cache is intentionally slightly stale — this is
 * acceptable because enforcement at the boundary is approximate anyway (the
 * next cache refresh will catch any overage within the TTL window).
 */

import type { Request, Response, NextFunction } from "express";
import { db, eventsTable, apiTokensTable, usersTable } from "@workspace/db";
import { eq, and, gte, count } from "drizzle-orm";
import { logger } from "../lib/logger";

// ── Config ────────────────────────────────────────────────────────────────────

const CACHE_TTL_MS = 5 * 60_000; // refresh usage count every 5 minutes

export const PLAN_MONTHLY_LIMITS: Record<string, number> = {
  free:       30_000,
  growth:     1_000_000,
  enterprise: 20_000_000,
};
const DEFAULT_LIMIT = 30_000;

// ── Cache ─────────────────────────────────────────────────────────────────────

interface UsageEntry {
  plan:        string;
  used:        number;   // event count this calendar month
  resolvedAt:  number;   // ms timestamp of last DB fetch
}

const usageCache = new Map<string, UsageEntry>();

// Sweep stale entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [userId, entry] of usageCache) {
    if (now - entry.resolvedAt > CACHE_TTL_MS) usageCache.delete(userId);
  }
}, 10 * 60_000).unref();

// ── Helpers ───────────────────────────────────────────────────────────────────

function startOfMonth(): Date {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

async function resolveUsage(userId: string): Promise<UsageEntry> {
  const cached = usageCache.get(userId);
  if (cached && Date.now() - cached.resolvedAt < CACHE_TTL_MS) return cached;

  try {
    // Fetch plan and current-month count in parallel
    const [planRows, countRows] = await Promise.all([
      db
        .select({ plan: usersTable.plan })
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1),
      db
        .select({ value: count() })
        .from(eventsTable)
        .where(
          and(
            eq(eventsTable.userId, userId),
            gte(eventsTable.createdAt, startOfMonth()),
          ),
        ),
    ]);

    const plan = planRows[0]?.plan ?? "free";
    const used = countRows[0]?.value ?? 0;

    const entry: UsageEntry = { plan, used, resolvedAt: Date.now() };
    usageCache.set(userId, entry);
    return entry;
  } catch {
    // DB error — fail open, don't block ingest
    return { plan: "free", used: 0, resolvedAt: Date.now() };
  }
}

// ── Middleware ────────────────────────────────────────────────────────────────

export async function monthlyQuota(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  // requireBearer already ran; the token is validated at this point
  const token = (req as any).bearerToken as string | undefined;
  if (!token) { next(); return; }

  // Resolve userId from token (it's attached later in the handler, but we
  // need it here — do a lightweight lookup, same token that will be re-looked
  // up below; result is cached by the DB connection pool so it's cheap)
  let userId: string;
  try {
    const rows = await db
      .select({ userId: apiTokensTable.userId })
      .from(apiTokensTable)
      .where(eq(apiTokensTable.token, token))
      .limit(1);

    if (!rows[0]) { next(); return; } // invalid token — ingest handler will 401
    userId = rows[0].userId;
  } catch {
    next(); return; // DB error — fail open
  }

  const entry = await resolveUsage(userId);
  const limit = PLAN_MONTHLY_LIMITS[entry.plan] ?? DEFAULT_LIMIT;

  // Attach for ingest handler convenience (avoids a second plan lookup)
  (req as any).quotaEntry = entry;

  if (entry.used >= limit) {
    logger.warn(
      { userId, plan: entry.plan, used: entry.used, limit },
      "Monthly event quota exceeded",
    );
    res.status(429).json({
      error:        "Monthly event quota exceeded",
      plan:         entry.plan,
      quota:        limit,
      used:         entry.used,
      upgrade_url:  "/dashboard/billing",
    });
    return;
  }

  // Optimistically increment the cached counter so rapid back-to-back
  // requests within the same TTL window don't all slip through at the boundary
  entry.used++;

  next();
}

/** Evict a user's cached usage (e.g. after a plan upgrade). */
export function evictUsage(userId: string): void {
  usageCache.delete(userId);
}
