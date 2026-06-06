---
name: Drizzle date_trunc parameterization
description: PostgreSQL date_trunc requires a string literal first argument; Drizzle sql template parameterizes JS values, breaking it.
---

## Rule
Never pass a JS variable as the first argument of `date_trunc` through Drizzle's `sql` template — it becomes a bound parameter (`$1`) and PostgreSQL rejects it with a 500.

**Wrong:** `sql\`date_trunc(${truncUnit}, ${col})\``
**Right:** `sql\`date_trunc(${sql.raw(\`'${truncUnit}'\`)}, ${col})\``

**Why:** `date_trunc('hour', col)` requires a string literal. Drizzle's `${value}` syntax parameterizes all JS values. `sql.raw()` inlines the string without parameterization — safe as long as `truncUnit` is controlled by server code (e.g. `"hour" | "day"`), not user input.
