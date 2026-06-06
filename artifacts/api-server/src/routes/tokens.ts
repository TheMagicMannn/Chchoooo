import { Router } from "express";
import { db, apiTokensTable, usersTable, domainsTable } from "@workspace/db";
import { eq, and, count, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { randomUUID } from "crypto";

const TOKEN_LIMITS: Record<string, number> = {
  free:       3,
  growth:     20,
  enterprise: Infinity,
};

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const [tokens, planRows, domains] = await Promise.all([
      db.select().from(apiTokensTable).where(eq(apiTokensTable.userId, userId)),
      db.select({ plan: usersTable.plan }).from(usersTable).where(eq(usersTable.id, userId)).limit(1),
      db.select({ id: domainsTable.id, domain: domainsTable.domain }).from(domainsTable).where(eq(domainsTable.userId, userId)),
    ]);
    const plan = planRows[0]?.plan ?? "free";
    const tokenLimit = TOKEN_LIMITS[plan] ?? 3;
    const domainMap = Object.fromEntries(domains.map((d) => [d.id, d.domain]));
    const tokensWithDomain = tokens.map((t) => ({
      ...t,
      linkedDomain: t.linkedDomainId ? (domainMap[t.linkedDomainId] ?? null) : null,
    }));
    res.json({
      tokens: tokensWithDomain,
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
    res.status(201).json({ ...row, linkedDomain: null });
  } catch {
    res.status(500).json({ error: "Failed to create token" });
  }
});

router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const id = Number(req.params.id);
    const { linkedDomainId, label } = req.body;

    const update: Record<string, any> = {};
    if (typeof label === "string") update.label = label;

    if ("linkedDomainId" in req.body) {
      if (linkedDomainId === null) {
        update.linkedDomainId = null;
      } else {
        const [domain] = await db
          .select()
          .from(domainsTable)
          .where(and(eq(domainsTable.id, linkedDomainId), eq(domainsTable.userId, userId)))
          .limit(1);
        if (!domain) {
          res.status(404).json({ error: "Domain not found" });
          return;
        }
        update.linkedDomainId = linkedDomainId;
      }
    }

    if (Object.keys(update).length === 0) {
      res.status(400).json({ error: "Nothing to update" });
      return;
    }

    const [row] = await db
      .update(apiTokensTable)
      .set(update)
      .where(and(eq(apiTokensTable.id, id), eq(apiTokensTable.userId, userId)))
      .returning();

    if (!row) {
      res.status(404).json({ error: "Token not found" });
      return;
    }

    const linkedDomain = row.linkedDomainId
      ? (await db.select({ domain: domainsTable.domain }).from(domainsTable).where(eq(domainsTable.id, row.linkedDomainId)).limit(1))[0]?.domain ?? null
      : null;

    res.json({ ...row, linkedDomain });
  } catch {
    res.status(500).json({ error: "Failed to update token" });
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
