import { Router } from "express";
import { db, apiTokensTable, usersTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { randomUUID } from "crypto";

const TOKEN_LIMITS: Record<string, number> = {
  free:       3,
  growth:     Infinity,
  enterprise: Infinity,
};

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const [tokens, planRows] = await Promise.all([
      db.select().from(apiTokensTable).where(eq(apiTokensTable.userId, userId)),
      db.select({ plan: usersTable.plan }).from(usersTable).where(eq(usersTable.id, userId)).limit(1),
    ]);
    const plan = planRows[0]?.plan ?? "free";
    const tokenLimit = TOKEN_LIMITS[plan] ?? 3;
    res.json({
      tokens,
      plan,
      tokenLimit: tokenLimit === Infinity ? null : tokenLimit,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch tokens" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { label } = req.body;

    // Enforce per-plan token limit
    const [planRows, countRows] = await Promise.all([
      db.select({ plan: usersTable.plan }).from(usersTable).where(eq(usersTable.id, userId)).limit(1),
      db.select({ total: count() }).from(apiTokensTable).where(eq(apiTokensTable.userId, userId)),
    ]);
    const plan = planRows[0]?.plan ?? "free";
    const limit = TOKEN_LIMITS[plan] ?? 3;
    const current = Number(countRows[0]?.total ?? 0);
    if (current >= limit) {
      res.status(403).json({
        error: `Your ${plan} plan allows up to ${limit} API token${limit === 1 ? "" : "s"}. Upgrade to create more.`,
        plan,
        limit,
        upgrade_url: "/billing",
      });
      return;
    }

    const token = randomUUID();
    const [row] = await db
      .insert(apiTokensTable)
      .values({ userId, token, label: label || "default" })
      .returning();
    res.status(201).json(row);
  } catch {
    res.status(500).json({ error: "Failed to create token" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const id = Number(req.params.id);
    await db
      .delete(apiTokensTable)
      .where(and(eq(apiTokensTable.id, id), eq(apiTokensTable.userId, userId)));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to revoke token" });
  }
});

export default router;
