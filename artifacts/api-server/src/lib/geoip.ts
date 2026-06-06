/**
 * IP geolocation helper.
 *
 * Uses geoip-lite (bundled MaxMind GeoLite2 database, ~35MB, no API key).
 * Queries are synchronous and take < 1ms.
 *
 * IP extraction order (first non-private wins):
 *   1. CF-Connecting-IP   — Cloudflare sets the real client IP here (Replit uses CF)
 *   2. X-Real-IP          — nginx / other reverse proxies
 *   3. X-Forwarded-For    — first public IP in the comma-separated list
 *   4. req.socket.remoteAddress — last resort (usually a Replit internal IP)
 */

import type { Request } from "express";
import geoip from "geoip-lite";

const PRIVATE_RANGES = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^::1$/,
  /^fc00:/,
  /^fd/,
  /^::ffff:127\./,
  /^::ffff:10\./,
  /^::ffff:192\.168\./,
];

function isPrivate(ip: string): boolean {
  return PRIVATE_RANGES.some((re) => re.test(ip));
}

/** Strip IPv6-mapped IPv4 prefix so geoip-lite can match (e.g. ::ffff:1.2.3.4 → 1.2.3.4). */
function normalizeIp(ip: string): string {
  return ip.startsWith("::ffff:") ? ip.slice(7) : ip;
}

/**
 * Extract the best-guess real client IP from a proxied request.
 * Returns the first non-private IP found, or null if every candidate is private/missing.
 */
export function getClientIp(req: Request): string | null {
  const candidates: string[] = [];

  // 1. Cloudflare sets this header with the real connecting IP
  const cf = req.headers["cf-connecting-ip"];
  if (cf) candidates.push(...(Array.isArray(cf) ? cf : [cf]));

  // 2. nginx / load-balancer real IP
  const xri = req.headers["x-real-ip"];
  if (xri) candidates.push(...(Array.isArray(xri) ? xri : [xri]));

  // 3. X-Forwarded-For — iterate left to right (client is first)
  const xff = req.headers["x-forwarded-for"];
  if (xff) {
    const parts = (Array.isArray(xff) ? xff.join(",") : xff)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    candidates.push(...parts);
  }

  // 4. Raw socket address
  if (req.socket?.remoteAddress) candidates.push(req.socket.remoteAddress);

  for (const raw of candidates) {
    const ip = normalizeIp(raw.trim());
    if (ip && !isPrivate(ip)) return ip;
  }

  return null; // all candidates are private / loopback — dev environment
}

/** Look up the 2-letter ISO country code for an IP, or null if unknown/private. */
export function lookupCountry(ip: string): string | null {
  try {
    const normalized = normalizeIp(ip);
    if (isPrivate(normalized)) return null;
    const result = geoip.lookup(normalized);
    return result?.country ?? null;
  } catch {
    return null;
  }
}

/** Convenience: extract IP from request and return country code (or null). */
export function countryFromRequest(req: Request): string | null {
  const ip = getClientIp(req);
  if (!ip) return null;
  return lookupCountry(ip);
}
