---
name: Clerk proxy with dev keys
description: Clerk's proxyUrl feature only works with production keys (pk_live_); dev keys always return host_invalid.
---

## Rule

Never set `proxyUrl` on `<ClerkProvider>` when using Clerk development keys (`pk_test_...`). Gate it on the key type.

```typescript
const clerkProxyUrl = clerkPubKey.startsWith("pk_live_")
  ? (import.meta.env.VITE_CLERK_PROXY_URL || undefined)
  : undefined;
```

**Why:** Clerk's FAPI proxy feature is only available for production instances. Dev instances reject all proxy requests with `{"code":"host_invalid","message":"Invalid host"}`. The error comes back from Clerk's servers (the proxy middleware itself works fine), so no amount of fixing the server-side proxy helps — the rejection happens at the Clerk FAPI level.

**Also:** The `.replit` build command had a hardcoded `VITE_CLERK_PROXY_URL` pointing to the old deployment domain. When the app is redeployed to a new domain, the old proxy URL causes `host_invalid` even if production keys were used (proxy URL must be registered in Clerk dashboard per domain).

**How to apply:**
- For dev Clerk keys: `proxyUrl` must be `undefined`. Clerk dev instances work from any domain without a proxy.
- For production Clerk keys (`pk_live_...`): set `VITE_CLERK_PROXY_URL` in the `.replit` build command to `https://your-domain.replit.app/api/__clerk` AND register that exact URL in Clerk dashboard → Domains → Proxy URL.
- The server-side proxy middleware in `clerkProxyMiddleware.ts` is correct and ready — it just needs the frontend `proxyUrl` to be set when production keys are in use.
