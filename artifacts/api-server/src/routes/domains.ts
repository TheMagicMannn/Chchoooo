import { Router } from "express";
import { db, domainsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { randomUUID } from "crypto";
import { promises as dns } from "dns";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const domains = await db
      .select()
      .from(domainsTable)
      .where(eq(domainsTable.userId, userId));
    res.json(domains);
  } catch {
    res.status(500).json({ error: "Failed to fetch domains" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { domain } = req.body;
    if (!domain || typeof domain !== "string") {
      res.status(400).json({ error: "domain is required" });
      return;
    }
    const verificationToken = randomUUID().replace(/-/g, "");
    const [row] = await db
      .insert(domainsTable)
      .values({ userId, domain: domain.trim().toLowerCase(), verificationToken, verified: false })
      .returning();
    res.status(201).json(row);
  } catch {
    res.status(500).json({ error: "Failed to create domain" });
  }
});

router.get("/:id/verify", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const id = Number(req.params.id);
    const [row] = await db
      .select()
      .from(domainsTable)
      .where(and(eq(domainsTable.id, id), eq(domainsTable.userId, userId)));

    if (!row) {
      res.status(404).json({ error: "Domain not found" });
      return;
    }

    if (row.verified) {
      res.json({ verified: true, alreadyVerified: true });
      return;
    }

    const lookupHost = `_poh-verify.${row.domain}`;
    const expectedValue = `poh-site-verification=${row.verificationToken}`;

    try {
      const records = await dns.resolveTxt(lookupHost);
      const flat = records.flat();
      const found = flat.some((r) => r === expectedValue);

      if (found) {
        await db
          .update(domainsTable)
          .set({ verified: true })
          .where(eq(domainsTable.id, id));
        res.json({ verified: true });
      } else {
        res.json({ verified: false, checked: true });
      }
    } catch {
      res.json({ verified: false, checked: true, dnsError: true });
    }
  } catch {
    res.status(500).json({ error: "Failed to verify domain" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const id = Number(req.params.id);
    await db
      .delete(domainsTable)
      .where(and(eq(domainsTable.id, id), eq(domainsTable.userId, userId)));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to delete domain" });
  }
});

export default router;
