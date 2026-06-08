import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import router from "./routes";
import healthRouter from "./routes/health";
import clerkWebhookRouter from "./routes/clerk_webhook";
import { WebhookHandlers } from "./webhookHandlers";
import { logger } from "./lib/logger";
import {
  CLERK_PROXY_PATH,
  CLERK_NPM_PROXY_PATH,
  clerkNpmProxyMiddleware,
  clerkProxyMiddleware,
} from "./middlewares/clerkProxyMiddleware";

const app: Express = express();
app.set("trust proxy", 1);
app.use(
  CLERK_NPM_PROXY_PATH,
  clerkNpmProxyMiddleware(),
);
app.use(
  CLERK_PROXY_PATH,
  clerkProxyMiddleware(),
);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// Stripe webhook — must be registered with express.raw() BEFORE express.json()
// so Stripe can verify the raw request body signature.
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["stripe-signature"];
    if (!signature) {
      res.status(400).json({ error: "Missing stripe-signature" });
      return;
    }
    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;
      await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      res.status(200).json({ received: true });
    } catch (err: any) {
      logger.error({ err }, "Stripe webhook error");
      res.status(400).json({ error: "Webhook processing error" });
    }
  },
);

// Clerk webhook — must be registered with express.raw() BEFORE express.json()
// so Svix can verify the raw request body signature.
app.post(
  "/api/webhooks/clerk",
  express.raw({ type: "application/json" }),
  clerkWebhookRouter,
);

const allowedOrigins: string[] = (() => {
  if (process.env.ALLOWED_ORIGINS) {
    return process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim());
  }
  if (process.env.REPLIT_DOMAINS) {
    return process.env.REPLIT_DOMAINS.split(",").map((o) => o.trim());
  }
  return [];
})();

/api/ingest is called cross-origin from customer websites — allow any origin.
// Bearer-token auth means cookies/credentials are not needed here.
app.use("/api/ingest", cors({ origin: "*", credentials: false }));

const dashboardCors = cors({
  credentials: true,
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }
    if (allowedOrigins.length === 0) {
      callback(null, true);
      return;
    }
    // REPLIT_DOMAINS contains bare hostnames (e.g. "foo.replit.app") but
    // the Origin header includes the protocol ("https://foo.replit.app"),
    // so we extract the hostname before comparing.
    let originHost: string;
    try {
      originHost = new URL(origin).hostname;
    } catch {
      originHost = origin;
    }
    if (
      allowedOrigins.some(
        (allowed) => originHost === allowed || originHost.endsWith(`.${allowed}`),
      )
    ) {
      callback(null, true);
    } else {
      callback(new Error("CORS: origin not allowed"));
    }
  },
});
app.use((req, res, next) => {
  // Ingest already has its own CORS headers set above — skip to avoid overwrite.
  if (req.path.startsWith("/api/ingest")) return next();
  return dashboardCors(req, res, next);
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check — registered BEFORE Clerk middleware so the platform probe
// (GET /api from 127.0.0.1) never touches authentication logic.
app.use("/api", healthRouter);

// Public Stripe routes — registered BEFORE Clerk middleware so no auth is required
app.get("/api/stripe/prices", async (_req, res) => {
  try {
    const { stripeStorage } = await import("./stripeStorage.js");
    const prices = await stripeStorage.listPrices();
    res.json({ data: prices });
  } catch (_err) {
    res.json({ data: [] });
  }
});

app.use(clerkMiddleware());

app.use("/api", router);

// Serve the compiled React app and handle SPA deep-links when the dist is present.
// Not gated on NODE_ENV — Replit deployments don't set it automatically.
// In development the Vite dev server proxies /api to us so Express never
// receives non-API requests, making these routes effectively unreachable.
{
  const distPath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../proof-of-human/dist/public",
  );
  if (existsSync(distPath)) {
    app.use(express.static(distPath));
    // SPA fallback — any non-API path returns index.html so client-side routing works.
    // app.use() (no path) avoids path-to-regexp, which rejects bare "*" in Express 5.
    app.use((_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
}

export default app;
