# Prompts Playbook  Web / SaaS

A single-file, prompt-based replacement for the multi-agent workflow.  
Each prompt is a "hat" you ask one assistant to wear.  
Pick the branch matching your current phase, fill in the bracketed variable, and paste the prompt.

---

## How to use

1. Find your current phase below.
2. Copy the prompt block.
3. Replace `[variable]` with the real topic, file, or slice name.
4. Run it. Do not jump branches unless the current gate is approved.

---

## Branch 1  Research

### RES-01: Tech research

**When:** You need to choose a library, pattern, API, or architecture before committing to it.

**Prompt:**

```text
Act as a senior web/SaaS technical researcher.
Topic: [library / pattern / API / hosting question]
Research 2–3 real options. For each, report:
- what problem it solves
- pros and cons for THIS project
- constraints (framework lock-in, pricing, ops overhead, security posture)
- fit with Nx + pnpm + Next.js App Router + NestJS + Prisma + Neon stack
Recommend ONE option with a clear rationale. Record the decision in docs/pack/decisions.md.
Keep the answer concise; cite official sources when possible.
```

**Output:** `docs/pack/decisions.md` row + recommendation summary.

**Done when:** one option is chosen and the decision is logged.

---

### RES-02: Feasibility spike

**When:** A risky assumption needs a quick proof-of-concept before it becomes a slice.

**Prompt:**

```text
Act as a prototype engineer.
Risky assumption: [what you need to prove]
Build the smallest possible throwaway prototype in a scratch branch or CodeSandbox/stackblitz.
Time-box: [e.g. 90 minutes].
Report:
- what works
- what breaks
- productionization risks
- whether this should be a real slice
Do not polish the code. Do not merge.
```

**Output:** Spike report (in chat or `docs/spikes/YYYY-MM-DD-slug.md`).

**Done when:** the assumption is proven or disproven with evidence.

---

## Branch 2  Plan

### PLAN-01: Discover

**When:** Starting a new product or a major new direction.

**Prompt:**

```text
Act as a product requirements analyst.
Founder idea / context: [describe the product idea]
1. Interview the founder: who exactly has this problem, what do they do today, what would they pay for.
2. Research 2–5 real SaaS/web apps in the same space. Fill the sources table.
3. Write docs/pack/requirements.md from the template with:
   - Problem / ICP
   - Sources researched
   - Must / Should / Later
   - Non-goals (explicit)
   - Open questions
Every Must/Should requirement must cite a source or an explicit founder decision.
```

**Output:** `docs/pack/requirements.md`

**Done when:** founder approves the requirements as input to user stories.

---

### PLAN-02: Story

**When:** Requirements exist and you need the v1 scope and backlog.

**Prompt:**

```text
Act as a user story writer.
Read docs/pack/requirements.md.
Write docs/pack/user-stories.md from the template:
- v1 scope summary (one sentence)
- release success metric  one concrete, trackable event
- story table: Title / User story / Acceptance criteria / Description
- grouped as Must (v1) / Should / Later
- non-goals reminder copied from requirements.md
Every story must pass INVEST and trace to a Must/Should in requirements.md.
Then draft docs/pack/slice-backlog.md as the walking skeleton first, then by dependency and riskiest assumption.
```

**Output:** `docs/pack/user-stories.md` + `docs/pack/slice-backlog.md`

**Done when:** founder approves the user stories / v1 scope (G1).

---

### PLAN-03: Flow

**When:** User stories are approved and you need the screen/action map.

**Prompt:**

```text
Act as a UX flow mapper.
Read docs/pack/user-stories.md.
Write docs/pack/user-flows.md from the template:
- Journeys (one per v1 goal)
- Screens table: Screen / Route / Purpose / Reached from
- Key actions matrix: Screen / Action / Intended API effect / Data touched
  - every interactive element must map to an effect; if none, write "none (client-only)"
- Empty / error / loading states per screen
No orphan buttons. No screens invented outside v1 scope.
```

**Output:** `docs/pack/user-flows.md`

**Done when:** founder confirms the flows match their mental model.

---

### PLAN-04: Style

**When:** Flows are approved and you need a frozen visual system.

**Prompt:**

```text
Act as a brand + UI designer.
Read docs/pack/user-flows.md.
1. Build 2–3 style directions for the core screens as static HTML/CSS mock files in docs/pack/html-mocks/.
2. Capture founder feedback in plain words.
3. Write/refine docs/pack/brand-and-style.md from the template:
   - Brand direction
   - Tokens (color, type, spacing, radius)
   - Type & composition rules
   - Shared component mapping
Loop until the founder explicitly says "freeze" (G2).
Do not start the data schema or slices before style freeze.
```

**Output:** `docs/pack/html-mocks/*` and `docs/pack/brand-and-style.md`

**Done when:** founder approves style freeze (G2).

---

## Branch 3  Build

### BUILD-01: Data

**When:** Style is frozen and you need the data layer design.

**Prompt:**

```text
Act as a data modeler.
Read docs/pack/user-flows.md and docs/pack/brand-and-style.md.
Write docs/pack/erd-mvp.md from the template:
- Plain-language summary (2–3 sentences for the founder)
- ERD / entity relations
- Prisma draft notes (models, uniques, indexes, ownership FKs)
- Clerk→Neon User sync plan
- Ownership / sensitivity review table
Follow the project data standards: Prisma migrations, Neon pooled DATABASE_URL + DIRECT_URL for migrations, single PrismaClient instance, Clerk clerkId unique, ownership FKs on every user-scoped entity, money as integer cents, indexes on real query paths.
Do not build schema before style freeze (G2).
```

**Output:** `docs/pack/erd-mvp.md`

**Done when:** security review passed and founder confirms plain-language summary.

---

### BUILD-02: Security

**When:** Any slice touches auth, data, endpoints, webhooks, or public/private boundaries.

**Prompt:**

```text
Act as a security engineer.
Review the current slice / data-mvp / API plan: [slice name]
Run the 7-rung security ladder per endpoint:
1. HTTPS + CORS  which origins may call this?
2. Authentication  who is calling? (Clerk verifyToken, global guard, @Public opt-out)
3. Role authorization  is their role allowed?
4. Ownership  is this THEIR row? (Neon userId FK; unowned → 404/403)
5. Session lifecycle  logout/revocation respected?
6. Rate limiting  how fast may they call it?
7. Logging & audit  what must be recorded, redacted?
Plus: webhook signature verification, DTO allowlists, shaped responses, OWASP API Top 10 (2023) mapping.
Write the Security section of the Slice Spec. Update docs/pack/security-privacy-declaration.md if data collection or third-party services changed.
```

**Output:** Security section in `docs/slices/NN-slug.md` + updated `docs/pack/security-privacy-declaration.md` if needed.

**Done when:** ladder is fully answered and no unjustified risks remain.

---

### BUILD-03: Backend

**When:** A slice needs API endpoints, NestJS modules, and DTO contracts.

**Prompt:**

```text
Act as a backend engineer.
Read the flow matrix and data schema for slice: [slice name]
Design and/or implement the API surface:
- One NestJS feature module per domain
- Thin controllers, business logic in services
- DTO validation at the edge: whitelist: true + forbidNonWhitelisted: true + transform: true
- Consistent structured error shape, never raw stack traces
- API stubs return the FINAL response shape if logic is not ready
- Cursor pagination for growing lists; Idempotency-Key for retry-sensitive mutations
- Nx Nest generators for scaffolding
Write the Backend section of the Slice Spec: endpoint list, request/response contracts, stub-vs-real status, module placement, error cases.
```

**Output:** Backend section in `docs/slices/NN-slug.md` + Nest code.

**Done when:** contract is published and frontend can call it unmodified when logic lands.

---

### BUILD-04: Frontend

**When:** A slice needs Next.js pages/components against real APIs and frozen style.

**Prompt:**

```text
Act as a frontend engineer.
Read docs/pack/brand-and-style.md, the slice Spec, and existing shared components.
Build the UI for slice: [slice name]
- Next.js App Router: server components first; "use client" only for interactivity / browser APIs
- Fetch in server components directly; no secrets in the client
- CSS Modules + theme tokens; no inline hex, no one-off styles
- Reuse shared Button/Input/Card before writing new ones
- Stream with Suspense boundaries + loading.js
- Real API endpoints only  frontend data mocks forbidden
- Loading / empty / error / success states for every data surface
- Accessibility: semantic HTML, keyboard-operable, 4.5:1 contrast, visible focus
- next/image, next/font, code splitting, Link prefetch
```

**Output:** Pages/components in `apps/web` + feature libs.

**Done when:** UI matches the Spec and frozen style, all states reachable, zero frontend mocks.

---

### BUILD-05: Payments (optional)

**When:** A slice moves money.

**Prompt:**

```text
Act as a payments engineer.
Read the UX flow and backend plan for slice: [slice name]
Design the Stripe integration:
- Checkout Session created server-side; client only redirects
- Webhook signature verified on the raw body before parsing
- Ack fast (return 2xx within 20s); heavy fulfillment runs async
- Fulfillment ONLY from verified webhook events, never from the success page
- Idempotent fulfillment within the same DB transaction as the event dedupe
- Handle checkout.session.completed AND async_payment_succeeded/failed
- Paid state persisted in Neon and read from there
- Test mode until Ship; live keys only via server env
Write the Payments section of the Slice Spec: session endpoint, webhook events, idempotency, fulfillment, failure/refund paths.
```

**Output:** Payments section in `docs/slices/NN-slug.md` + Stripe modules.

**Done when:** test-mode E2E green and duplicate webhooks cause no double fulfillment.

---

### BUILD-06: SEO (optional)

**When:** A slice has public routes.

**Prompt:**

```text
Act as an SEO engineer.
List the public/private routes for slice: [slice name]
For public routes:
- generateMetadata with metadataBase
- unique title + meta description
- self-referencing canonical
- OG/Twitter cards where shareable
- JSON-LD using the most specific schema.org type (only where it genuinely fits)
For private routes: noindex + robots-disallowed.
Update sitemap.ts and robots.ts if routes changed. Dev/preview environments stay noindex.
Write the SEO section of the Slice Spec.
```

**Output:** SEO section in `docs/slices/NN-slug.md` + metadata/sitemap/robots code.

**Done when:** public routes are indexable, private routes invisible, share previews verified.

---

## Branch 4  Ship

### SHIP-01: Test

**When:** Slice code is written and you need to prove it works.

**Prompt:**

```text
Act as a QA tester.
For slice: [slice name]
Write and run tests across the pyramid:
- Unit/API tests: services, handlers, edge cases (Vitest)
- Component tests: interactive UI states (Testing Library, React Testing Library)
- One Playwright happy path per major journey
Testing Library principle: query by role/label/text as a user would; testid only as escape hatch; no manual sleeps.
Include security negatives: 401 unauth, 403/404 wrong owner, 429 over-limit.
Include accessibility checks: semantic labels, keyboard, contrast.
Fix any flaky test. Zero skipped tests in slice scope.
```

**Output:** Test files + green CI/local run.

**Done when:** all tests green, negatives covered, no flakes.

---

### SHIP-02: Release

**When:** Tests are green and you need a deployable artifact.

**Prompt:**

```text
Act as a DevOps releaser.
Run Global Setup first if not green (G4): Nx web/api scaffolds, Neon, Clerk, Stripe if payments, Vercel + Railway, env matrix, security skeleton, observability, CI.
For slice: [slice name]
- Run Prisma migrate deploy (never migrate dev against prod)
- Build the web and API apps
- Run lint, typecheck, and tests
- Run smoke tests: health endpoint + the slice's real path
- Verify rollback note exists in the Slice Spec
- Verify no secrets are committed
Report build times, smoke results, and any warnings.
```

**Output:** Built artifacts + smoke report.

**Done when:** build and smoke succeed, rollback note exists.

---

### SHIP-03: Deploy

**When:** Release artifact is ready and you need to ship.

**Prompt:**

```text
Act as ship captain.
For slice: [slice name]
- Commit with a conventional message: feat(slice-N): [summary]
- Push through no-mistakes if configured, otherwise push to origin manually
- Open a clean PR using the project template
- Deploy API (Railway) + web (Vercel), migrate first
- Verify health endpoint and the slice path in production
- Upload to Play Console / app store only if this is a mobile slice (N/A for web)
- Update docs/pack/slice-backlog.md status to shipped
- Verify the commit is visible on GitHub
A local-only commit is Build, not Ship.
```

**Output:** PR + deploy records + updated backlog.

**Done when:** commits pushed, PR open, production smoke green, backlog reflects shipped.

---

## Branch 5  Care

### CARE-01: Fix

**When:** Something is broken.

**Prompt:**

```text
Act as a bug fixer.
Problem: [error / stack trace / wrong behavior]
1. Reproduce first. Best form: a failing test that becomes the regression test.
2. Route the symptom:
   - payments → payments-engineer lens
   - auth/data leak/rate-limit → security-engineer lens
   - API 500s / contract mismatch → backend-engineer lens
   - data/migration → data-modeler lens
   - UI broken → frontend-engineer lens
   - deploy/env → devops-releaser lens
   - prod down NOW → switch to hotfix mode
3. Root-cause by reading actual code/logs. Change one thing at a time.
4. Fix the cause, not the symptom. Add the regression test. Verify in the running app.
5. Ship: deployed + smoke green + pushed.
Report: cause → fix → test → proof.
```

**Output:** Fix commit + regression test.

**Done when:** original reproduction no longer fails and fix is pushed.

---

### CARE-02: Optimize

**When:** Code is messy or slow.

**Prompt:**

```text
Act as a refactorer / performance engineer.
Target: [file / feature]
If refactoring:
- ensure tests are green first (or write characterization tests)
- make small reversible steps
- run tests after each step
- no behavior changes, no smuggled features
If performance:
- measure baseline BEFORE changing anything
- classify the bottleneck (DB query, API handler, render, bundle, build)
- fix the highest-impact item only
- re-measure and report before/after numbers
Ship: deployed + smoke green + pushed.
```

**Output:** Refactor/perf commit + measurement report.

**Done when:** tests green and improvement proven (or complexity justified).

---

### CARE-03: Audit / drift

**When:** Checking security, updating dependencies, or verifying scope.

**Prompt:**

```text
Act as a security auditor / requirements analyst.
Task: [security audit / dependency update / drift check]
If security audit:
- inventory all API endpoints and CORS origins
- re-walk the 7-rung ladder per endpoint
- grep for secrets and PII in logs
- scan dependencies for vulnerabilities
If dependency update:
- security patches first
- read changelogs
- update one coherent group at a time
- run full test suite + build before push
If drift check:
- compare the feature/slice to docs/pack/requirements.md
- flag anything outside approved scope
Rank findings, fix or backlog them, push fixes with tests.
```

**Output:** Audit/update report + fixes/backlog items.

**Done when:** critical findings fixed or explicitly backlogged.

---

## Branch 6  Learn

### LEARN-01: Concept tutor

**When:** You do not understand a concept, technology, or decision.

**Prompt:**

```text
Act as a patient technical teacher. Assume I have zero background.
Explain: [concept / code / pattern]
Use the actual code from this repo as the running example.
Structure your answer:
1. What problem does this solve?
2. TL;DR (3–5 bullets)
3. What the code does, line by line or block by block
4. Why the team used it here (trade-off)
5. Official source link with exact heading/anchor
6. One concrete "read this next" step
7. One common misconception
Do not skip definitions of jargon.
```

**Output:** Explanation in chat or `docs/slices/NN-slug.learn.md` + `docs/concepts/index.md` update.

**Done when:** the founder could explain the concept back in their own words.

---

## Quick reference: gates per phase

| Phase | Gate | Prompts that unblock it |
|-------|------|-------------------------|
| Requirements approved |  | PLAN-01 |
| v1 scope / user stories | G1 | PLAN-02 |
| Style freeze | G2 | PLAN-04 |
| Backlog freeze | G3 | PLAN-02, PLAN-03, PLAN-04, BUILD-01, BUILD-02 |
| Global Setup green | G4 | SHIP-02 |
| Slice Spec frozen | G-spec | BUILD-01 → BUILD-06 as needed |
| Slice shipped | Ship | SHIP-01, SHIP-02, SHIP-03 |

---

## One rule across every prompt

If the current gate is not approved, stop and ask the founder before continuing.
