# Slice Spec — 01 — Billing & Subscriptions with Dodo Payments (EPAY factory)

Opened by: **saas-orchestrator + payments-engineer** · From backlog item #01 · Status: `open`

## Goal / In scope / Out of scope

### Goal
Enable paid subscriptions for HeadCV via **Dodo Payments** for global/non-Egypt customers, with a **free tier** that is intentionally limited. Implement a **payment-provider factory** so an Egypt-only **EPAY** provider can be added later without rewriting business logic.

### In scope
- Dodo Payments SDK (`dodopayments`) integration.
- Provider factory: `PaymentProvider` interface + `DodoPaymentsProvider` concrete + `EpayPaymentsProvider` stub.
- Schema + migration for user subscriptions, usage counters, and webhook log.
- oRPC billing router: `createCheckoutSession`, `getCurrentSubscription`, `getCustomerPortal`.
- Hono webhook route `/api/webhooks/dodo` verifying Standard Webhooks signatures via the SDK and idempotently updating subscription state.
- Entitlement service that gates:
  - resume upload / AI PDF parsing: **2 free uses**, unlimited on paid;
  - agent AI chat: **1 free conversation**, unlimited on paid;
  - resume creation from scratch: always unlimited;
  - resume editing: always unlimited.
- Updated public pricing page (`/`) with weekly / monthly / yearly plans and checkout CTAs.
- New dashboard billing page (`/dashboard/settings/billing`) showing current plan, renewal/cancel state, and link to customer portal.
- Paywall UX on import and AI chat when limits are exhausted.
- Environment variables, `turbo.json` entries, and migration generation.
- Unit + integration tests for entitlements, webhook handling, and provider factory.

### Out of scope
- Full EPAY implementation (only the factory stub and interface hooks).
- Refund / dispute UI or automated dunning emails.
- Usage-based / metered billing beyond the two gated counters.
- Multi-currency price logic (Dodo's default currency behavior is accepted for v1).
- Changing the upstream auth or resume data models beyond the new tables.

---

## Required experts this slice

- ux-flow-mapper — pricing → checkout → webhook → entitlement → dashboard flow.
- data-modeler — subscription, usage, and webhook log schema.
- backend-engineer — oRPC router, provider factory, entitlement service, webhook wiring.
- security-engineer — webhook verification, idempotency, authz, secrets.
- payments-engineer — Dodo checkout, subscription lifecycle, idempotent fulfillment.
- frontend-engineer — pricing page, billing settings, paywall dialogs.
- qa-tester — test plan and green gate.
- devops-releaser — env vars, migration, Ship.

(N/A: brand-designer — reuse existing frozen tokens; seo-engineer — no new public indexable routes beyond pricing, which already exists.)

---

## Pack refs

- `implementation-plan.md` §3.6 deferred payments to "later"; this slice realizes that.
- `apps/web/src/routes/_home/-sections/pricing.tsx` — existing static pricing surface.
- `apps/web/src/routes/dashboard/settings/route.tsx` — existing settings tab surface.
- `packages/api/src/features/resume/crud.ts` — import/create endpoints to gate.
- `packages/api/src/features/agent/messages.ts` — AI chat send endpoint to gate.
- `packages/db/src/schema/auth.ts` — user table to reference.

---

## Pre-Slice Setup (ritual — blocks every section below)

Each required expert, **before writing their Spec section**: ultra-think this slice from their track's angle, refresh current best practices for exactly the surfaces this slice touches, and note risks. No box checked → that expert's section may not be written.

- [ ] ux-flow-mapper — ultra-think + best-practice refresh done
- [ ] data-modeler — ultra-think + best-practice refresh done
- [ ] backend-engineer — ultra-think + best-practice refresh done
- [ ] security-engineer — ultra-think + best-practice refresh done
- [ ] payments-engineer — ultra-think + best-practice refresh done
- [ ] frontend-engineer — ultra-think + best-practice refresh done
- [ ] qa-tester — ultra-think + best-practice refresh done
- [ ] devops-releaser — ultra-think + best-practice refresh done

Risks noted during the ritual:

- **Money surface trust:** pricing must show exact billing cadence and total before checkout; no surprise charges after trial.
- **Webhook delivery gaps:** a missed `subscription.active` would leave a paying user on the free plan. Idempotency + retry handling + DB transaction claim are critical.
- **Country detection ambiguity:** deciding Dodo vs EPAY provider by billing country is not implemented yet; v1 defaults to Dodo globally and stubs EPAY for Egypt.
- **Free counter reset semantics:** weekly/monthly/yearly plans likely reset counters each billing cycle. Need clear semantics and migration-safe defaults.
- **Existing unlimited behavior:** until this slice ships, upload/chat are unlimited. The first deploy must not retroactively cap historical usage (counters start at 0 on account creation).

---

## UX flows — owner: ux-flow-mapper

### Flow matrix

| # | Page / action | API | DB | UI state / feedback |
|---|---|---|---|---|
| 1 | Visitor opens `/` pricing | `GET /api/rpc/flags.get` (existing) | — | Sees Free + Weekly + Monthly + Yearly cards with exact prices. |
| 2 | Visitor clicks paid plan | `POST /api/rpc/billing.createCheckoutSession` | reads `user_subscription` | Authenticated users get `checkout_url`; unauthenticated are prompted to sign in first. |
| 3 | User pays on Dodo hosted checkout | Dodo redirects to `/checkout/success?session_id=…` | — | Success page says "Activating…" and polls `getCurrentSubscription` briefly. |
| 4 | Dodo sends `subscription.active` | `POST /api/webhooks/dodo` | insert/update `user_subscription`, clear/reset `user_usage` | Webhook ack 200 immediately. |
| 5 | User opens dashboard | `GET /api/rpc/billing.getCurrentSubscription` | reads `user_subscription` | Badge / banner reflects active plan. |
| 6 | Free user imports resume twice | `POST /api/rpc/resume.import` → entitlement check | `user_usage.resumeUploadsUsed++` | First two succeed; third shows paywall: "Upgrade to import more resumes." |
| 7 | Free user starts second AI chat thread | `POST /api/rpc/agent/messages/send` → entitlement check | `user_usage.aiChatsUsed++` | Blocked with paywall: "Upgrade for unlimited AI chats." |
| 8 | User opens `/dashboard/settings/billing` | `GET /api/rpc/billing.getCurrentSubscription` + portal | reads `user_subscription` | Shows plan, next billing date, cancel/portal button. |
| 9 | User clicks customer portal | `GET /api/rpc/billing.getCustomerPortal` | — | Redirects to Dodo-hosted portal for payment method / cancellation. |

### Money-surface doctrine check
- [x] Fields ≤ 8 on checkout (plan selection is one click; billing details handled by Dodo).
- [x] No surprise costs: pricing page shows weekly/monthly/yearly totals before any redirect.
- [x] Trust before the ask: Dodo is the Merchant of Record; badge + secure-payment copy on pricing card.
- [x] Prompt at peak motivation: paywall appears only when user hits a real limit (after 2 imports or 1 chat).

### Motion / route notes
- Pricing page switches between monthly/yearly with existing toggle; add weekly tab/pill.
- Paywall uses an inline card + primary "Upgrade" CTA, not a jarring full-screen block.
- Billing settings uses existing dashboard tab pattern (`/dashboard/settings/billing`).

Spec done: [ ]   Build review done: [ ]

---

## Brand / style — owner: brand-designer (N/A for this slice)

Reuse existing frozen tokens from `packages/ui/src/styles/globals.css` and existing marketing/pricing card composition in `apps/web/src/routes/_home/-sections/pricing.tsx`.

- Money-surface psychology: dominant "Upgrade" CTA on paywall, anchored pricing with yearly "Save X%" badge, trust badge under CTA.
- No fake urgency or countdowns.

Spec done: [x]   Visual QA done: [ ]

---

## Data (PostgreSQL / Drizzle) — owner: data-modeler

### New tables

#### `user_subscription`
Tracks the user's current subscription, regardless of provider.

| Column | Type | Notes |
|---|---|---|
| `id` | text PK | internal |
| `userId` | text FK → user.id | cascade delete, unique (one active-ish per user) |
| `provider` | text | `'dodo' \| 'epay'` |
| `providerCustomerId` | text | nullable (created lazily at checkout) |
| `providerSubscriptionId` | text | nullable |
| `plan` | text | `'free' \| 'weekly' \| 'monthly' \| 'yearly'` |
| `status` | text | `'active' \| 'cancelled' \| 'on_hold' \| 'expired' \| 'pending' \| 'failed'` |
| `currentPeriodStart` | timestamp tz | from Dodo payload |
| `currentPeriodEnd` | timestamp tz | next billing date |
| `cancelAtPeriodEnd` | boolean | default false |
| `metadata` | jsonb | raw Dodo payload snapshot for debugging |
| `createdAt` / `updatedAt` | timestamp tz | default now, update hook |

#### `user_usage`
Per-user metered counters. Reset on `subscription.active` / `subscription.renewed`.

| Column | Type | Notes |
|---|---|---|
| `id` | text PK | internal |
| `userId` | text FK → user.id | cascade delete, unique |
| `resumeUploadsUsed` | integer | default 0 |
| `aiChatsUsed` | integer | default 0 |
| `resetAt` | timestamp tz | last counter reset date |
| `createdAt` / `updatedAt` | timestamp tz | — |

#### `webhook_event_log`
Idempotency log for Dodo webhooks.

| Column | Type | Notes |
|---|---|---|
| `id` | text PK | internal |
| `provider` | text | `'dodo' \| 'epay'` |
| `webhookId` | text | unique constraint for dedupe |
| `eventType` | text | e.g. `subscription.active` |
| `eventData` | jsonb | raw event payload |
| `processedAt` | timestamp tz | default now |

### Schema placement
- `packages/db/src/schema/billing.ts` exports `userSubscription`, `userUsage`, `webhookEventLog`.
- Re-export from `packages/db/src/schema/index.ts`.
- Migration generated with `dotenvx run -f .env.local -- pnpm db:generate`.

### Ownership
- Each user owns exactly one `user_subscription` and one `user_usage` row.
- Cascading delete on `user.id` keeps subscription and usage data consistent with account deletion.

Spec done: [ ]   Migrate done: [ ]

---

## Backend (oRPC / Hono) — owner: backend-engineer

### New package surface
- `packages/api/src/features/billing/`:
  - `provider.ts` — `PaymentProvider` interface + factory.
  - `dodo-provider.ts` — Dodo SDK implementation.
  - `epay-provider.ts` — stub implementing the interface, throws "not configured" for Egypt.
  - `service.ts` — `billingService` (checkout, sync, portal) and `entitlementService` (check/reserve/reset).
  - `router.ts` — oRPC procedures.
  - `webhook.ts` — exported Hono-compatible handler invoked by `apps/server`.

### `PaymentProvider` interface (factory contract)
```typescript
type PlanSlug = "weekly" | "monthly" | "yearly";

interface PaymentProvider {
  readonly name: "dodo" | "epay";
  createCheckoutSession(input: {
    userId: string;
    email: string;
    plan: PlanSlug;
    returnUrl: string;
  }): Promise<{ checkoutUrl: string; providerCheckoutId: string }>;

  getCustomerPortalUrl(input: {
    providerCustomerId: string;
    returnUrl: string;
  }): Promise<{ portalUrl: string }>;

  /** Returns a verified, typed event and a stable webhook id. */
  verifyWebhook(rawBody: string, headers: Record<string, string>): Promise<{
    webhookId: string;
    eventType: string;
    data: unknown;
  }>;
}
```

Factory: `getPaymentProvider(userCountry?: string): PaymentProvider` — returns Dodo by default; EPAY stub if country === `'EG'` (until EPAY is wired).

### oRPC procedures (`billingRouter`)
| Procedure | Method | Path | Auth | Notes |
|---|---|---|---|---|
| `createCheckoutSession` | POST | `/billing/checkout` | protected | Returns `checkoutUrl` and `sessionId`. |
| `getCurrentSubscription` | GET | `/billing/subscription` | protected | Returns plan, status, period dates, usage counters. |
| `getCustomerPortal` | GET | `/billing/portal` | protected | Returns Dodo customer portal URL. |
| `getPricingPlans` | GET | `/billing/plans` | public | Static plan config (price, cadence, feature list) for pricing page. |

### Webhook handler
- Mount in `apps/server/src/http/app.ts`: `app.post("/api/webhooks/dodo", handleDodoWebhook)`.
- Implementation in `packages/api/src/features/billing/webhook.ts`.
- Reads raw body via `c.req.text()` (Hono adapter or manual).
- Calls `dodoProvider.verifyWebhook(...)`.
- Verifies `webhookId` against `webhook_event_log` unique constraint in same DB transaction as state update.
- Handled events:
  - `subscription.active` → set `plan`, `status='active'`, period dates, reset counters.
  - `subscription.renewed` → update period dates, reset counters.
  - `subscription.cancelled` → set `cancelAtPeriodEnd` or `status='cancelled'` per payload.
  - `subscription.on_hold` → `status='on_hold'`; UI shows recovery prompt.
  - `subscription.expired` / `subscription.failed` → downgrade to `plan='free'`, `status` sync.
- Returns `200` with `{ received: true }` immediately after DB transaction commits.

### Entitlement integration points
- `resume.import` handler (`packages/api/src/features/resume/crud.ts`) calls `entitlementService.reserveResumeUpload(userId)` before `resumeService.create`.
- `agent.messages.send` handler (`packages/api/src/features/agent/messages.ts`) calls `entitlementService.reserveAiChat(userId)` before streaming.
- On `subscription.active` / `subscription.renewed`, `entitlementService.resetUsage(userId)`.

### Error contracts
- `UPGRADE_REQUIRED` (402-style ORPC error) when free limit hit.
- `PAYMENT_PROVIDER_ERROR` when Dodo API call fails.

Spec done: [ ]   Implement/stub done: [ ]

---

## Security — owner: security-engineer

### Ladder checklist for this slice

| Rung | Decision |
|---|---|
| HTTPS / CORS | Webhook endpoint must be HTTPS in prod; dev uses `ngrok`/localhost with test secret. |
| Auth | All billing RPC procedures use `protectedProcedure`. |
| Roles / ownership | Users read/write only their own `user_subscription` and `user_usage` rows (`userId` filter). |
| Webhook auth | Signature verified with Dodo SDK `verifyWebhook` / `webhooks.unwrap` using `DODO_PAYMENTS_WEBHOOK_KEY` on the **raw body**. Never grant access from `return_url` query params. |
| Idempotency | `webhookId` unique constraint; claim + state update in one DB transaction. |
| Secrets | `DODO_PAYMENTS_API_KEY` and `DODO_PAYMENTS_WEBHOOK_KEY` server-only in `packages/env`. Never sent to browser. |
| Rate limit | Reuse existing `@orpc/experimental-ratelimit` middleware on checkout creation and portal generation. |
| Audit | Webhook `eventData` and `processedAt` stored in `webhook_event_log`. |

### Additional notes
- `unsafeUnwrap()` is **forbidden** in production; use only for CLI-triggered unsigned test payloads (`dodo wh trigger`) during local dev.
- EPAY stub must not expose any real payment capability until it is implemented and reviewed.

Spec done: [ ]   Guards/ownership/limits/audit done: [ ]

---

## Payments — owner: payments-engineer

### Money movement summary
- **Recurring subscriptions only** (weekly, monthly, yearly). No one-time products.
- Provider: **Dodo Payments** for global users; **EPAY stub** for Egypt.

### Dodo checkout flow
1. Browser calls `billing.createCheckoutSession` with selected plan slug.
2. Server maps plan → Dodo `product_id` (`DODO_PRODUCT_WEEKLY_ID`, etc.).
3. Server calls `client.checkoutSessions.create({ product_cart: [{ product_id, quantity: 1 }], customer: { email }, return_url })`.
4. Server returns `checkoutUrl`; browser redirects.
5. Dodo sends `subscription.active` webhook after successful mandate/payment.
6. Server fulfills: update `user_subscription`, reset `user_usage`.

### Webhook events handled
| Event | Fulfillment action |
|---|---|
| `subscription.active` | Grant paid plan, set period dates, reset counters. |
| `subscription.renewed` | Extend period dates, reset counters. |
| `subscription.cancelled` | Set `cancelAtPeriodEnd=true` if `cancel_at_next_billing_date`; otherwise downgrade to free immediately. |
| `subscription.on_hold` | Mark `status='on_hold'`, keep paid plan until recovery or expiry. |
| `subscription.expired` | Downgrade to `plan='free'`. |
| `subscription.failed` | Downgrade to `plan='free'` (initial mandate failed). |
| `subscription.plan_changed` | Re-sync plan slug and period dates. |

### Idempotency
- Stable key = `webhookId` header (`webhook-id`).
- Insert into `webhook_event_log` and apply subscription changes in one Drizzle transaction.
- Duplicate webhook delivery returns 200 and does not re-apply fulfillment.

### Customer portal
- Use `client.customers.customerPortal.create(providerCustomerId, { return_url })`.
- Endpoint returns portal URL; browser redirects.

### Test / live separation
- Dev: `DODO_PAYMENTS_ENVIRONMENT=test_mode`, test product IDs, `dodo wh listen` or dashboard test events.
- Ship: live keys, live product IDs, live webhook endpoint registered in Dodo dashboard, webhook secret rotated.

Spec done: [ ]   Implement done: [ ]

---

## Frontend — owner: frontend-engineer

### Pages / routes
1. **Pricing page** (`apps/web/src/routes/_home/-sections/pricing.tsx`)
   - Add weekly cadence.
   - Enable paid-plan CTAs.
   - Show prices from static config (or `billing.getPricingPlans` if dynamic).
2. **Checkout success page** (`apps/web/src/routes/checkout/success.tsx`)
   - New route. Reads `session_id` query, polls `billing.getCurrentSubscription`, shows confirmation.
3. **Billing settings page** (`apps/web/src/routes/dashboard/settings/billing.tsx`)
   - New route + tab in `apps/web/src/routes/dashboard/settings/route.tsx`.
   - Displays current plan, usage counters, next billing date, cancel/portal buttons.
4. **Paywall components** (new in `apps/web/src/features/billing/`)
   - `ResumeUploadPaywall` — shown after 2 imports.
   - `AiChatPaywall` — shown after 1 chat.

### Component tree
- `BillingCard`, `PlanCard`, `UsageMeter`, `PaywallCard`.
- Reuse `@headcv/ui` Button, Card, Progress, Badge.

### Shared UI reuse
- Existing `Sidebar` in dashboard gets a "Billing & Plan" item.
- Existing settings tab layout reused for billing page.

### API calls
- Use `@tanstack/react-query` + `orpc.billing.*` mutation/query options (pattern already used in `apps/web/src/dialogs/resume/import.tsx`).
- No frontend data mocks; wire real endpoints.

### Motion
- Existing toggle motion for pricing cadence.
- Skeleton loaders for subscription data.

Spec done: [ ]   UI build done: [ ]

---

## SEO — owner: seo-engineer (light)

- `/checkout/success` should have `noindex` meta; no value as landing page.
- `/` pricing page already exists; update JSON-LD / OG pricing copy if present (no new public routes).
- `/dashboard/settings/billing` is behind auth — no SEO work.

Spec done: [x]   Implement done: [ ]

---

## QA — owner: qa-tester

### Test plan
1. **Unit tests**
   - `entitlementService`: free limits, paid bypass, reset on renewal, first-use creation.
   - `getPaymentProvider`: default Dodo, Egypt stub.
   - `dodoProvider.verifyWebhook`: success and failure cases.
2. **Integration tests**
   - `billing.createCheckoutSession` returns a checkout URL shape (mock Dodo client).
   - Webhook handler updates `user_subscription` and resets `user_usage` on `subscription.active`.
   - Duplicate webhook does not double-fulfill.
   - `resume.import` blocks at the 3rd attempt for a free user.
   - `agent.messages.send` blocks when free chat quota is exhausted.
3. **E2E**
   - Pricing page → click plan → mock checkout → success page → billing settings shows active plan.
4. **Static gates**
   - `pnpm typecheck`
   - `pnpm exec turbo boundaries`
   - `pnpm test` (Vitest)
   - `pnpm check` (Biome)

### DoD
- [ ] All new unit tests pass.
- [ ] Integration tests pass with mocked Dodo SDK.
- [ ] No secrets or product IDs committed.
- [ ] Boundary check passes (no cross-package imports).
- [ ] Typecheck green.

Spec done: [ ]   All tests green: [ ]

---

## DevOps — owner: devops-releaser

### Env vars to add

| Var | Where | Notes |
|---|---|---|
| `DODO_PAYMENTS_API_KEY` | `packages/env/src/server.ts`, `.env.example` | Server only. |
| `DODO_PAYMENTS_WEBHOOK_KEY` | `packages/env/src/server.ts`, `.env.example` | Server only. |
| `DODO_PAYMENTS_ENVIRONMENT` | `packages/env/src/server.ts`, `.env.example` | Defaults to `test_mode` in code. |
| `DODO_PRODUCT_WEEKLY_ID` | `packages/env/src/server.ts`, `.env.example` | e.g. `pdt_...` |
| `DODO_PRODUCT_MONTHLY_ID` | `packages/env/src/server.ts`, `.env.example` | e.g. `pdt_...` |
| `DODO_PRODUCT_YEARLY_ID` | `packages/env/src/server.ts`, `.env.example` | e.g. `pdt_...` |
| `EPAY_API_KEY` | `packages/env/src/server.ts`, `.env.example` | Optional future placeholder. |
| `EPAY_WEBHOOK_KEY` | `packages/env/src/server.ts`, `.env.example` | Optional future placeholder. |

- Add all vars to `turbo.json` `globalEnv`.

### Migration
- Generate with `dotenvx run -f .env.local -- pnpm db:generate`.
- Run with `dotenvx run -f .env.local -- pnpm db:migrate`.
- Production: migrations run at startup automatically.

### Ship checklist
- [ ] All env vars documented in `.env.example`.
- [ ] Migration generated and committed.
- [ ] Dodo webhook endpoint registered in live dashboard pointing to `/api/webhooks/dodo`.
- [ ] Test-mode E2E with Dodo test cards passes.
- [ ] Commit(s) pushed to GitHub.

Spec done: [ ]   Shipped (deployed + smoke green + pushed): [ ]

---

## Founder review (evaluator-optimizer loop — light, one round expected)

**This is what freezes the Spec — not expert sections being filled.** Present a SUMMARY, never the raw document: Goal + in/out scope, the one key decision from each filled section, and any risks noted during the Pre-Slice ritual.

| Date | Round | Founder feedback | Change made |
|------|-------|-------------------|-------------|
| | 1 | | |

- [ ] Founder approved this Spec on: `YYYY-MM-DD`

## Align plan

- `packages/api/src/features/billing/` — new feature module in the API package.
- `packages/db/src/schema/billing.ts` — new schema file, re-exported from `index.ts`.
- `apps/server/src/http/app.ts` — mount `POST /api/webhooks/dodo`.
- `apps/web/src/routes/_home/-sections/pricing.tsx` — replace static cards with live CTAs.
- `apps/web/src/routes/checkout/success.tsx` — new route.
- `apps/web/src/routes/dashboard/settings/billing.tsx` — new settings tab page.
- `apps/web/src/routes/dashboard/-components/sidebar.tsx` — add Billing & Plan item.
- Reuse existing shared UI from `@headcv/ui` and `@headcv/utils`.
- No new infrastructure; Dodo is an external SaaS provider.

## Status

- [ ] Pre-Slice Setup done for every required expert
- [ ] All required sections filled
- [ ] **Spec frozen (founder reviewed the summary and approved — not just sections filled)**
- [ ] Align done
- [ ] Every required expert finished Build work
- [ ] Tests green (qa-tester)
- [ ] Shipped (deployed + smoke green + **pushed to GitHub**) and backlog updated
