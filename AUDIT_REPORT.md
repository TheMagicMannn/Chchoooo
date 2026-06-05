# HUMAN TELEMETRY PLATFORM — COMPLETE AUDIT REPORT
> Evidence-based engineering analysis. Every statement is backed by source code.
> Audit Date: 2026-06-05

---

## EXECUTIVE SUMMARY

The platform is a **partially implemented SaaS bot detection tool** with a solid SDK and scoring engine that are architecturally disconnected from each other. The most critical finding is that the server-side scoring engine (`scorer.ts`) is **never called** during event ingestion — the ingest route blindly trusts client-supplied scores, or generates a random score as a fallback. This means the platform collects behavioral signals from browsers but does not use them server-side. Approximately 60% of the dashboard UI presents hardcoded mock data. The product is **not production-ready** in its current state and requires significant surgery before commercial launch.

---

## ARCHITECTURE OVERVIEW

```
Browser SDK (v2.js)
  │ POST /api/ingest  [Bearer token auth]
  ▼
API Server (Express/TypeScript)
  │
  ├── /api/ingest       ← CRITICAL: ignores signals, trusts client score
  ├── /api/dashboard    ← reads from eventsTable (real data)
  ├── /api/analytics    ← reads from eventsTable (real data)
  ├── /api/webhooks     ← CRUD only; never auto-fired on events
  ├── /api/alerts       ← CRUD only; rules never evaluated on events
  ├── /api/domains      ← real DNS verification
  └── /api/tokens       ← real CRUD
  │
  └── lib/scorer.ts     ← fully written but NEVER IMPORTED or CALLED
  
Database (PostgreSQL via Drizzle ORM)
  ├── users
  ├── events            ← primary data store
  ├── api_tokens
  ├── domains
  ├── webhooks
  └── alert_rules

Frontend (React/Vite)
  ├── Real data pages: dashboard, logs, analytics, risk, reports, alerts, integrations
  └── Fully mocked pages: ops, enterprise, billing
```

No Kafka, no ClickHouse, no ONNX inference engine, no Go service, no edge workers, no multi-region infrastructure — these are referenced only in UI copy and Playbooks page documentation.

---

## IMPLEMENTED FEATURES

### Browser SDK — `artifacts/proof-of-human/public/sdk/v2.js`
**Status: Fully Implemented | Production Readiness: 72/100**

Genuinely collects and scores the following signals:

| Signal | Collection Method | Scoring Algorithm |
|--------|-------------------|-------------------|
| Mouse trajectory entropy | `mousemove` events, up to 400 samples | Shannon entropy across 8 direction octants + speed CV + direction change frequency |
| Keystroke cadence | `keydown` intervals, up to 200 samples | Coefficient of variation (CV) of inter-key intervals |
| Scroll velocity variance | `scroll` events, up to 200 velocity samples | CV of scroll speeds |
| Interaction timing | First interaction timestamp vs page load | Thresholded delay curve (50ms → 0.05, 500ms → 0.75) |
| Browser fingerprint | navigator properties + canvas + WebGL | Deduction-based scoring (starts 1.0, deductions applied) |

Fingerprint checks:
- `navigator.webdriver === true` → −0.75
- Zero plugins on desktop → −0.25
- Missing `navigator.languages` → −0.20
- `outerWidth === 0` or `outerHeight === 0` → −0.20
- Chrome UA without `window.chrome` object → −0.20
- Default headless viewport (800×600) → −0.10
- Blank or tiny canvas fingerprint → −0.15
- SwiftShader / llvmpipe WebGL renderer → −0.40
- Missing `Notification` API → −0.05

Composite weighting: `mouse*0.28 + keystroke*0.17 + scroll*0.17 + timing*0.12 + fingerprint*0.26`

Hard caps: webdriver detected → composite ≤ 0.08; fingerprintScore < 0.15 → composite ≤ 0.25

Beacon delivery: `fetch` with `keepalive: true`, also fires on `pagehide` and `beforeunload`. 6-second timer as primary trigger.

**Issues:**
- `Math.random()` used in UUID fallback (line 22) — acceptable but `crypto.randomUUID()` is preferred and already attempted first
- Endpoint hardcoded to `window.location.origin + '/api/ingest'` (line 54) — ignores `cfg.endpoint` override after setting it
- No retry logic on beacon failure
- No payload size guard (signals object could be large)

---

### Server-Side Scoring Engine — `artifacts/api-server/src/lib/scorer.ts`
**Status: Fully Implemented but NEVER CALLED | Production Readiness: 68/100**

Complete implementation with:
- UA pattern matching: 18 headless patterns (`HeadlessChrome`, `PhantomJS`, `puppeteer`, `playwright`, `curl`, `wget`, `scrapy`, `axios`, etc.)
- 7 suspicious UA patterns
- SDK signal re-scoring with server-side penalties
- Weighted final composite: `sdkScore*0.70 + uaScore*0.25 + netScore*0.05`
- UA hard cap: if UA score < 0.15, final score capped at 0.08
- Three-verdict output: `HUMAN` (≥0.70), `CAPTCHA` (0.30–0.69), `BOT` (<0.30)
- Explainable `factors` and `flags` arrays in output

**This file exports `computeScore()` and `verdictFromScore()`. Neither is imported anywhere in the routes.**

---

### Ingest API — `artifacts/api-server/src/routes/ingest.ts`
**Status: Partially Implemented | Production Readiness: 25/100**

Works: Token authentication via Bearer header, token lookup in `api_tokens` table, event persistence to `eventsTable`, basic `session_id` validation.

Does NOT work:
- `computeScore()` from `scorer.ts` is **never called**
- The `signals` field sent by the SDK is **received in the body but never used**
- Score is taken directly from `req.body.score` (client-trusted)
- If score is absent: `Math.random() * 0.3 + 0.7` is used (line 40)
- Verdict is taken from `req.body.verdict` (client-trusted)
- No IP extraction for geo context
- No rate limiting
- No request body size limit
- No schema validation on body fields

---

### Analytics API — `artifacts/api-server/src/routes/analytics.ts`
**Status: Fully Implemented | Production Readiness: 70/100**

All five endpoints query real `eventsTable` data:
- `GET /api/analytics/overview` — totals, counts by verdict, avg score, human/bot rates
- `GET /api/analytics/hourly` — time-bucketed (hour or day) event counts
- `GET /api/analytics/geo` — top 10 countries by session count
- `GET /api/analytics/breakdown` — by event type, by domain, score distribution histogram
- `GET /api/analytics/recent-sessions` — last N sessions

All are protected by `requireAuth`. All return real data from DB.

**Issues:** No input validation on `range` parameter (accepts arbitrary strings, falls through to 7d default). No pagination on geo/breakdown. `date_trunc` uses interpolated string for `truncUnit` — potential SQL injection if `truncUnit` is ever user-controlled (it is derived from `range` query param via `switch`, currently safe but fragile).

---

### Dashboard API — `artifacts/api-server/src/routes/dashboard.ts`
**Status: Fully Implemented | Production Readiness: 72/100**

- `GET /api/dashboard/stats` — real totals + today's sessions + last 10 events
- `GET /api/dashboard/logs` — paginated event log (limit max 200, offset support)

Both protected by `requireAuth`. Real DB queries.

---

### Webhook Management — `artifacts/api-server/src/routes/webhooks.ts`
**Status: Partially Implemented | Production Readiness: 40/100**

CRUD is real: create, list, update (toggle enabled/events), delete, test-fire.

Test fire (`POST /:id/test`) actually sends an HTTP POST to the configured URL with a 5-second timeout and updates `lastFiredAt` and `lastStatus` in the DB. Secret is generated as `whsec_` + 20 random bytes hex.

**CRITICAL GAP:** Webhooks are **never automatically triggered by ingest events**. `ingest.ts` does not import or call any webhook dispatch function. The webhook infrastructure exists in the DB and has CRUD management, but no event ever flows through it automatically.

Missing: HMAC signature on webhook delivery (secret exists in DB but is only passed as `X-PoH-Secret` header in plain text, not as an HMAC), retry logic, delivery queue, dead letter handling.

---

### Alert Rules — `artifacts/api-server/src/routes/alert_rules.ts`
**Status: Partially Implemented | Production Readiness: 35/100**

CRUD is real: create, list, update (enabled/threshold/action/name), delete.
`GET /api/alerts/stats` returns real daily bot/captcha/total counts and active rule count.

**CRITICAL GAP:** Alert rules are **never evaluated against incoming events**. `ingest.ts` does not import or call any rule evaluation function. No trigger mechanism exists. `triggeredCount` and `lastTriggeredAt` are never updated by the system.

---

### Domain Management — `artifacts/api-server/src/routes/domains.ts`
**Status: Fully Implemented | Production Readiness: 68/100**

- Create domain (stores verification token)
- List domains
- Delete domain
- `GET /:id/verify` — performs actual DNS TXT lookup via `dns.resolveTxt()` for `_poh-verify.<domain>` expecting `poh-site-verification=<token>`

DNS verification is real. **Issues:** No uniqueness constraint preventing duplicate domain registrations across different users. No enforcement that only verified domains can be used with a given token.

---

### Token Management — `artifacts/api-server/src/routes/tokens.ts`
**Status: Fully Implemented | Production Readiness: 72/100**

Create (uses `randomUUID()`), list, delete/revoke. All `requireAuth` protected. Token ownership enforced on delete.

**Issue:** No ability to see token usage statistics. No expiry mechanism. No rotation workflow.

---

### Database Schema — `lib/db/src/schema/`
**Status: Fully Implemented | Production Readiness: 55/100**

| Table | Purpose | Issues |
|-------|---------|--------|
| `users` | User accounts linked to Clerk; `plan` column (free/growth/enterprise) | Plan is a free-text field, not an enum; no enforcement |
| `events` | Core telemetry log | No index on `userId + createdAt` (every analytics query does full scans for that user); `score` and `verdict` are nullable; no `signals` column (raw signals not stored) |
| `api_tokens` | Bearer tokens for SDK auth | No expiry column; no revoked-at tracking |
| `domains` | Customer domains with DNS verification | No unique constraint on `(userId, domain)` |
| `webhooks` | Webhook endpoint configuration | Schema is correct; delivery history not stored |
| `alert_rules` | Alert rule configuration | `triggeredCount` is `text` type (should be `integer`); never incremented |

**No migration files exist** — `lib/db/src/migrations/` directory does not exist. Schema management is apparently done via `drizzle-kit push` which is not safe for production (no version history, no rollback).

**No indexes defined** beyond primary keys and the `token.unique()` constraint. Every analytics query will table-scan `events` filtered by `userId`.

**Raw signals not stored** — the SDK sends a full `signals` object but `eventsTable` has no `signals` column. Signal data is discarded after ingest. Cannot perform retrospective analysis.

---

### Authentication — `artifacts/api-server/src/middlewares/requireAuth.ts`
**Status: Fully Implemented | Production Readiness: 75/100**

Two middleware functions:
- `requireAuth`: validates Clerk session, extracts `userId` from `sessionClaims.userId` or `auth.userId`
- `requireBearer`: extracts Bearer token from `Authorization` header

Clerk integration is wired correctly in `app.ts` via `clerkMiddleware`. CORS is configured from `ALLOWED_ORIGINS` env var.

**Issues:** `requireAuth` checks `sessionClaims.userId` first — this means if a JWT is crafted with a custom `userId` claim, it could set any userId. Should rely solely on `auth.userId`. The `(req as any).userId` pattern bypasses TypeScript type safety.

---

## PARTIALLY IMPLEMENTED FEATURES

### Billing (`artifacts/proof-of-human/src/pages/billing.tsx`)
**Status: UI Only | Production Readiness: 5/100**

The UI displays plan comparison tables and usage meters. All data is **hardcoded**:
- Plan "Growth — $49/month" is hardcoded string (line 34)
- Usage bars "287,432 / 500,000 (57%)" are hardcoded (line 51)
- "Visa ending in 4242" is a hardcoded test card (line 89)
- Invoice table contains 6 hardcoded rows with 2023/2024 dates (lines 196–219)
- "Upgrade to Enterprise" and "Update" card buttons have no `onClick` handlers

No Stripe or any payment processor is integrated. No billing API routes exist. The `users.plan` column exists in DB but is never read by the frontend or enforced by the backend.

---

### Operations Console (`artifacts/proof-of-human/src/pages/ops.tsx`)
**Status: UI Only / Fully Mocked | Production Readiness: 2/100**

Every tab is simulated:
- **Health tab**: Hardcoded service status cards (Kafka, ClickHouse, Inference Engine) referencing infrastructure that does not exist
- **Logs tab**: `MOCK_LOGS` array of 10 strings randomly selected every 1.5 seconds (`Math.random()` line 61). No connection to any real log stream
- **Metrics tab**: `generateSparkline()` uses `Math.random() * 100` (line 48). All metric values are hardcoded strings (line 235-241). Prometheus text block is hardcoded string (line 20-46)
- **Topology tab**: Static SVG diagram of infrastructure that does not exist

---

### Enterprise Operations (`artifacts/proof-of-human/src/pages/enterprise.tsx`)
**Status: UI Only / Fully Mocked | Production Readiness: 2/100**

All data is hardcoded constants:
- SLA metrics (99.994% uptime, 6.8ms P99, 2.1s freshness) — hardcoded strings
- Incident history table — 4 hardcoded rows (Jan 8, Dec 22, Dec 3, Nov 14 2023/2024)
- Model registry (v2.3.1 through v2.4.1 F1 scores) — hardcoded array
- `modelData` and `funnelData` are static JS arrays
- Regional failover (us-east-1, eu-west-1, ap-southeast-1) — hardcoded cards
- False positive review — 3 hardcoded session rows with hardcoded scores
- "Confirm FP" / "Confirm Bot" buttons have no `onClick` handlers

No AI model exists. No Go inference service. No multi-region deployment.

---

### Playbooks (`artifacts/proof-of-human/src/pages/playbooks.tsx`)
**Status: UI Only | Production Readiness: 5/100**

Displays operational runbooks referencing infrastructure that does not exist: Kafka (`rpk`), ClickHouse (`/var/lib/clickhouse`), ONNX model (`/opt/poh/model.onnx`), Go inference service (`poh-inference`), PagerDuty. All shell commands are static text strings in the component. None are executable.

---

## MISSING FEATURES

| Feature | Status | Notes |
|---------|--------|-------|
| Server-side scoring (calling `computeScore` on ingest) | Missing | `scorer.ts` exists but is never imported in `ingest.ts` |
| Webhook auto-dispatch on ingest | Missing | No dispatch function exists |
| Alert rule evaluation on ingest | Missing | No evaluation function exists |
| Raw signal storage | Missing | No `signals` column in `events` table |
| Rate limiting on any endpoint | Missing | No `express-rate-limit` or equivalent found |
| Request body validation (Zod/etc) | Missing | Ingest route uses raw `req.body` destructuring |
| Database migrations | Missing | No migrations directory |
| Database indexes | Missing | Only PK and `token.unique()` |
| Billing / payment processing | Missing | No Stripe integration |
| Plan enforcement / usage limits | Missing | `users.plan` column exists but is never enforced |
| Organizations / Teams | Missing | No org or team table, no RBAC |
| SSO | Missing | Clerk is configured for individual auth only |
| Session replay | Missing | No such functionality in any file |
| Audit logs | Missing | No audit log table or events |
| Data retention policies | Missing | No TTL or cleanup jobs |
| IP geolocation enrichment | Missing | `country` field in events is client-supplied |
| Anomaly detection / threat intelligence | Missing | No IP reputation, ASN analysis, or threat feeds |
| Real-time alerting (email, Slack, PagerDuty) | Missing | Webhook test fires work but no auto-trigger |
| Token expiry / rotation | Missing | Tokens are permanent |
| API versioning | Missing | All routes are unversioned |

---

## MERGE ANALYSIS

Based on code evidence, two distinct layers are visible:

**Layer A (Scoring-focused, older or different origin):**
- `artifacts/api-server/src/lib/scorer.ts` — comprehensive scoring engine
- `artifacts/proof-of-human/public/sdk/v2.js` — sophisticated signal collection

**Layer B (SaaS infrastructure, likely added later):**
- `artifacts/api-server/src/routes/webhooks.ts`
- `artifacts/api-server/src/routes/alert_rules.ts`
- `artifacts/proof-of-human/src/pages/billing.tsx`
- `artifacts/proof-of-human/src/pages/enterprise.tsx`

**What was lost or disconnected during merge:**

The most significant regression is that `ingest.ts` does not call `computeScore()`. This is the join point between the two layers. Evidence: `scorer.ts` exports a complete function; `ingest.ts` was likely written separately and either never connected or had the connection removed during merge. The `signals` object is listed in `req.body` destructuring but never passed to the scorer.

**No merge conflicts found in source** (no `<<<<<<<` markers). The damage is architectural disconnection, not syntactic conflict.

**Database schema is synchronized** — all 6 tables are exported from `index.ts` and the schema matches what the routes use. No orphaned tables or missing tables for implemented routes.

**APIs and UI are synchronized** on the real-data pages (dashboard, analytics, risk, reports, logs, alerts, integrations). The mocked pages (ops, enterprise, billing) make no API calls at all.

---

## DATABASE ANALYSIS

### Complete Table Inventory

**`users`**
- Columns: `id` (text PK, Clerk user ID), `clerk_id` (unique), `email`, `name`, `plan` (text, default "free"), `created_at`
- Used by: Auth middleware populates userId; routes filter by userId
- Issues: `plan` is free text, not enforced; no `updated_at`; no session tracking

**`events`**
- Columns: `id` (serial PK), `token_id`, `user_id`, `session_id`, `domain`, `event_type` (default "page_view"), `score` (real, nullable), `verdict` (text, nullable), `country`, `user_agent`, `referrer`, `duration_ms` (real), `created_at`
- Used by: All analytics and dashboard routes; primary data table
- Missing: `signals` (JSONB), `ip_address`, `flags` (text[]), `factors` (JSONB), index on `(user_id, created_at)`, index on `verdict`
- Issues: `score` and `verdict` are nullable but treated as non-null in analytics aggregate queries; no partitioning for scale

**`api_tokens`**
- Columns: `id` (serial PK), `user_id`, `token` (unique), `label`, `created_at`
- Missing: `expires_at`, `revoked_at`, `last_used_at`, `usage_count`

**`domains`**
- Columns: `id` (serial PK), `user_id`, `domain`, `verification_token`, `verified` (bool), `created_at`
- Missing: unique constraint on `(user_id, domain)`; `verified_at`

**`webhooks`**
- Columns: `id` (serial PK), `user_id`, `url`, `events` (text, comma-separated), `secret`, `enabled` (bool), `last_fired_at`, `last_status`, `created_at`
- Missing: delivery log table; retry count; failure threshold for auto-disable; HMAC not used for signing

**`alert_rules`**
- Columns: `id` (serial PK), `user_id`, `name`, `condition` (text), `threshold` (real), `domain`, `action` (text), `enabled` (bool), `triggered_count` (text — **should be integer**), `last_triggered_at`, `created_at`
- Critical bug: `triggered_count` is type `text` (schema line 14: `text("triggered_count").notNull().default("0")`)
- Never updated by system

---

## API ANALYSIS

| Method | Path | Auth | Input Validation | Rate Limiting | Production Ready |
|--------|------|------|-----------------|---------------|-----------------|
| POST | /api/ingest | Bearer token | session_id only | None | No |
| GET | /api/dashboard/stats | Clerk session | None | None | Partial |
| GET | /api/dashboard/logs | Clerk session | limit clamped to 200 | None | Partial |
| GET | /api/analytics/overview | Clerk session | range (unvalidated) | None | Partial |
| GET | /api/analytics/hourly | Clerk session | range (unvalidated) | None | Partial |
| GET | /api/analytics/geo | Clerk session | range (unvalidated) | None | Partial |
| GET | /api/analytics/breakdown | Clerk session | range (unvalidated) | None | Partial |
| GET | /api/analytics/recent-sessions | Clerk session | limit clamped to 50 | None | Partial |
| GET | /api/webhooks | Clerk session | None | None | Partial |
| POST | /api/webhooks | Clerk session | url format checked | None | Partial |
| DELETE | /api/webhooks/:id | Clerk session | ownership checked | None | Partial |
| PATCH | /api/webhooks/:id | Clerk session | type checks | None | Partial |
| POST | /api/webhooks/:id/test | Clerk session | ownership checked | None | Partial |
| GET | /api/alerts | Clerk session | None | None | Partial |
| POST | /api/alerts | Clerk session | name required | None | Partial |
| DELETE | /api/alerts/:id | Clerk session | ownership checked | None | Partial |
| PATCH | /api/alerts/:id | Clerk session | type checks | None | Partial |
| GET | /api/alerts/stats | Clerk session | None | None | Partial |
| GET | /api/domains | Clerk session | None | None | Partial |
| POST | /api/domains | Clerk session | domain string required | None | Partial |
| DELETE | /api/domains/:id | Clerk session | ownership checked | None | Partial |
| GET | /api/domains/:id/verify | Clerk session | ownership checked | None | Partial |
| GET | /api/tokens | Clerk session | None | None | Partial |
| POST | /api/tokens | Clerk session | None | None | Partial |
| DELETE | /api/tokens/:id | Clerk session | ownership checked | None | Partial |

No endpoint has rate limiting. No endpoint has output schema validation. Error handling is try/catch with generic 500 responses — no structured error codes.

---

## SECURITY ANALYSIS

### CRITICAL

**1. Client-Trusted Score — `artifacts/api-server/src/routes/ingest.ts:40–43`**
```
const humanScore = typeof score === "number" ? score : Math.random() * 0.3 + 0.7;
const computedVerdict = verdict || (humanScore >= 0.7 ? "HUMAN" : ...);
```
Any client can POST `{"score": 1.0, "verdict": "HUMAN", "session_id": "x"}` and receive a HUMAN verdict stored in the database. The entire detection mechanism is bypassed. Severity: **Critical**.

**2. Client-Trusted Verdict — same file, line 43**
`verdict` from the request body is accepted directly. A bot sending `verdict: "HUMAN"` bypasses all detection. Severity: **Critical**.

**3. Math.random() as Score Fallback — `ingest.ts:40`**
When `score` is not a number, a random value between 0.7–1.0 is used. This means events with no SDK signals are categorized as HUMAN with a fabricated high score. Severity: **Critical**.

**4. No Rate Limiting on Ingest**
Any holder of a valid Bearer token can flood the `/api/ingest` endpoint with no throttling. This enables storage exhaustion and data poisoning. Severity: **High**.

**5. Country/Geo is Client-Supplied**
`country` is taken directly from `req.body.country` with no IP-based verification. A bot can self-report as any country. Severity: **High**.

### HIGH

**6. Webhook Secret Sent as Plaintext Header**
`webhooks.ts:116`: `"X-PoH-Secret": hook.secret || ""`
The shared secret is sent verbatim in the header rather than as an HMAC signature over the payload. Any interceptor who sees one delivery learns the secret. Standard practice (used by Stripe, GitHub) is `HMAC-SHA256(payload, secret)` in a `X-Signature-256` header. Severity: **High**.

**7. No Request Body Size Limit on Ingest**
`express.json()` has no size limit configured in `app.ts`. A malicious actor could send multi-MB payloads to crash or slow the process. Severity: **High**.

**8. SQL Injection Risk in Analytics**
`analytics.ts:71`: `sql\`date_trunc(${truncUnit}, ...)\`` — `truncUnit` is a string derived from a `switch` on `range` query param. Currently safe (switch with explicit cases), but the pattern is fragile. If the switch is ever modified incorrectly, user-controlled input flows directly into raw SQL. Severity: **Medium** (currently latent).

### MEDIUM

**9. sessionClaims.userId Priority in requireAuth**
`requireAuth` checks `sessionClaims?.userId` before `auth?.userId`. Custom JWT claims can override the canonical user ID. Severity: **Medium**.

**10. No CORS Validation for Ingest Route**
The ingest endpoint is called by third-party websites. No `Origin` validation occurs — any website can call it with a valid Bearer token. This is partially by design but means a stolen Bearer token can be used from any origin. Severity: **Medium**.

**11. Numeric IDs for Webhook/Alert/Domain Delete**
Routes use `Number(req.params.id)` without NaN checks. `DELETE /api/webhooks/abc` produces `NaN` which may cause unexpected DB behavior depending on Drizzle's handling. Severity: **Low**.

---

## BOT DETECTION ANALYSIS

### What is Actually Detected

**Client-side (real, in SDK):**
- `navigator.webdriver` property presence
- Plugin count (zero on desktop = suspicious)
- `navigator.languages` absence
- `outerWidth/outerHeight === 0`
- `window.chrome` absent on Chrome UA
- Default headless viewport (800×600)
- Canvas fingerprint blank/tiny
- WebGL SwiftShader/llvmpipe renderer
- Mouse entropy (Shannon entropy of direction distribution)
- Keystroke cadence coefficient of variation
- Scroll velocity variance
- Interaction timing delay

**Server-side (implemented in scorer.ts but NEVER EXECUTED):**
- 18 headless User-Agent patterns
- 7 suspicious bot UA patterns
- Zero/missing UA
- SDK signal re-verification with penalties

### What is NOT Detected

- IP reputation / ASN / datacenter IP ranges
- VPN / proxy / Tor exit node detection
- Device fingerprint stability across sessions
- Headless browser evasion techniques (Puppeteer Extra stealth, undetected-chromedriver)
- Distributed credential stuffing patterns
- Session velocity anomalies (too many sessions from one IP)
- Behavioral biometrics beyond basic entropy (no pressure, gyroscope, accelerometer for mobile)
- TLS fingerprinting (JA3/JA4)
- HTTP/2 fingerprinting
- Mouse movement curve fitting (Bézier analysis)
- Click position distribution analysis
- Form timing analysis

### Fake/Random Data Locations

| File | Line | Issue | Severity |
|------|------|-------|----------|
| `ingest.ts` | 40 | `Math.random() * 0.3 + 0.7` as fallback score | Critical |
| `ingest.ts` | 41–43 | Client-trusted `score` and `verdict` fields | Critical |
| `ops.tsx` | 48 | `Math.random() * 100` for metric sparklines | Medium |
| `ops.tsx` | 61 | `MOCK_LOGS[Math.floor(Math.random() * MOCK_LOGS.length)]` every 1.5s | Medium |
| `ops.tsx` | 20–46 | Hardcoded Prometheus metrics text (1,847,293 events, etc.) | High |
| `ops.tsx` | 117–134 | Hardcoded infra health table (prod-inf-01, prod-ch-01) | High |
| `billing.tsx` | 34 | Hardcoded "Growth plan — $49/month" | High |
| `billing.tsx` | 51 | Hardcoded "287,432 / 500,000 (57%)" usage | High |
| `billing.tsx` | 89 | Hardcoded "Visa ending in 4242" | High |
| `billing.tsx` | 196–219 | Hardcoded invoice history (6 rows) | High |
| `enterprise.tsx` | 13–32 | Hardcoded `uptimeData`, `modelData`, `funnelData` arrays | High |
| `enterprise.tsx` | 341–378 | Hardcoded false positive review rows | High |
| `sidebar.tsx` | 612 | `Math.random()` for skeleton loading width | Low (UI only) |

---

## PRODUCTION READINESS SCORES

| Component | Score | Blocker |
|-----------|-------|---------|
| Browser SDK (v2.js) | 72/100 | No retry, endpoint override bug |
| Server scoring engine (scorer.ts) | 68/100 | Never called |
| Ingest API | 25/100 | Client-trusted scores, Math.random fallback, no rate limit |
| Dashboard API | 72/100 | No rate limit, no output validation |
| Analytics API | 70/100 | No rate limit, fragile SQL pattern |
| Webhook management | 40/100 | Never auto-fired, no HMAC signing |
| Alert rules | 35/100 | Never evaluated, triggered_count wrong type |
| Domain verification | 68/100 | Real DNS check, no uniqueness constraint |
| Token management | 72/100 | No expiry mechanism |
| Database schema | 55/100 | No migrations, no indexes, wrong type on triggered_count |
| Auth / security | 55/100 | Client-trusted fields, no rate limiting |
| Billing | 5/100 | Fully hardcoded |
| Ops console | 2/100 | Fully mocked, references non-existent infra |
| Enterprise page | 2/100 | Fully mocked |
| **Overall Platform** | **38/100** | |

---

## TECHNICAL DEBT

1. **scorer.ts is orphaned** — built but never wired in. This is the single most impactful fix.
2. **No database migrations** — `drizzle-kit push` cannot be used safely on production data.
3. **No DB indexes** — `events` table will become unusable at scale without `(user_id, created_at)` index.
4. **Webhook auto-dispatch missing** — the entire alerting and notification system is non-functional.
5. **Alert rule evaluation missing** — rules exist in DB but are never checked.
6. **Billing is UI theater** — no real subscription, no payment processor, no enforcement.
7. **`triggeredCount` is text, not integer** — schema bug that blocks correct counter behavior.
8. **Raw signals discarded** — no `signals` column in events; retrospective analysis impossible.
9. **Country is client-supplied** — geo data is untrustworthy.
10. **No request validation library** — Zod schemas exist in `lib/db` but are not used for route input validation.

---

## COMPETITIVE GAP ANALYSIS

### vs. Cloudflare Turnstile
- **Missing:** Challenge page / widget rendering. Turnstile shows a visual challenge for uncertain traffic. This platform has a `CAPTCHA` verdict but no challenge mechanism.
- **Missing:** Edge-network integration. Turnstile runs at Cloudflare's edge. This platform requires JavaScript SDK installation.
- **Unique strength:** More granular behavioral signals than Turnstile.

### vs. Fingerprint.com
- **Missing:** Device fingerprint persistence and cross-session identity linking.
- **Missing:** Confidence scores per signal component with explainability API.
- **Missing:** Bot type classification (credential stuffing vs. scraping vs. click fraud).
- **Missing:** Server-side agent for backend fraud detection.

### vs. DataDome
- **Missing:** IP reputation database integration.
- **Missing:** Device reputation scoring.
- **Missing:** Real-time threat intelligence feeds.
- **Missing:** Reverse proxy / module integration (Apache, Nginx, CDN).
- **Missing:** Bot management dashboard with attack pattern visualization.

### vs. Arkose Labs / PerimeterX
- **Missing:** Adaptive challenge rendering.
- **Missing:** ML model versioning with automated retraining pipeline (exists as UI theater in enterprise.tsx but no actual infrastructure).
- **Missing:** Session graph analysis (cross-session attack pattern detection).

### Unique Strengths (vs. competitors)
- Open architecture allows SDK customization
- Transparent scoring factors exposed via API (`factors` object in scorer.ts)
- DNS-based domain ownership verification is production-quality
- Drizzle ORM schema is clean and extensible

---

## TOP 25 HIGHEST PRIORITY TASKS

### P0 — Must fix before any real traffic

1. **Wire `computeScore()` into `ingest.ts`** — import `scorer.ts`, pass `userAgent`, `signals`, `referrer`, `domain`; store the result; never trust client `score` or `verdict`. This single fix makes the platform actually perform bot detection.

2. **Remove `Math.random()` fallback score** — replace with a clear "no SDK signals" path that returns `sdkScore=0.5` and sets `no_sdk_signals` flag (already handled by `scorer.ts` when `signals` is null).

3. **Add `signals` JSONB column to `events` table** — store the raw signal object for retrospective analysis and model training.

4. **Add `flags` and `factors` columns to `events` table** — store `scorer.ts` output for explainability and debugging.

5. **Write and run database migrations** — set up Drizzle Kit migrations, generate initial migration from current schema, apply to production safely.

6. **Add composite index** `CREATE INDEX events_user_time ON events(user_id, created_at DESC)` — without this every analytics query does a full table scan.

### P1 — Required before beta launch

7. **Implement webhook auto-dispatch in `ingest.ts`** — after scoring an event, query enabled webhooks for the token's `userId`, evaluate if `verdict` matches the webhook's `events` filter, and POST asynchronously (use a background job or at minimum `setImmediate`).

8. **Implement alert rule evaluation in `ingest.ts`** — evaluate enabled rules for the user; increment `triggered_count`, update `last_triggered_at`.

9. **Fix webhook HMAC signing** — compute `HMAC-SHA256(JSON.stringify(payload), hook.secret)` and send as `X-PoH-Signature` header; remove plaintext secret from header.

10. **Add rate limiting to `/api/ingest`** — implement per-token rate limiting (e.g., 1000 req/min per token) using `express-rate-limit` with a Redis store or in-memory token bucket.

11. **Add Zod validation to ingest route** — validate body shape before processing; reject unknown fields; enforce numeric bounds on `score`.

12. **Extract country from server-side IP** — integrate `maxmind/geoip-lite` or similar; never trust `req.body.country`.

13. **Fix `triggered_count` column type** — change from `text` to `integer` in schema and migrate.

14. **Fix `requireAuth` userId priority** — use `auth.userId` as canonical source; do not allow `sessionClaims.userId` override.

### P2 — Required before public launch

15. **Add request body size limit** — `app.use(express.json({ limit: '64kb' }))`.

16. **Add Stripe billing integration** — implement checkout, subscription management, usage metering against `users.plan`; replace hardcoded billing page.

17. **Enforce plan limits in ingest** — check user's `plan` and monthly event count; return `429` when limit exceeded.

18. **Add token expiry** — `expires_at` column on `api_tokens`; enforce in `requireBearer`; add rotation endpoint.

19. **Add unique constraint on `(user_id, domain)`** in domains table.

20. **Fix SDK endpoint override** — line 54 of `v2.js` overwrites `cfg.endpoint` with hardcoded origin path; remove that line.

### P3 — Required for commercial SaaS

21. **Add IP reputation lookup** — integrate IPDB, MaxMind, or similar; add `is_datacenter`, `is_vpn`, `is_tor`, `asn` columns to events.

22. **Implement organizations and teams** — `organizations`, `memberships`, `roles` tables; scope all queries by org; RBAC middleware.

23. **Implement audit logs** — log all administrative actions (token created/revoked, webhook created/deleted, domain added/verified, plan changed).

24. **Add data retention enforcement** — scheduled job to delete events older than plan's retention period.

25. **Implement real-time alerting delivery channels** — email (via Resend/SendGrid), Slack webhook format support, PagerDuty integration.

---

## RECOMMENDED ARCHITECTURE

### Immediate (weeks 1–2, fix what's broken)

```
POST /api/ingest
  → requireBearer
  → validate body (Zod)
  → lookup token → get userId
  → extract IP → geolocate server-side
  → call computeScore({ userAgent: req.headers['user-agent'], signals: req.body.signals, ... })
  → insert event with score, verdict, flags, factors, signals (JSONB)
  → async: evaluate alert rules → dispatch webhooks
  → respond: { ok: true, verdict, score }
```

### Near-term (weeks 3–8, production hardening)

- Add Redis for rate limiting and session deduplication
- Add Drizzle migrations workflow
- Add database indexes
- Add Stripe for billing
- Add IP reputation enrichment

### Medium-term (months 2–4, commercial launch)

- Add organizations/teams/RBAC
- Add ML model training pipeline (store signals → export features → train → deploy)
- Add CAPTCHA challenge widget
- Add device fingerprint persistence (cross-session identity)
- Add audit log system

### Long-term (months 5–12, enterprise)

- Multi-region deployment with real data replication
- Real-time streaming analytics (replace polling with WebSocket push)
- Customer-facing threat intelligence dashboard
- Partner API for CDN/WAF integration
- SOC 2 Type II compliance audit

---

## 12-MONTH PRODUCT ROADMAP

### Phase 1 — MVP Stabilization (Month 1)
- Wire scorer.ts into ingest route
- Remove Math.random fallback
- Add signals/flags/factors columns and migrate
- Add DB indexes
- Add rate limiting
- Fix webhook HMAC signing
- Implement webhook auto-dispatch
- Implement alert rule evaluation

### Phase 2 — Production Launch (Months 2–3)
- Stripe billing integration with plan enforcement
- IP geolocation (server-side)
- Token expiry and rotation
- IP reputation lookup (MaxMind or similar)
- Drizzle migrations workflow
- Load testing and performance baseline

### Phase 3 — Commercial SaaS (Months 4–6)
- Organizations and teams
- RBAC (admin, analyst, viewer roles)
- Audit logs
- Data retention enforcement
- Real-time event stream (WebSocket or SSE for live dashboard)
- CAPTCHA challenge widget
- SDK versioning and backwards compatibility guarantee
- Public API documentation

### Phase 4 — Enterprise (Months 7–9)
- SSO (SAML via Clerk Enterprise)
- Custom data retention periods
- Dedicated tenant infrastructure option
- SLA monitoring dashboard (replace mocked enterprise.tsx with real data)
- ML model retraining pipeline (real, not cosmetic)
- False positive review workflow (real, not mocked)
- Custom webhook signature formats
- Multi-region data residency

### Phase 5 — Market Leadership (Months 10–12)
- TLS fingerprinting (JA3/JA4)
- Bot network graph analysis
- Automated threat intelligence sharing
- Reverse proxy integration modules (Nginx, Caddy)
- Mobile SDK (iOS/Android native)
- Partner program API
- Public threat feed and bot taxonomy database

---

## ESTIMATED PATH TO ENTERPRISE READINESS

| Milestone | Effort | Risk |
|-----------|--------|------|
| Fix ingest (wire scorer, remove Math.random) | 1 engineer, 1 day | Low |
| DB migrations + indexes | 1 engineer, 2 days | Medium (requires prod migration planning) |
| Webhook auto-dispatch + alert evaluation | 1 engineer, 3 days | Low |
| Rate limiting + body validation | 1 engineer, 2 days | Low |
| Stripe billing (basic) | 1 engineer, 5 days | Medium |
| IP reputation + geo enrichment | 1 engineer, 3 days | Low |
| Org/Team/RBAC | 2 engineers, 3 weeks | High (schema changes) |
| Audit logs + data retention | 1 engineer, 1 week | Low |
| SSO via Clerk Enterprise | 1 engineer, 3 days | Low |
| Real ML pipeline | 2 engineers + ML, 2 months | Very High |
| **Total to Enterprise-ready MVP** | **~4–5 months, 2–3 engineers** | |

---

*This report was generated from direct source code inspection. All file paths, line numbers, and code quotes are evidence from the current codebase as of 2026-06-05.*
