import { Router } from "express";
import { db, apiTokensTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { randomUUID } from "crypto";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const tokens = await db
      .select()
      .from(apiTokensTable)
      .where(eq(apiTokensTable.userId, userId));
    res.json(tokens);
  } catch {
    res.status(500).json({ error: "Failed to fetch tokens" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { label } = req.body;
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
