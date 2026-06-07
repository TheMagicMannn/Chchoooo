---
name: Replit deployment NODE_ENV
description: Replit deployments don't set NODE_ENV automatically; middleware gated on NODE_ENV=production silently becomes a no-op.
---

## Rule

Never gate critical server middleware on `process.env.NODE_ENV === "production"` in a Replit project. Replit deployment commands do NOT inject `NODE_ENV` automatically, so `process.env.NODE_ENV` is `undefined` at runtime and the guard is never satisfied.

**Why:** The Clerk proxy middleware used exactly this pattern. In development Vite bakes `import.meta.env.PROD = true` into the frontend build, setting `proxyUrl`. In the deployed environment `NODE_ENV` is absent, so the proxy middleware became a no-op. Every Clerk auth request hit the SPA fallback and received `index.html` instead of a Clerk API response — login completely broken with no error in logs.

**How to apply:**
- Gate middleware on the presence of required env vars (e.g. `CLERK_SECRET_KEY`) instead of `NODE_ENV`.
- For code that only makes sense when a built frontend exists (static file serving), gate on `existsSync(distPath)` instead of `NODE_ENV`.
- If you genuinely need to distinguish environments, set `NODE_ENV=production` explicitly in the Replit Secrets panel or in the deployment run command.
