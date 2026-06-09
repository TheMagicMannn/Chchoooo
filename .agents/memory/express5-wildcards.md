---
name: Express 5 wildcard routes
description: Express 5 (path-to-regexp v8) rejects bare "*" route patterns at startup; correct catch-all for SPA fallback.
---

## Rule

Never use `app.get("*", handler)` or any bare `"*"` path in Express 5. It throws at startup:
```
PathError: Missing parameter name at index N
```

**Why:** Express 5 upgraded to path-to-regexp v8, which requires named wildcards (e.g. `{*splat}`) and rejects bare `*`.

**How to apply:** For SPA catch-all fallback, use `app.use()` with no path instead — it bypasses path-to-regexp entirely:

```typescript
// WRONG — throws at startup in Express 5
app.get("*", (_req, res) => res.sendFile(...));

// CORRECT — app.use with no path catches all unmatched requests
app.use((_req, res) => res.sendFile(...));
```

This must come after all API routes and `express.static()` so it only fires for unmatched paths.
