/**
 * Per-API-token, plan-aware rate limiter for /api/ingest.
 *
 * Each Bearer token gets its own independent 60-second sliding window.
 * The limit is determined by the token owner's plan:
 *
 *   free       →   120 req / min  (~2/sec)
 *   growth     → 1,000 req / min  (~17/sec)
 *   enterprise → 10,000 req / min (~167/sec)
 *
 * Token → plan resolution is cached in-memory for CACHE_TTL_MS to avoid
 * a DB round-trip on every request. The cache is a simple Map with a
 * background sweep that evicts expired entries every minute.
 */

import type { Request, Response, NextFunction } from "express";
import { db, apiTokensTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

// ── Config ────────────────────────────────────────────────────────────────────

const WINDOW_MS     = 60_000;    // 1-minute sliding window
const CACHE_TTL_MS  = 5 * 60_000; // cache token→plan for 5 minutes

const PLAN_LIMITS: Record<string, number> = {
  free:       120,
  growth:     1_000,
  enterprise: 10_000,
};
const DEFAULT_LIMIT = 120; // applied if plan is unknown

// ── In-memory stores ──────────────────────────────────────────────────────────

interface TokenMeta {
  plan:      string;
  resolvedAt: number; // ms timestamp
}

interface WindowEntry {
  count:       number;
  windowStart: number; // ms timestamp
}

// Cache: Bearer token string → resolved plan + timestamp
const tokenMetaCache = new Map<string, TokenMeta>();

// Rate counters: Bearer token string → current window state
const windowStore = new Map<string, WindowEntry>();

// ── Cache sweep (evict stale entries every minute) ────────────────────────────

setInterval(() => {
  const now = Date.now();
  for (const [token, meta] of tokenMetaCache) {
    if (now - meta.resolvedAt > CACHE_TTL_MS) tokenMetaCache.delete(token);
  }
  for (const [token, entry] of windowStore) {
    if (now - entry.windowStart > WINDOW_MS) windowStore.delete(token);
  }
}, 60_000).unref(); // .unref() so it doesn't keep the process alive

// ── Plan resolution ───────────────────────────────────────────────────────────

async function resolvePlan(token: string): Promise<string> {
  const cached = tokenMetaCache.get(token);
  if (cached && Date.now() - cached.resolvedAt < CACHE_TTL_MS) {
    return cached.plan;
  }

  try {
    const rows = await db
      .select({ plan: usersTable.plan })
      .from(apiTokensTable)
      .innerJoin(usersTable, eq(apiTokensTable.userId, usersTable.id))
      .where(eq(apiTokensTable.token, token))
      .limit(1);

    const plan = rows[0]?.plan ?? "free";
    tokenMetaCache.set(token, { plan, resolvedAt: Date.now() });
    return plan;
  } catch {
    // DB error — fail open with default limit, don't cache
    return "free";
  }
}

// ── Rate limit check ──────────────────────────────────────────────────────────

function checkLimit(token: string, limit: number): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now   = Date.now();
  const entry = windowStore.get(token);

  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    // New window
    windowStore.set(token, { count: 1, windowStart: now });
    return { allowed: true, remaining: limit - 1, resetAt: now + WINDOW_MS };
  }

  entry.count++;
  const resetAt   = entry.windowStart + WINDOW_MS;
  const remaining = Math.max(0, limit - entry.count);
  const allowed   = entry.count <= limit;

  return { allowed, remaining, resetAt };
}

// ── Middleware ────────────────────────────────────────────────────────────────

export async function tokenRateLimit(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  // requireBearer has already validated the header format and set req.bearerToken
  const token = (req as any).bearerToken as string | undefined;
  if (!token) {
    next();
    return;
  }

  const plan  = await resolvePlan(token);
  const limit = PLAN_LIMITS[plan] ?? DEFAULT_LIMIT;
  const { allowed, remaining, resetAt } = checkLimit(token, limit);

  // Standard rate-limit response headers
  res.setHeader("X-RateLimit-Limit",     limit);
  res.setHeader("X-RateLimit-Remaining", remaining);
  res.setHeader("X-RateLimit-Reset",     Math.ceil(resetAt / 1000));
  res.setHeader("X-RateLimit-Policy",    `${limit};w=60;key=token;plan=${plan}`);

  if (!allowed) {
    const retryAfterSec = Math.ceil((resetAt - Date.now()) / 1000);
    res.setHeader("Retry-After", retryAfterSec);
    logger.warn(
      { token: token.slice(0, 8) + "…", plan, limit },
      "Ingest rate limit exceeded",
    );
    res.status(429).json({
      error:       "Rate limit exceeded",
      plan,
      limit,
      retry_after: retryAfterSec,
    });
    return;
  }

  next();
}

// ── Admin helper (for tests / future management API) ─────────────────────────

/** Evict a specific token from both caches (e.g. after token revocation). */
export function evictToken(token: string): void {
  tokenMetaCache.delete(token);
  windowStore.delete(token);
}
