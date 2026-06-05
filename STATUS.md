# Proof of Human — Implementation Status

_Last updated: June 2026_

---

## ✅ Production Ready

These features have real implementations with live database queries, no mock data, and enforced server-side logic.

### API & Ingest Pipeline
| Feature | Notes |
|---|---|
| `POST /api/ingest` | Real scoring, Bearer-token auth, no client-trusted fields |
| Server-side scoring (`scorer.ts`) | UA pattern matching, behavioral signals, referrer/domain checks |
| `signals`, `flags`, `factors` stored in DB | JSON columns on `events` table |
| Per-token rate limiting | Per API key, plan-aware: Free 120/min · Growth 1,000/min · Enterprise 10,000/min |
| Monthly quota enforcement | Per user (shared across tokens): Free 30K · Growth 1M · Enterprise 20M events/month |
| Quota cached + optimistic increment | 5-min TTL, prevents boundary flooding |

### Alert Rules & Webhooks
| Feature | Notes |
|---|---|
| Automatic alert rule evaluation on ingest | Runs fire-and-forget after every scored event |
| Conditions: `score_below`, `score_above`, `bot_detected`, `captcha_required` | Domain filter supported |
| `triggered_count` + `last_triggered_at` updated on match | Real-time |
| Webhook dispatch on matched rules | Async, 8s timeout, `last_fired_at` + `last_status` tracked |
| HMAC-SHA256 webhook signatures | `X-PoH-Signature: sha256=<hex>` header |

### Auth
| Feature | Notes |
|---|---|
| Clerk auth on all dashboard routes | `requireAuth` middleware |
| Bearer token auth on ingest | `requireBearer` middleware |
| Token CRUD (`/api/tokens`) | Create, list, delete |

### Dashboard & Analytics APIs
| Feature | Notes |
|---|---|
| `GET /dashboard/stats` | Real DB queries: total events, bot/human counts, avg score, today's sessions |
| `GET /dashboard/logs` | Paginated event log, real data |
| `GET /analytics/overview` | Real DB, configurable range (7d/30d/90d) |
| `GET /analytics/hourly` | Real DB |
| `GET /analytics/geo` | Real DB |
| `GET /analytics/breakdown` | Real DB |
| `GET /analytics/recent-sessions` | Real DB |

### Domain & Billing APIs
| Feature | Notes |
|---|---|
| Domain CRUD (`/api/domains`) | Create, list, delete, verify |
| `GET /billing/usage` | Real DB count: plan, events used, quota, % used, reset date |

### Frontend Pages (wired to real APIs)
| Page | Status |
|---|---|
| Dashboard (`/dashboard`) | Real stats |
| Logs (`/logs`) | Real event log |
| Alerts (`/alerts`) | Real CRUD |
| Webhooks (in Settings/Integrations) | Real CRUD |
| Billing (`/billing`) | Real usage meter, correct tier numbers |
| Connect (`/connect`) | Real domain + token management |

---

## 🔧 Partially Implemented / Has Stubs

| Feature | What's missing |
|---|---|
| Alert rule `triggered_count` | Schema column is `text` instead of `integer` — works but needs a schema migration to fix type |
| Webhook `events` field | Stored as comma-separated string, not a proper array — functional but schema could be cleaner |
| Scoring signals | JS SDK sends signals, server uses them — but signal collection on the browser side is minimal (no real mouse/keyboard entropy collection yet) |
| Country detection | `country` column always `null` — no IP geolocation library wired in |

---

## ❌ Not Yet Implemented

### Payments & Subscriptions
| Feature | Notes |
|---|---|
| Stripe integration | No checkout, no subscription creation, no webhooks from Stripe |
| Plan upgrades | Upgrade buttons exist in UI but link nowhere |
| Invoice history | Placeholder UI only — no real invoice data |
| Plan downgrade / cancellation | Not implemented |
| Metered billing overage charges | Not implemented |

### User Account Lifecycle
| Feature | Notes |
|---|---|
| Clerk → DB user sync | When a new user signs up via Clerk, a row must be created in `users` table. Currently manual/missing — new users may 404 on auth-gated routes |
| User plan changes reflected live | Cache TTL means plan changes take up to 5 min to propagate; no cache eviction on plan update |

### Security & Infrastructure
| Feature | Notes |
|---|---|
| IP geolocation | No library integrated; `country` is always null |
| Browser fingerprinting (JS SDK) | No canvas/WebGL/font fingerprinting collected from browser |
| CAPTCHA challenge serving | Verdict `CAPTCHA` returned but no actual challenge is issued to the browser |
| Data retention pruning | Old events are not automatically deleted; no cron job |
| CDN/edge scoring | All scoring is centralized; no edge deployment |

### Enterprise Features
| Feature | Notes |
|---|---|
| RBAC / team members | No multi-user workspace; every token is tied to a single Clerk user |
| SSO | Listed as Enterprise feature, not implemented |
| Dedicated infrastructure | Not applicable until enterprise customers exist |
| Custom data retention | Not implemented |

### Other Pages (mock data)
| Page | Status |
|---|---|
| Reports (`/reports`) | Mock/hardcoded data |
| Risk (`/risk`) | Mock/hardcoded data |
| Ops (`/ops`) | Mock/hardcoded data |
| Playbooks (`/playbooks`) | Static content |
| Enterprise (`/enterprise`) | Marketing page, static |

---

## 📋 Suggested Next Priorities

1. **Stripe integration** — checkout + subscription webhooks to update `users.plan` in DB
2. **Clerk webhook → user sync** — create `users` row on `user.created` Clerk event
3. **IP geolocation** — add `geoip-lite` or similar; fill `country` column on ingest
4. **JS SDK signal collection** — mouse entropy, keyboard timing, scroll behavior
5. **Data retention cron** — delete events older than plan's retention window
6. **Fix `triggered_count` column type** — migrate from `text` to `integer`
