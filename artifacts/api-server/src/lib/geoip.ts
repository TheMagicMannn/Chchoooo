/**
 * IP geolocation helper.
 *
 * Uses geoip-lite (bundled MaxMind GeoLite2 database, ~35MB, no API key).
 * Queries are synchronous and take < 1ms.
 *
 * IP extraction handles Replit's proxy stack:
 *   X-Forwarded-For: <client>, <proxy1>, <proxy2>  → use <client> (first)
 *   X-Real-IP: <client>                            → fallback
 *   req.socket.remoteAddress                        → last resort
 */

import type { Request } from "express";
import geoip from "geoip-lite";

/** Extract the best-guess real client IP from a proxied request. */
export function getClientIp(req: Request): string | null {
  const xff = req.headers["x-forwarded-for"];
  if (xff) {
    const first = (Array.isArray(xff) ? xff[0] : xff).split(",")[0].trim();
    if (first) return first;
  }

  const xri = req.headers["x-real-ip"];
  if (xri) return Array.isArray(xri) ? xri[0] : xri;

  return req.socket?.remoteAddress ?? null;
}

/** Strip IPv6-mapped IPv4 prefix so geoip-lite can match (e.g. ::ffff:1.2.3.4 → 1.2.3.4). */
function normalizeIp(ip: string): string {
  return ip.startsWith("::ffff:") ? ip.slice(7) : ip;
}

/** Look up the 2-letter ISO country code for an IP, or null if unknown/private. */
export function lookupCountry(ip: string): string | null {
  try {
    const normalized = normalizeIp(ip);
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
