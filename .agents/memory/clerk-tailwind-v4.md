---
name: Clerk + Tailwind v4 setup
description: Critical setup requirements for Clerk auth with Tailwind v4 in this monorepo — CSS layer ordering and vite config.
---

## Rules

1. In `index.css`, the `@layer` declaration and Clerk CSS import must come BEFORE `@import 'tailwindcss'`:
   ```css
   @layer theme, base, clerk, components, utilities;
   @import "tailwindcss";
   @import "@clerk/themes/shadcn.css";
   ```

2. In `vite.config.ts`, pass `optimize: false` to the Tailwind plugin to prevent Clerk's nested `@layer` imports from being reordered in prod builds:
   ```ts
   tailwindcss({ optimize: false })
   ```

**Why:** Tailwind v4's lightningcss optimizer reorders nested `@layer` imports from `@clerk/themes/*.css`, causing Clerk UI to render correctly in dev but broken in prod.

3. After changing `lib/db` schema, run `tsc --build` in `lib/db` before running `typecheck` on `api-server`. The API server uses TypeScript project references — it reads declaration files from `lib/db/dist/`, which only exist after a build.

**Why:** `api-server/tsconfig.json` has `"references": [{ "path": "../../lib/db" }]` with `composite: true`. TypeScript resolves types from the built `.d.ts` files, not the source files directly.

## How to apply
- Whenever adding or updating Clerk auth in a Tailwind v4 Vite app in this repo.
- Whenever new tables are added to `lib/db/src/schema/` and the api-server typecheck fails with "Module has no exported member".
