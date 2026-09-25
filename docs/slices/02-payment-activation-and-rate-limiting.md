# Slice 02 — Payment Activation, Status Handling & Paid-Tier Rate Limiting

> Status: **Implementation Plan**
> Priority: **Critical** — payments succeed on Dodo but subscriptions stay on "Free / Pending"

---

## Problem Statement

After a user completes checkout on Dodo Payments, their subscription stays stuck on "Free / Pending" in the billing settings. The root cause is **multi-layered**:

1. **No webhook delivery** — `DODO_PAYMENTS_WEBHOOK_KEY` is not configured, so webhook signature verification would fail even if Dodo tried to deliver.
2. **No webhook endpoint registered** — Dodo doesn't know the URL to POST events to.
3. **Fragile user lookup in webhook handler** — falls back to querying ALL pending rows (any user), which is incorrect for multi-user systems.
4. **No polling fallback** — if webhooks fail or are delayed, the user has no way to see their subscription activate.
5. **No paid-tier rate limiting** — unlimited AI and uploads for paid users with zero abuse protection.

---

## Architecture: Dual Activation Path

### Path A — Webhook (Primary, Authoritative)

```
Dodo → POST /api/webhooks/dodo
  → verify signature (DODO_PAYMENTS_WEBHOOK_KEY)
  → claim webhook-id (idempotency)
  → match user by metadata.userId from checkout session
  → upsert subscription to active + reset usage
```

### Path B — Server-Side Verification (Fallback)

```
User clicks "Get Pro" → checkout → pays → redirected to /checkout/success
  → success page calls billing.verifyAndActivate({ sessionId })
  → server calls Dodo API to verify the session status
  → if paid, upserts subscription to active + reset usage
  → if not paid, returns current status (pending/failed)
```

This dual path ensures:
- Webhooks are the authoritative source (handles renewals, cancellations, failures)
- Users see instant activation even if webhook is delayed
- No trust of browser-side state — server always verifies with Dodo API

---

## Payment Status Matrix

| Dodo Event | Local Status | Plan | Access Level | Action |
|---|---|---|---|---|
| *(checkout created)* | `pending` | `free` | Free limits | Store pending row with `metadata.userId` + `metadata.pendingPlan` |
| `subscription.active` | `active` | trial/monthly/yearly | Unlimited | Upsert to active, reset usage counters |
| `subscription.renewed` | `active` | *(keep current)* | Unlimited | Update period dates, reset usage counters |
| `subscription.cancelled` | `cancelled` | *(keep current)* | Unlimited until period end | Mark `cancelAtPeriodEnd = true`, keep access until `currentPeriodEnd` |
| `subscription.expired` | `expired` | `free` | Free limits | Downgrade to free, no usage reset |
| `subscription.on_hold` | `on_hold` | *(keep current)* | Free limits | Payment issue, restrict to free limits until resolved |
| `subscription.failed` | `failed` | `free` | Free limits | Payment failed permanently, downgrade to free |
| `subscription.plan_changed` | `active` | *(new plan)* | Unlimited | Re-activate with new plan slug |
| *(server-side verify: paid)* | `active` | trial/monthly/yearly | Unlimited | Same as subscription.active |
| *(server-side verify: not paid)* | `pending` | `free` | Free limits | No change, show "still processing" to user |

---

## Implementation Tasks

### 1. Fix Checkout → Store userId in Dodo Metadata

**Problem:** The webhook handler can't find which user paid because the userId is stored only in our local DB metadata, not in the Dodo checkout session itself.

**Fix:** Pass `userId` in the Dodo checkout `metadata` field (already done) AND store the Dodo `session_id` in the local subscription row so we can cross-reference.

**File:** `packages/api/src/features/billing/dodo-provider.ts`

### 2. Add Server-Side Session Verification Endpoint

**New endpoint:** `billing.verifyAndActivate`

```typescript
// POST /billing/verify
// Input: { sessionId: string }
// Called by checkout success page after redirect
//
// 1. Look up the user's pending subscription with this sessionId
// 2. Call Dodo API: client.checkoutSessions.retrieve(sessionId)
// 3. If status is complete/paid:
//    a. Read subscription_id from the Dodo response
//    b. Upsert subscription to active with correct plan
//    c. Reset usage counters
//    d. Return { activated: true, plan }
// 4. If not yet paid:
//    a. Return { activated: false, status: "pending" }
```

**File:** `packages/api/src/features/billing/router.ts`

### 3. Fix Webhook User Lookup

**Problem:** Current code has a dangerous fallback:
```typescript
// BAD: finds ANY pending user, not the right one
const [pending] = await db.select().from(userSubscription)
  .where(eq(userSubscription.status, "pending")).limit(1);
```

**Fix:** Use proper lookup chain:
1. Find by `providerCustomerId` (Dodo customer_id)
2. Find by `providerSubscriptionId` (Dodo subscription_id)
3. Find by `metadata.userId` where `metadata.sessionId` matches — search subscription rows where metadata contains the correct userId from the Dodo webhook's metadata field
4. **Never** blindly pick the first pending row

**File:** `packages/api/src/features/billing/webhook.ts`

### 4. Update Checkout Success Page

**Current:** Static "being activated" message with links.

**New:** Active polling that calls `billing.verifyAndActivate`:
1. On mount, call verify endpoint with sessionId from URL params
2. Show spinner while verifying
3. On success: show "You're on Pro!" with confetti/checkmark
4. On pending: show "Still processing..." with auto-retry every 3 seconds (max 10 retries)
5. On failure: show error with "Contact support" link
6. After activation, invalidate the billing query cache so the settings page shows the correct plan

**File:** `apps/web/src/routes/checkout/success.tsx`

### 5. Update Billing Settings Page

**Current:** Always shows "Free / Pending" because webhook never fires.

**Fix:** The getSubscription endpoint already returns the correct data — once activation works (via webhook or verify endpoint), this page will correctly show "Pro / Active".

Additionally: add a "Refresh" button that calls `billing.verifyAndActivate` for users whose status is still "pending".

**File:** `apps/web/src/routes/dashboard/settings/billing.tsx`

### 6. Configure Webhook Key & Endpoint

**Dodo Dashboard:**
1. Go to Settings → Webhooks
2. Add endpoint: `https://{production-domain}/api/webhooks/dodo`
3. Select events: `subscription.*`
4. Copy the webhook signing key

**Local dev:** Use `dodo wh listen http://localhost:3001/api/webhooks/dodo`

**File:** `.env.local` — add `DODO_PAYMENTS_WEBHOOK_KEY`

### 7. Add Paid-Tier Rate Limiting

**Current state:** AI requests have a flat 20 req/60s limit. Paid users have "unlimited" entitlement but no abuse protection.

**Expert-level approach:**

| Resource | Free Tier | Paid Tier (Trial/Monthly/Yearly) |
|---|---|---|
| AI parse (PDF/DOCX) | 2 lifetime, 5 req/min rate limit | Unlimited entitlement, 10 req/min rate limit |
| AI chat messages | 1 lifetime, 5 req/min rate limit | Unlimited entitlement, 30 req/min rate limit |
| Resume uploads (storage) | 20 req/min | 40 req/min |
| Resume mutations | 60 req/min | 120 req/min |

**Implementation:**
- Create a `planAwareRateLimit` middleware that reads the user's plan and applies different rate limit windows
- Keep the existing `aiRequestRateLimit` for general protection
- Add a new `paidTierRateLimit` that adjusts `maxRequests` based on plan
- This prevents abuse even for paid users (e.g., automated scraping with a $3/week account)

**Files:**
- `packages/utils/src/rate-limit.ts` — add paid tier config
- `packages/api/src/middleware/rate-limit/index.ts` — add plan-aware limiter
- `packages/api/src/features/ai/router.ts` — use plan-aware limiter
- `packages/api/src/features/agent/messages.ts` — use plan-aware limiter

### 8. Entitlement Edge Cases

**`on_hold` status:** User's payment method failed but subscription isn't cancelled yet. Dodo will retry.
- Restrict to free-tier limits during on_hold
- Show banner: "Your payment is being retried"

**`cancelled` with `cancelAtPeriodEnd`:** User cancelled but paid for the rest of the period.
- Keep unlimited access until `currentPeriodEnd`
- Show banner: "Your Pro plan ends on {date}"
- After period expires, Dodo sends `subscription.expired`

**Expired period check:** Even without a webhook, if `currentPeriodEnd` < now and status is still "active":
- Treat as free-tier (defensive check)
- This handles missed webhooks

**File:** `packages/api/src/features/billing/service.ts`

---

## Entitlement Decision Logic (Revised)

```
function getEffectiveAccess(subscription):
  if subscription.status === "active":
    if subscription.currentPeriodEnd && subscription.currentPeriodEnd < now:
      return "free"  // defensive: period expired, webhook may have been missed
    return "paid"

  if subscription.status === "cancelled" && subscription.cancelAtPeriodEnd:
    if subscription.currentPeriodEnd && subscription.currentPeriodEnd > now:
      return "paid"  // still within paid period
    return "free"

  if subscription.status in ["on_hold", "failed", "expired", "pending"]:
    return "free"

  return "free"  // default
```

---

## File Change Summary

| File | Change |
|---|---|
| `packages/api/src/features/billing/router.ts` | Add `verifyAndActivate` endpoint |
| `packages/api/src/features/billing/webhook.ts` | Fix user lookup, remove dangerous pending fallback |
| `packages/api/src/features/billing/service.ts` | Add `getEffectiveAccess()`, period-expiry check, `findUserByMetadataUserId()` |
| `packages/api/src/features/billing/dodo-provider.ts` | Add `getCheckoutSession()` method |
| `packages/api/src/middleware/rate-limit/index.ts` | Add plan-aware rate limiter |
| `packages/utils/src/rate-limit.ts` | Add paid-tier rate limit config |
| `packages/api/src/features/ai/router.ts` | Use plan-aware rate limiter |
| `packages/api/src/features/agent/messages.ts` | Use plan-aware rate limiter |
| `apps/web/src/routes/checkout/success.tsx` | Add polling verification |
| `apps/web/src/routes/dashboard/settings/billing.tsx` | Add refresh, status banners |
| `.env.local` | Add `DODO_PAYMENTS_WEBHOOK_KEY` when configured |

---

## Verification

```bash
pnpm --filter @headcv/api typecheck
pnpm --filter @headcv/api test
pnpm --filter server typecheck
pnpm --filter server test
pnpm --filter web typecheck
cd apps/web && npx vitest run src/routes/_home/-sections/pricing.test.tsx
pnpm exec turbo boundaries
```

## Testing Checklist

- [ ] Free user sees 0/2 uploads, 0/1 chats
- [ ] User clicks "Get Pro Monthly" → redirected to Dodo checkout
- [ ] After payment, redirected to /checkout/success → sees "Activated!"
- [ ] Billing settings shows "Pro Monthly / Active" with unlimited usage
- [ ] AI parse PDF works without "upgrade required" error
- [ ] AI chat works without "upgrade required" error
- [ ] Rate limiting still applies to paid users (prevents abuse)
- [ ] Cancellation: user keeps access until period end
- [ ] Expiry: user reverts to free plan with limits
- [ ] Duplicate webhook events are handled idempotently
- [ ] Second checkout overwrites first (upsert by userId)
