/**
 * Clerk Frontend API + CDN Proxy Middleware
 *
 * Proxies Clerk requests through your domain so Clerk auth works on
 * .replit.app and custom domains without CNAME DNS setup.
 *
 * Two proxy paths are registered (order matters — npm must come first):
 *   /api/__clerk/npm/*  →  https://npm.clerk.dev/*   (Clerk JS bundle)
 *   /api/__clerk/*      →  https://<fapi-host>/*      (Clerk Frontend API)
 *
 * The FAPI host is derived automatically from CLERK_PUBLISHABLE_KEY so no
 * extra env var is needed.
 *
 * IMPORTANT:
 * - Only active in production (NODE_ENV=production)
 * - Both middlewares must be mounted BEFORE express.json()
 *
 * Usage in app.ts:
 *   import {
 *     CLERK_PROXY_PATH,
 *     CLERK_NPM_PROXY_PATH,
 *     clerkNpmProxyMiddleware,
 *     clerkProxyMiddleware,
 *   } from "./middlewares/clerkProxyMiddleware";
 *   app.use(CLERK_NPM_PROXY_PATH, clerkNpmProxyMiddleware());
 *   app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
 */

import { createProxyMiddleware } from "http-proxy-middleware";
import type { RequestHandler } from "express";
import type { IncomingHttpHeaders } from "http";

export const CLERK_PROXY_PATH = "/api/__clerk";
export const CLERK_NPM_PROXY_PATH = "/api/__clerk/npm";
const CLERK_NPM_CDN = "https://npm.clerk.dev";

/**
 * Derives the Clerk Frontend API URL from a publishable key.
 * Format: pk_{env}_{base64(fapi_host + "$")}
 */
function getFapiFromPublishableKey(pk: string): string {
  try {
    const parts = pk.split("_");
    if (parts.length < 3) return "";
    const encoded = parts[2];
    const padded = encoded + "=".repeat((4 - (encoded.length % 4)) % 4);
    const decoded = Buffer.from(padded, "base64").toString("utf-8");
    const host = decoded.replace(/\$$/, ""); // remove trailing "$" separator
    return host ? `https://${host}` : "";
  } catch {
    return "";
  }
}

/**
 * Returns the first effective public hostname for the given request,
 * preferring x-forwarded-host over the Host header so callers behind a
 * proxy see the original client-facing host.
 */
export function getClerkProxyHost(req: {
  headers: IncomingHttpHeaders;
}): string | undefined {
  const forwarded = req.headers["x-forwarded-host"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const firstHop = raw?.split(",")[0]?.trim();
  return firstHop || req.headers.host?.trim() || undefined;
}

/**
 * Proxies /api/__clerk/npm/* → https://npm.clerk.dev/*
 * This allows Clerk to load its JS bundle through your domain.
 * Must be mounted BEFORE clerkProxyMiddleware.
 */
export function clerkNpmProxyMiddleware(): RequestHandler {
  if (process.env.NODE_ENV !== "production") {
    return (_req, _res, next) => next();
  }

  return createProxyMiddleware({
    target: CLERK_NPM_CDN,
    changeOrigin: true,
    pathRewrite: (path: string) =>
      path.replace(new RegExp(`^${CLERK_NPM_PROXY_PATH}`), "/npm"),
  }) as RequestHandler;
}

/**
 * Proxies /api/__clerk/* → https://<clerk-fapi-host>/*
 * This allows Clerk Frontend API calls to route through your domain.
 * Must be mounted AFTER clerkNpmProxyMiddleware.
 */
export function clerkProxyMiddleware(): RequestHandler {
  if (process.env.NODE_ENV !== "production") {
    return (_req, _res, next) => next();
  }

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    return (_req, _res, next) => next();
  }

  const publishableKey = process.env.CLERK_PUBLISHABLE_KEY ?? "";
  const clerkFapi = getFapiFromPublishableKey(publishableKey);

  if (!clerkFapi) {
    return (_req, _res, next) => next();
  }

  return createProxyMiddleware({
    target: clerkFapi,
    changeOrigin: true,
    pathRewrite: (path: string) =>
      path.replace(new RegExp(`^${CLERK_PROXY_PATH}`), ""),
    on: {
      proxyReq: (proxyReq, req) => {
        const protocol = req.headers["x-forwarded-proto"] || "https";
        const host = getClerkProxyHost(req) || "";
        const proxyUrl = `${protocol}://${host}${CLERK_PROXY_PATH}`;

        proxyReq.setHeader("Clerk-Proxy-Url", proxyUrl);
        proxyReq.setHeader("X-Forwarded-Proto", protocol);
        proxyReq.setHeader("X-Forwarded-Host", host);
        proxyReq.setHeader("Clerk-Secret-Key", secretKey);

        const xff = req.headers["x-forwarded-for"];
        const clientIp =
          (Array.isArray(xff) ? xff[0] : xff)?.split(",")[0]?.trim() ||
          req.socket?.remoteAddress ||
          "";
        if (clientIp) {
          proxyReq.setHeader("X-Forwarded-For", clientIp);
        }
      },
    },
  }) as RequestHandler;
}
