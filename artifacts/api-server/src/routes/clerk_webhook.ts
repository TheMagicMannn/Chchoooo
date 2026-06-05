/**
 * Clerk webhook handler — real-time user sync.
 *
 * Mounted at POST /api/webhooks/clerk in app.ts BEFORE express.json() so
 * Express sees the raw body bytes needed for Svix signature verification.
 *
 * To activate:
 *  1. In your Clerk dashboard → Webhooks → Add Endpoint:
 *       URL: https://<your-domain>/api/webhooks/clerk
 *       Events: user.created, user.updated, user.deleted
 *  2. Copy the Signing Secret and set it as CLERK_WEBHOOK_SECRET in Replit Secrets.
 *
 * If CLERK_WEBHOOK_SECRET is not set, the endpoint returns 503 with a helpful
 * message rather than silently accepting unverified events.
 */

import { Router } from "express";
import { Webhook } from "svix";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

router.post("/clerk", async (req, res) => {
  const secret = process.env.CLERK_WEBHOOK_SECRET;

  if (!secret) {
    logger.warn("CLERK_WEBHOOK_SECRET not set — webhook endpoint inactive");
    res.status(503).json({
      error:   "Webhook not configured",
      message: "Set CLERK_WEBHOOK_SECRET in Replit Secrets to activate real-time user sync.",
    });
    return;
  }

  // req.body is a Buffer because this route is mounted with express.raw()
  const payload = req.body instanceof Buffer ? req.body.toString("utf8") : String(req.body);

  const svixHeaders = {
    "svix-id":        req.headers["svix-id"]        as string,
    "svix-timestamp": req.headers["svix-timestamp"] as string,
    "svix-signature": req.headers["svix-signature"] as string,
  };

  if (!svixHeaders["svix-id"] || !svixHeaders["svix-timestamp"] || !svixHeaders["svix-signature"]) {
    res.status(400).json({ error: "Missing Svix headers" });
    return;
  }

  let event: { type: string; data: any };
  try {
    const wh = new Webhook(secret);
    event = wh.verify(payload, svixHeaders) as { type: string; data: any };
  } catch (err) {
    logger.warn({ err }, "Clerk webhook signature verification failed");
    res.status(401).json({ error: "Invalid webhook signature" });
    return;
  }

  const { type, data } = event;
  logger.info({ type, userId: data?.id }, "Clerk webhook received");

  try {
    if (type === "user.created" || type === "user.updated") {
      const userId = data.id as string;

      const email: string =
        data.email_addresses?.find(
          (e: any) => e.id === data.primary_email_address_id,
        )?.email_address ??
        data.email_addresses?.[0]?.email_address ??
        "";

      const nameParts: string[] = [data.first_name, data.last_name].filter(Boolean);
      const name = nameParts.length > 0 ? nameParts.join(" ") : null;

      if (type === "user.created") {
        await db
          .insert(usersTable)
          .values({ id: userId, clerkId: userId, email, name: name ?? undefined, plan: "free" })
          .onConflictDoNothing();
        logger.info({ userId, email }, "User created via webhook");
      } else {
        // user.updated — keep plan unchanged, just sync profile fields
        await db
          .update(usersTable)
          .set({ email, ...(name !== null ? { name } : {}) })
          .where(eq(usersTable.id, userId));
        logger.info({ userId, email }, "User updated via webhook");
      }
    } else if (type === "user.deleted") {
      // Soft approach: log the deletion but do not cascade-delete events/tokens.
      // The data is valuable for fraud analytics and audit trails.
      logger.info({ userId: data.id }, "User deleted in Clerk — data retained in DB");
    }

    res.json({ ok: true });
  } catch (err) {
    logger.error({ err, type }, "Clerk webhook handler error");
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

export default router;
