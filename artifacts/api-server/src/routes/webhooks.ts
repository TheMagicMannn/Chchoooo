import { Router } from "express";
import { db, webhooksTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { randomBytes } from "crypto";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const rows = await db
      .select()
      .from(webhooksTable)
      .where(eq(webhooksTable.userId, userId))
      .orderBy(webhooksTable.createdAt);
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Failed to fetch webhooks" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { url, events } = req.body;
    if (!url || typeof url !== "string") {
      res.status(400).json({ error: "url is required" });
      return;
    }
    try {
      new URL(url);
    } catch {
      res.status(400).json({ error: "url must be a valid URL" });
      return;
    }
    const secret = "whsec_" + randomBytes(20).toString("hex");
    const [row] = await db
      .insert(webhooksTable)
      .values({
        userId,
        url: url.trim(),
        events: Array.isArray(events) ? events.join(",") : (events || "block,flag"),
        secret,
        enabled: true,
      })
      .returning();
    res.status(201).json(row);
  } catch {
    res.status(500).json({ error: "Failed to create webhook" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const id = Number(req.params.id);
    await db
      .delete(webhooksTable)
      .where(and(eq(webhooksTable.id, id), eq(webhooksTable.userId, userId)));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to delete webhook" });
  }
});

router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const id = Number(req.params.id);
    const { enabled, events } = req.body;
    const update: Record<string, any> = {};
    if (typeof enabled === "boolean") update.enabled = enabled;
    if (events) update.events = Array.isArray(events) ? events.join(",") : events;
    const [row] = await db
      .update(webhooksTable)
      .set(update)
      .where(and(eq(webhooksTable.id, id), eq(webhooksTable.userId, userId)))
      .returning();
    res.json(row);
  } catch {
    res.status(500).json({ error: "Failed to update webhook" });
  }
});

router.post("/:id/test", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const id = Number(req.params.id);
    const [hook] = await db
      .select()
      .from(webhooksTable)
      .where(and(eq(webhooksTable.id, id), eq(webhooksTable.userId, userId)))
      .limit(1);

    if (!hook) {
      res.status(404).json({ error: "Webhook not found" });
      return;
    }

    const payload = {
      event: "test",
      timestamp: new Date().toISOString(),
      session_id: "sess_test_" + randomBytes(4).toString("hex"),
      human_score: 0.05,
      verdict: "BOT",
      domain: "test.example.com",
      action: "blocked",
    };

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(hook.url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-PoH-Secret": hook.secret || "" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const status = response.ok ? "ok" : `http_${response.status}`;
      await db
        .update(webhooksTable)
        .set({ lastFiredAt: new Date(), lastStatus: status })
        .where(eq(webhooksTable.id, id));
      res.json({ ok: response.ok, status: response.status });
    } catch (fetchErr: any) {
      await db
        .update(webhooksTable)
        .set({ lastFiredAt: new Date(), lastStatus: "error" })
        .where(eq(webhooksTable.id, id));
      res.json({ ok: false, error: fetchErr.message });
    }
  } catch {
    res.status(500).json({ error: "Failed to test webhook" });
  }
});

export default router;
