import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

async function dbOk(): Promise<boolean> {
  try {
    await db.execute(sql`SELECT 1`);
    return true;
  } catch {
    return false;
  }
}

// GET /api  — platform health-check (Replit probes exactly this path)
router.get("/", async (_req, res) => {
  const ok = await dbOk();
  res.status(ok ? 200 : 503).json({ status: ok ? "ok" : "degraded", db: ok });
});

// GET /api/healthz — explicit health check (kept for backwards compat)
router.get("/healthz", async (_req, res) => {
  const ok = await dbOk();
  const data = HealthCheckResponse.parse({ status: ok ? "ok" : "degraded" });
  res.status(ok ? 200 : 503).json(data);
});

export default router;
