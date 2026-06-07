/**
 * Proof of Human analytics tracker (server-side).
 *
 * Lightweight wrapper around the PoH ingest REST endpoint. Use this from
 * any backend route to record server-observed events (form_submit, login,
 * checkout, custom).
 *
 * Required env vars:
 *   POH_TOKEN       — Bearer API token
 *   POH_INGEST_URL  — Full URL to /api/ingest (e.g. https://chchoooo--innovativenetwe.replit.app/api/ingest)
 *
 * Example:
 *   import { pohTrack } from "../lib/pohTracker";
 *   await pohTrack({ sessionId: "sess_abc", eventType: "login", domain: "example.com" });
 */

import { logger } from "./logger";

export type PoHEventType =
  | "page_view"
  | "form_submit"
  | "checkout"
  | "login"
  | "custom";

export type PoHVerdict = "HUMAN" | "BOT" | "CAPTCHA";

export interface PoHTrackInput {
  sessionId: string;
  eventType: PoHEventType;
  domain: string;
  score?: number;
  verdict?: PoHVerdict;
  country?: string;
}

export interface PoHTrackResponse {
  ok: boolean;
  id?: number;
  error?: string;
}

export async function pohTrack(input: PoHTrackInput): Promise<PoHTrackResponse> {
  const token = process.env.POH_TOKEN;
  const ingestUrl = process.env.POH_INGEST_URL;

  if (!token || !ingestUrl) {
    logger.warn(
      { hasToken: !!token, hasUrl: !!ingestUrl },
      "PoH tracker not configured — set POH_TOKEN and POH_INGEST_URL",
    );
    return { ok: false, error: "PoH tracker not configured" };
  }

  const body: Record<string, unknown> = {
    session_id: input.sessionId,
    event_type: input.eventType,
    domain: input.domain,
  };
  if (input.score !== undefined) body.score = input.score;
  if (input.verdict !== undefined) body.verdict = input.verdict;
  if (input.country !== undefined) body.country = input.country;

  try {
    const res = await fetch(ingestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = (await res.json().catch(() => ({}))) as PoHTrackResponse;
    if (!res.ok) {
      logger.warn(
        { status: res.status, body: data, eventType: input.eventType },
        "PoH ingest returned non-OK status",
      );
      return { ok: false, error: data.error ?? `HTTP ${res.status}` };
    }
    return { ok: true, id: data.id };
  } catch (err) {
    logger.error({ err, eventType: input.eventType }, "PoH ingest request failed");
    return { ok: false, error: "Network error" };
  }
}
