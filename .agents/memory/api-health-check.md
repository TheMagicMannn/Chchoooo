---
name: API server health check path
description: Replit deployment platform probes GET /api — the health router must respond there or repeated failures trigger SIGTERM.
---

## Rule
The Replit deployment platform sends `GET /api` as its health check. The health router **must** register a `GET /` handler (which becomes `GET /api` when mounted at `/api`). A handler only at `/api/healthz` is invisible to the platform probe.

**Why:** The platform repeatedly polls `/api` during and after startup. If it receives 500/404 for long enough, it sends SIGTERM to the artifact process, then shuts the whole deployment down.

**How to apply:** In `health.ts`, always include:
```ts
router.get("/", async (_req, res) => {
  const ok = await dbOk();
  res.status(ok ? 200 : 503).json({ status: ok ? "ok" : "degraded", db: ok });
});
```

Also: add `uncaughtException` and `unhandledRejection` handlers in `index.ts` so crashes log before exiting rather than dying silently. Remove `--enable-source-maps` from the production run command to avoid loading 5.8MB of map files into memory unnecessarily.
