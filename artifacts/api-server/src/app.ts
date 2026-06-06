import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import {
  CLERK_PROXY_PATH,
  CLERK_NPM_PROXY_PATH,
  clerkNpmProxyMiddleware,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";
import router from "./routes";
import healthRouter from "./routes/health";
import clerkWebhookRouter from "./routes/clerk_webhook";
import { WebhookHandlers } from "./webhookHandlers";
import { logger } from "./lib/logger";

const app: Express = express();

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

app.use(CLERK_NPM_PROXY_PATH, clerkNpmProxyMiddleware());
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

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

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : [];

app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (
        allowedOrigins.length === 0 ||
        allowedOrigins.some((allowed) => origin === allowed || origin.endsWith(`.${allowed}`))
      ) {
        callback(null, true);
      } else {
        callback(new Error("CORS: origin not allowed"));
      }
    },
  }),
);
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

app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
);

app.use("/api", router);

export default app;
