/**
 * Proof of Human — Alert Rule Evaluation & Webhook Dispatch
 *
 * Called after every scored ingest event. Evaluates the user's enabled
 * alert rules, then fires any matching webhooks with a signed payload.
 * Runs fire-and-forget (does not block the ingest response).
 */

import { createHmac } from "crypto";
import { db, alertRulesTable, webhooksTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { logger } from "./logger";

export interface DispatchContext {
  userId:    string;
  sessionId: string;
  verdict:   "HUMAN" | "CAPTCHA" | "BOT";
  score:     number;
  domain:    string | null;
  eventType: string;
  flags:     string[];
}

// ── Alert rule evaluation ─────────────────────────────────────────────────────

function ruleMatches(
  condition: string,
  threshold: number,
  domain: string | null,
  ctx: DispatchContext,
): boolean {
  // Domain filter: if the rule targets a specific domain, only match that domain
  if (domain && ctx.domain && domain !== ctx.domain) return false;

  switch (condition) {
    case "score_below":
      return ctx.score < threshold;
    case "score_above":
      return ctx.score > threshold;
    case "bot_detected":
      return ctx.verdict === "BOT";
    case "captcha_required":
      return ctx.verdict === "CAPTCHA";
    default:
      return false;
  }
}

async function evaluateAlertRules(ctx: DispatchContext): Promise<string[]> {
  const rules = await db
    .select()
    .from(alertRulesTable)
    .where(
      and(
        eq(alertRulesTable.userId, ctx.userId),
        eq(alertRulesTable.enabled, true),
      ),
    );

  const triggeredActions: string[] = [];

  for (const rule of rules) {
    if (!ruleMatches(rule.condition, rule.threshold, rule.domain, ctx)) continue;

    triggeredActions.push(rule.action);

    await db
      .update(alertRulesTable)
      .set({
        triggeredCount: (rule.triggeredCount ?? 0) + 1,
        lastTriggeredAt: new Date(),
      })
      .where(eq(alertRulesTable.id, rule.id));

    logger.info(
      { ruleId: rule.id, ruleName: rule.name, action: rule.action, score: ctx.score },
      "Alert rule triggered",
    );
  }

  return triggeredActions;
}

// ── Webhook dispatch ──────────────────────────────────────────────────────────

function buildSignature(payload: string, secret: string): string {
  return "sha256=" + createHmac("sha256", secret).update(payload).digest("hex");
}

async function dispatchWebhooks(
  ctx: DispatchContext,
  triggeredActions: string[],
): Promise<void> {
  if (triggeredActions.length === 0) return;

  const hooks = await db
    .select()
    .from(webhooksTable)
    .where(
      and(
        eq(webhooksTable.userId, ctx.userId),
        eq(webhooksTable.enabled, true),
      ),
    );

  for (const hook of hooks) {
    // The webhook's `events` column is comma-separated (e.g. "block,flag,bot")
    const hookEvents = hook.events
      .split(",")
      .map((e: string) => e.trim().toLowerCase());

    // Fire if any triggered action matches what this webhook listens for,
    // or if the webhook subscribes to "bot" and verdict is BOT, etc.
    const verdictEvent = ctx.verdict.toLowerCase(); // "human" | "captcha" | "bot"
    const shouldFire =
      triggeredActions.some((a) => hookEvents.includes(a.toLowerCase())) ||
      hookEvents.includes(verdictEvent);

    if (!shouldFire) continue;

    const payloadObj = {
      event:       "alert_triggered",
      timestamp:   new Date().toISOString(),
      session_id:  ctx.sessionId,
      human_score: ctx.score,
      verdict:     ctx.verdict,
      domain:      ctx.domain ?? null,
      event_type:  ctx.eventType,
      actions:     triggeredActions,
      flags:       ctx.flags,
    };

    const payloadStr = JSON.stringify(payloadObj);
    const signature  = hook.secret ? buildSignature(payloadStr, hook.secret) : "";

    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(hook.url, {
        method:  "POST",
        headers: {
          "Content-Type":    "application/json",
          "X-PoH-Signature": signature,
          "User-Agent":      "ProofOfHuman-Webhooks/1.0",
        },
        body:   payloadStr,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const status = response.ok ? "ok" : `http_${response.status}`;
      await db
        .update(webhooksTable)
        .set({ lastFiredAt: new Date(), lastStatus: status })
        .where(eq(webhooksTable.id, hook.id));

      logger.info(
        { hookId: hook.id, url: hook.url, status },
        "Webhook delivered",
      );
    } catch (err: any) {
      clearTimeout(timeout);
      const errMsg = err?.name === "AbortError" ? "timeout" : (err?.message ?? "error");
      await db
        .update(webhooksTable)
        .set({ lastFiredAt: new Date(), lastStatus: errMsg })
        .where(eq(webhooksTable.id, hook.id));

      logger.warn(
        { hookId: hook.id, url: hook.url, error: errMsg },
        "Webhook delivery failed",
      );
    }
  }
}

// ── Public entry point ────────────────────────────────────────────────────────

/**
 * Evaluate alert rules and dispatch webhooks for a scored event.
 * Must be called fire-and-forget (caller should NOT await if it wants
 * to avoid blocking the HTTP response).
 */
export async function dispatchEvent(ctx: DispatchContext): Promise<void> {
  try {
    const triggeredActions = await evaluateAlertRules(ctx);
    await dispatchWebhooks(ctx, triggeredActions);
  } catch (err) {
    logger.error({ err }, "dispatchEvent failed");
  }
}
