# Slice 03 — Auth-Gated Checkout Flow

> **Goal**: When an unauthenticated user on the landing page clicks any subscription button (Trial $3/7d, Pro Monthly $20/mo, Pro Yearly $60/yr), they are guided through sign-up or login and then seamlessly redirected to their chosen Dodo/EPAY checkout — with zero loss of intent.

---

## 1. Problem Statement

### Current behavior
1. User visits the **Pricing** section on the landing page (`/`).
2. User clicks **"Get Pro"** or **"Start 7-day trial"**.
3. `handleCheckout()` calls `client.billing.createCheckoutSession({ plan })` — a **protected** oRPC procedure.
4. Because the user is **not authenticated**, the RPC call returns a **401** error.
5. The `catch` block silently swallows the error (`setCheckoutLoading(false)`).
6. **Nothing happens.** The user sees the button reset and has no idea why.

### Desired behavior
1. User clicks a plan button while unauthenticated.
2. They are taken to **sign up** (or login) with their **selected plan preserved**.
3. After successful authentication, they are **automatically redirected** to the checkout flow for the plan they originally chose.
4. The checkout session is created server-side (with their now-authenticated identity) and they are sent to Dodo (or EPAY for Egypt).

---

## 2. Architecture Decision: Auth-Then-Checkout (not Guest Checkout)

### Options considered

| Approach | Pros | Cons |
|----------|------|------|
| **A. Guest Checkout** (email-only, account later) | Lower friction, higher conversion at checkout | Complex post-purchase account linking; orphaned subscriptions; Dodo customer → local user mapping is fragile; security risk with unverified emails claiming paid entitlements |
| **B. Auth-Then-Checkout** (redirect to login/signup, then checkout) | Clean 1:1 user-subscription mapping; webhook user lookup is reliable; server-side entitlements are secure; existing Better Auth flow reused | One extra step before payment; small drop-off risk |
| **C. Inline email capture** (email field on pricing page → checkout) | Feels seamless | Still needs account creation; adds UI complexity; email-only doesn't give us a user ID for the checkout metadata |

### Decision: **Option B — Auth-Then-Checkout** with plan intent preservation

**Rationale** (aligned with expert guidance):

1. **payments-engineer**: _"The client is never the source of truth for paid status."_ — We need a verified `userId` in the checkout metadata so webhooks can reliably activate subscriptions. Guest checkout makes this mapping fragile.

2. **security-engineer**: _"Deny-by-default; auth guard global."_ — The `createCheckoutSession` endpoint is a `protectedProcedure`. Rather than downgrading it to public (which opens abuse vectors), we gate at the UI.

3. **ux-flow-mapper**: _"Prompt at peak motivation (Fogg B=MAP)"_ — The plan click IS the moment of peak motivation. We must minimize steps between that click and the payment page. A redirect to login/signup with automatic return-to-checkout achieves this.

4. **Industry practice** (Stripe SaaS Starter, Salable): _"If the user is not authenticated, redirect to sign-up with redirect=checkout&priceId=X."_ The auth gate sits at the moment of payment, not at the moment of browsing.

5. **Dodo checkout-integration skill**: Checkout sessions require customer email + metadata with `userId`. Both require an authenticated user.

---

## 3. Implementation Plan

### 3.1 UX Flow (ux-flow-mapper)

#### Happy path: Unauthenticated user buys a plan

```
Landing Page (/pricing section)
  │
  ├─ User clicks "Get Pro" (monthly/yearly) or "Start 7-day trial"
  │
  ├─ Is user authenticated? (check `session` from route context)
  │   │
  │   ├─ YES → Create checkout session → redirect to Dodo checkout
  │   │
  │   └─ NO → Navigate to /auth/login?plan=monthly (or yearly/trial)
  │            │
  │            ├─ User already has an account → logs in
  │            │   └─ After login → detect `plan` search param → redirect to checkout
  │            │
  │            └─ User is new → clicks "Create one now" → /auth/register?plan=monthly
  │                └─ After registration → detect `plan` search param → redirect to checkout
  │
  └─ Checkout complete → /checkout/success → verifyAndActivate → Dashboard
```

#### States per page

| Page | Loading | Empty | Error | Success |
|------|---------|-------|-------|---------|
| Pricing (/) | N/A (static) | N/A | Checkout creation error → toast | Redirect to Dodo/auth |
| Login (/auth/login) | "Signing in..." toast | Default form | Wrong credentials toast | Redirect to plan checkout OR dashboard |
| Register (/auth/register) | "Creating account..." toast | Default form | Validation errors | Redirect to plan checkout OR dashboard |
| Checkout Success | Polling spinner | N/A | Verification failed banner | "You're on Pro!" |

#### Action matrix

| Surface | Action | Unauthenticated | Authenticated |
|---------|--------|-----------------|---------------|
| Pricing: "Get Pro" button | Click | Navigate to `/auth/login?plan={billing}` | Call `createCheckoutSession` → redirect to Dodo |
| Pricing: "Start 7-day trial" button | Click | Navigate to `/auth/login?plan=trial` | Call `createCheckoutSession` → redirect to Dodo |
| Login page | Submit | Authenticate → check `plan` param → if present, call checkout → redirect | Already redirected to dashboard |
| Register page | Submit | Create account → check `plan` param → if present, call checkout → redirect | Already redirected to dashboard |
| Login: "Create one now" link | Click | Navigate to `/auth/register?plan={plan}` (preserve plan param) | N/A |
| Register: "Sign in" link | Click | Navigate to `/auth/login?plan={plan}` (preserve plan param) | N/A |

---

### 3.2 Frontend Implementation (frontend-engineer)

#### 3.2.1 Update pricing page buttons

**File**: `apps/web/src/routes/_home/-sections/pricing.tsx`

**Change**: Detect session from route context. If unauthenticated, redirect to `/auth/login?plan=X` instead of calling the API.

```tsx
// Access session from the nearest route context
const session = Route.useRouteContext({ select: (ctx) => ctx.session });

const handleCheckout = async (plan: "monthly" | "yearly" | "trial") => {
  if (!session) {
    // Unauthenticated: redirect to login with plan intent
    navigate({ to: "/auth/login", search: { plan } });
    return;
  }
  // Authenticated: proceed with checkout
  setCheckoutLoading(true);
  try {
    const result = await client.billing.createCheckoutSession({ plan });
    window.location.href = result.checkoutUrl;
  } catch {
    setCheckoutLoading(false);
  }
};
```

**Key decisions**:
- Use `search: { plan }` (query string) not local storage — survives email verification, link sharing, and browser restarts.
- No new UI components needed — same buttons, different behavior based on auth state.

#### 3.2.2 Update login page to accept and use `plan` search param

**File**: `apps/web/src/routes/auth/login.tsx`

**Change**: Add `plan` to the route's `validateSearch`. Pass it to the `LoginPage` component.

```tsx
export const Route = createFileRoute("/auth/login")({
  component: RouteComponent,
  validateSearch: z.object({
    plan: z.enum(["monthly", "yearly", "trial"]).optional(),
  }).parse,
  beforeLoad: async ({ context }) => {
    if (context.session) throw redirect({ to: "/dashboard", replace: true });
    return { session: null };
  },
});

function RouteComponent() {
  const { flags } = Route.useRouteContext();
  const { plan } = Route.useSearch();

  return (
    <LoginPage
      disableEmailAuth={flags.disableEmailAuth}
      disableSignups={flags.disableSignups}
      pendingPlan={plan}
    />
  );
}
```

#### 3.2.3 Update `LoginPage` to redirect to checkout after auth

**File**: `apps/web/src/features/auth/pages/login.tsx`

**Change**: Accept optional `pendingPlan` prop. After successful login, if `pendingPlan` exists, call `createCheckoutSession` and redirect to Dodo instead of dashboard.

```tsx
type Props = {
  disableEmailAuth: boolean;
  disableSignups: boolean;
  pendingPlan?: "monthly" | "yearly" | "trial";
};

// In onSubmit success handler, replace:
//   void navigate({ to: "/dashboard", replace: true });
// With:
if (pendingPlan) {
  try {
    const result = await client.billing.createCheckoutSession({ plan: pendingPlan });
    window.location.href = result.checkoutUrl;
    return;
  } catch {
    // Checkout failed — still go to dashboard, user can retry from billing settings
    toast.error(t`Could not start checkout. You can try again from your billing settings.`);
  }
}
void navigate({ to: "/dashboard", replace: true });
```

**Also update the "Create one now" link** to preserve the `plan` param:

```tsx
<Link to="/auth/register" search={{ plan: pendingPlan }}>
```

#### 3.2.4 Update register page and `RegisterPage` component similarly

**File**: `apps/web/src/routes/auth/register.tsx`

**Change**: Add `plan` to `validateSearch`, pass to `RegisterPage`.

**File**: `apps/web/src/features/auth/pages/register.tsx`

**Change**: Accept `pendingPlan`, after successful registration redirect to checkout. Update the "Sign in" link to preserve the `plan` param.

#### 3.2.5 Update social auth callback

**File**: `apps/web/src/features/auth/components/social-auth.tsx`

**Change**: If a `plan` is pending, store it in `sessionStorage` before the OAuth redirect (since OAuth goes to an external provider and back). After the OAuth callback lands on `/dashboard`, check sessionStorage for the pending plan and trigger checkout.

```tsx
// Before OAuth redirect:
if (pendingPlan) {
  sessionStorage.setItem("headcv_pending_plan", pendingPlan);
}
// The callbackURL remains "/dashboard" for OAuth

// In dashboard/route.tsx loader or a new /auth/callback route:
const pendingPlan = sessionStorage.getItem("headcv_pending_plan");
if (pendingPlan) {
  sessionStorage.removeItem("headcv_pending_plan");
  // Trigger checkout
}
```

**Alternative (simpler, preferred)**: Use the login/register page's own post-auth redirect logic with `callbackURL` including the plan:

```tsx
const callbackURL = pendingPlan
  ? `/dashboard?checkoutPlan=${pendingPlan}`
  : "/dashboard";

const options: SocialSignInOptions = { provider, callbackURL };
```

Then in the dashboard route loader, check for `checkoutPlan` query param and trigger checkout.

---

### 3.3 Backend (backend-engineer)

#### No backend changes needed

The `createCheckoutSession` endpoint already:
- Is a `protectedProcedure` (requires auth) ✓
- Accepts `plan` as input ✓
- Creates the Dodo checkout session with user email + metadata ✓
- Returns the `checkoutUrl` ✓

The only change is **how the frontend calls it** — after auth instead of before.

#### Optional enhancement: Add a dedicated checkout-redirect endpoint

If the post-login checkout flow needs to happen server-side (e.g., in a `beforeLoad` or `loader`), consider adding:

```
POST /billing/checkout-redirect
Input: { plan: "monthly" | "yearly" | "trial" }
Response: { checkoutUrl: string }
```

This is the same as `createCheckoutSession` but could be called from a route loader. **Not required for v1** — the client-side call after login is simpler and sufficient.

---

### 3.4 Security (security-engineer)

#### 7-Rung Ladder for this flow

| # | Rung | Status | Notes |
|---|------|--------|-------|
| 1 | HTTPS + CORS | ✅ Already enforced | Pricing page is public; checkout endpoint is same-origin |
| 2 | Authentication | ✅ `protectedProcedure` | Checkout session creation requires auth. Unauthenticated users are redirected to login — never served a checkout URL |
| 3 | Role authorization | ✅ N/A | Any authenticated user may purchase any plan |
| 4 | Ownership | ✅ | Checkout session is created for `context.user.id` — cannot create a session for another user |
| 5 | Session lifecycle | ✅ | Better Auth session verified per request |
| 6 | Rate limiting | ✅ | `createCheckoutSession` is behind existing rate limits. Additional: limit to 5 checkout creations per user per 10 minutes |
| 7 | Logging & audit | ⚠️ Add | Log checkout session creation with userId and plan (already have `console.error` for failures; add `console.info` for success) |
| + | Webhooks | ✅ Already verified | Dodo webhook signature verified before processing |

#### Threat mitigations

| Threat | Mitigation |
|--------|------------|
| **Plan param tampering** — user modifies `?plan=yearly` to an invalid value | `z.enum(["monthly", "yearly", "trial"])` validation in `validateSearch`. Invalid values → param ignored, user sees default login page |
| **Replay/race** — user clicks checkout multiple times | `setCheckoutLoading(true)` disables the button. Server creates a new session (Dodo handles dedup via email). Previous sessions expire in 24h |
| **OAuth plan loss** — plan param lost during external OAuth redirect | Store in `sessionStorage` (scoped to origin, cleared after use) or encode in `callbackURL` query param |
| **Session fixation** — attacker sends victim a link with `?plan=yearly` | No security impact — the plan param only determines which checkout to create. The user must authenticate with their own credentials and pay with their own payment method |
| **Checkout URL leak** — attacker intercepts the checkout URL | Dodo checkout sessions are single-use, expire in 24h, and are tied to the customer email. No entitlement without webhook verification |

---

### 3.5 Payments (payments-engineer)

#### Provider routing: Dodo vs EPAY

The `createCheckoutSession` endpoint accepts an optional `country` field. When the user is from Egypt → EPAY provider; otherwise → Dodo.

**Current implementation**: Country defaults to undefined (Dodo). For v1, this is fine — EPAY is stubbed.

**Future**: Detect country from:
1. User's billing address (if stored from previous purchase)
2. Geo-IP on the server side
3. Explicit selection on the pricing page ("Pay with EPAY" button for Egyptian users)

This does NOT change the auth-gated flow — the provider is selected server-side regardless.

#### Checkout metadata

The checkout session already includes:
```ts
metadata: { userId: context.user.id }
```

This is critical — webhooks use this to map the Dodo subscription back to the local user.

#### Post-auth checkout failure handling

If `createCheckoutSession` fails after login:
1. Show a toast error with a clear message
2. Navigate to `/dashboard` (user is now authenticated)
3. User can retry from `/dashboard/settings/billing`

Never leave the user stuck on a loading page.

---

### 3.6 Testing Plan (qa-tester)

#### Automated tests

| Test | Type | File |
|------|------|------|
| Pricing buttons redirect to login when unauthenticated | Component test | `pricing.test.tsx` |
| Login page accepts `plan` search param | Route test | New or extend `login.test.tsx` |
| Login page redirects to checkout after auth when `plan` is set | Integration test | Manual + component |
| Register page preserves `plan` param | Component test | New or extend |
| Invalid `plan` param is safely ignored | Component test | `pricing.test.tsx` |
| Authenticated user clicks plan → goes straight to checkout | Component test | `pricing.test.tsx` |

#### Manual E2E test checklist

- [ ] Visit `/` → click "Get Pro" while logged out → redirected to `/auth/login?plan=monthly`
- [ ] On login page, verify "plan=monthly" is in the URL
- [ ] Click "Create one now" → verify redirected to `/auth/register?plan=monthly`
- [ ] On register page, complete registration → verify redirected to Dodo checkout for monthly plan
- [ ] Visit `/` → click "Start 7-day trial" while logged out → login → verify trial checkout
- [ ] Visit `/` → click "Get Pro" while logged in → goes directly to Dodo checkout
- [ ] Visit `/auth/login?plan=invalidvalue` → verify no crash, login works normally, goes to dashboard
- [ ] Social auth (Google/GitHub) preserves plan intent through the OAuth redirect flow
- [ ] After payment succeeds → verify subscription activated (via webhook or verifyAndActivate)

---

## 4. Agent Assignment Summary

| Agent | Responsibility | Files Touched |
|-------|---------------|---------------|
| **ux-flow-mapper** | Define the journey, states, action matrix | This document (Section 3.1) |
| **frontend-engineer** | Implement auth-gated checkout redirect, plan param passing, post-auth checkout trigger | `pricing.tsx`, `login.tsx`, `LoginPage`, `register.tsx`, `RegisterPage`, `social-auth.tsx` |
| **backend-engineer** | Review — no changes needed (endpoint already correct) | N/A |
| **payments-engineer** | Verify checkout metadata, provider routing, failure handling | Review `router.ts`, `dodo-provider.ts` |
| **security-engineer** | Validate the 7-rung ladder, threat model, input validation | Review all changed files |
| **qa-tester** | Write test cases, manual E2E checklist | `pricing.test.tsx`, new test files |

---

## 5. Implementation Order

1. **Add `plan` search param to login route** (5 min)
2. **Add `plan` search param to register route** (5 min)
3. **Update pricing page: auth check before checkout** (15 min)
4. **Update `LoginPage`: post-auth checkout redirect** (15 min)
5. **Update `RegisterPage`: post-auth checkout redirect** (15 min)
6. **Update social auth: preserve plan through OAuth** (15 min)
7. **Update "Create one now" / "Sign in" links to preserve plan** (5 min)
8. **Update pricing test to cover new behavior** (10 min)
9. **Typecheck + test + boundary check** (5 min)
10. **Manual E2E test** (15 min)

**Estimated total: ~2 hours**

---

## 6. Key Principles Applied

- **payments-engineer**: _"Fulfillment ONLY from webhook events, never from the success-page redirect."_ — We do NOT grant access from the checkout redirect. The `verifyAndActivate` endpoint is a server-verified fallback; webhooks are authoritative.
- **security-engineer**: _"Client-side 'the button is hidden' is not authorization; every rule exists server-side or it doesn't exist."_ — The checkout endpoint remains a `protectedProcedure`. We add the auth check in the UI for UX, not for security.
- **ux-flow-mapper**: _"Fewest possible steps and fields"_ + _"Prompt at peak motivation"_ — One redirect to login, auto-return to checkout. No extra "confirm your plan" page.
- **frontend-engineer**: _"Every data surface implements loading/empty/error/success."_ — All four states handled on every page in the flow.
- **Dodo checkout-integration skill**: _"The browser redirect is not the source of truth. Always verify payment via webhook."_ — Already enforced by the existing `verifyAndActivate` + webhook handler.
