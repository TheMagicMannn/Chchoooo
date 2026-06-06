---
name: clerkClient v2 API
description: @clerk/express v2 exports clerkClient as a singleton instance, not a factory function.
---

## Rule
In `@clerk/express` v2, `clerkClient` is a **pre-built instance** (`declare const clerkClient: ClerkClient`). Do NOT call it as a function.

**Wrong:** `const clerk = clerkClient(); clerk.users.getUser(id)`
**Right:** `clerkClient.users.getUser(id)`

**Why:** Calling `clerkClient()` throws `TypeError: clerkClient is not a function` on every authenticated request. The error is caught and logged as a warning (in syncUser.ts it's non-fatal), but it means new users are never synced to the DB.
