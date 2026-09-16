# HeadCV Implementation Plan  Universal CV Builder v1

## Document meta

| Field | Value |
|---|---|
| Project | HeadCV (Universal CV Builder) |
| Foundation | `AHMED9937/headcv` v5.1.6 |
| License | MIT (upstream notices retained) |
| MVP boundary | No AI; rules and curated content only |
| UX benchmark | Resume.io / FlowCV / Zety / Kickresume / Enhancv (flow patterns only, not visual identity) |
| Requirements source | `Doc/pack/requirements.md` in this workspace |
| Research artifacts | `.lavish/cv-open-source-repo-research.html`, `.lavish/competitor-flow-requirements.html` |

---

## 1. Executive summary

Build a beginner-first, Arabic/English resume SaaS by **forking one open-source foundation** (HeadCV) and **adapting its UX layer**, not by cloning multiple codebases or copying competitor visual assets.

The product is **product/UX adaptation around a mature engine**, not a ground-up SaaS build. Most of the heavy engineering (auth, database, real-time preview, PDF export, i18n, RTL tests, dashboard) is inherited. The remaining work is the beginner wizard, deterministic CV review, curated content catalogue, original templates, and guest-to-account flow.

### What we agreed on

- Fork `AHMED9937/headcv` v5.1.6 as the single codebase foundation.
- Use Resume.io's **split-screen, live-preview editor** as the interaction pattern to copy, but build our own visual identity and templates.
- Place **Quick Setup** (language, target job, experience level) **before** template choice, unlike Resume.io's template-first flow.
- No AI in MVP. Deterministic rules and curated phrase patterns only.
- 6 original launch templates: 3 LTR, 3 RTL, built from our own design tokens.
- Arabic/RTL is a launch requirement, not a later add-on.
- Guest-first creation, then account prompt after first value.
- Honest commercial disclosure before setup starts.
- Mobile: Editor/Preview tabs instead of split-screen.

---

## 2. Foundation and architecture

### 2.1 Chosen foundation

| Decision | Choice | Why |
|---|---|---|
| Base repo | `AHMED9937/headcv` | Mature, MIT-licensed project (stable tag v5.1.6) with React, TypeScript, PostgreSQL, Drizzle, Better Auth, multiple templates, PDF/JSON/DOCX export, Docker, i18n, and RTL tests. |
| Stable tag | `v5.1.6` (or latest stable release at fork time) | Reproducible baseline; avoid chasing upstream `main`. |
| PDF engine | Keep `@react-pdf/renderer` | Do not add a second PDF engine in MVP. |
| Database | PostgreSQL | Already the upstream choice. |
| Auth | Better Auth | Already in upstream; supports guest-to-account migration. |
| i18n | Existing lingui/react-i18next style | `ar-SA.po` locale and RTL fixtures already exist. |
| Deployment | Docker compose + cloud provider | Upstream already ships `docker-compose.yml`. |

### 2.2 High-level architecture

```
your-cv-saas/
├── apps/
│   └── web/                    # forked HeadCV web app
│       ├── src/
│       │   ├── features/
│       │   │   ├── onboarding/     # NEW: quick setup wizard
│       │   │   ├── builder/        # ADAPT: 13-step guided editor shell
│       │   │   ├── phrases/        # NEW: curated content catalogue
│       │   │   ├── review/         # NEW: deterministic CV coach
│       │   │   ├── templates/      # ADAPT: original 6 templates + selector
│       │   │   ├── export/         # ADAPT: download, filename, disclosure
│       │   │   └── dashboard/      # ADAPT: guest-to-account migration
│       │   └── routes/             # keep upstream routing conventions
├── packages/
│   ├── pdf/                    # keep upstream; add our 6 templates
│   ├── ui/                     # keep upstream; override tokens
│   └── content/                # NEW: phrase bank, rules, template metadata
└── .github/                    # CI, license check, PDF snapshot tests
```

---

## 3. Repositories, APIs, and templates: use vs. do not use

### 3.1 We use this as our foundation

| Repo | What we take | How we use it |
|---|---|---|
| `AHMED9937/headcv` | Full application, engine, templates, auth, persistence, preview, export, i18n, Docker. | Fork it. Strip AI integrations. Adapt UI. Add original templates and beginner flow. |

### 3.2 We use these as UX / competitive reference only

| Repo | What we study | What we do NOT do |
|---|---|---|
| **Resume.io** | Split-screen editor, section wizard, template categories, autosave, no-account start. | Copy visual identity, templates, colors, fonts, branding, proprietary content. |
| **FlowCV** | Generous free plan, clean editor, 50+ template categories, mobile experience. | Use their proprietary templates; rely on unofficial reverse-engineered API. |
| **Zety** | Guided step-by-step flow, job/experience-aware tips, ready-made content pattern. | Copy exact wording or visual design. |
| **Kickresume** | Section analysis, profession-filtered phrases, optional sections, autosave. | Use their AI features or copy their analysis scoring. |
| **Enhancv** | Four-stage mental model, full-document live editor, duplicate-to-tailor. | Use their AI tailoring or import flow in MVP. |

### 3.3 We may borrow small, isolated, MIT-compatible snippets from

| Repo | What we might take | Conditions |
|---|---|---|
| `sadanandpai/resume-builder` | Simpler form patterns, Next.js migration fallback. | Only if the team rejects TanStack Start; otherwise avoid. |
| `jsonresume/jsonresume.org` | `@jsonresume/theme-metadata` for template registry patterns; schema validation ideas. | Do not bundle their AI features; respect their license. |
| `resumejson` | Compact layout ideas, JSON shape conventions. | Re-implement in our data model; no copy-paste of whole files. |

### 3.4 We do NOT use

| Repo / service | Why not |
|---|---|
| `xitanggg/open-resume` | AGPL-3.0 license; a modified hosted version normally must offer source. One template, no SaaS backend. |
| `rendercv/rendercv` | Python/Typst/YAML pipeline, not a beginner web app. |
| `best-resume-ever` | Older Vue/YAML/Puppeteer generator, not a SaaS. |
| `pdfme` | Generic PDF designer, no CV data model or writing flow. |
| `diegomura/react-pdf` | Already used inside HeadCV; no second engine. |
| FlowCV private API (`flowcvcli`, `flowcv-mcp`) | Reverse-engineered, violates ToS, can break, legal risk. |
| Canva Connect API | Not for resume builder use; requires Canva subscription and opens Canva editor. |
| Resume.io / Zety / Kickresume assets | Proprietary designs, fonts, templates, branding, wording. |
| UseResume / Resumaine / Sitefy / Distill.cv APIs | Closed-source, AI-powered, recruiter-focused, or white-label SaaS competitors. Not template APIs we can embed. |

### 3.5 Templates

| Source | How we use it |
|---|---|
| HeadCV's existing templates | Starting engine and layout patterns; we keep the rendering contract. |
| Our own design team / licensed Figma templates | Build 6 original launch templates from scratch. |
| Resume/FlowCV/Kickresume/Zety | Visual and category inspiration only. No assets copied. |

### 3.6 External APIs

| API | Use in MVP? | Why |
|---|---|---|
| Better Auth (built-in) | Yes | Authentication, sessions, guest migration. |
| PostgreSQL (self-hosted) | Yes | Persistence. |
| Our own REST/GraphQL API | Yes | The fork already provides one. |
| Any LLM / AI API | **No** | Violates M4.8 and MVP no-AI gate. |
| Resume parser API | No | Import is a "Should" (S2), not a "Must". |
| LinkedIn import API | No | S3, not MVP. |
| Payment provider (Stripe/PayPal) | Later | S8, only if monetization is needed before launch; otherwise defer. |

---

## 4. 13-step flow: Ready / Adapt / Build

Source: `Doc/pack/requirements.md` and `.lavish/cv-open-source-repo-research.html`.

| Step | Screen | Status | Notes |
|---|---|---|---|
| 1 | Landing | Adapt | Rewrite around one `Create my CV` CTA; hide advanced/power-user chrome. |
| 2 | Quick setup | Build | Add language, target job, experience level. Recommend section order and up to 3 templates. |
| 3 | Template choice | Adapt | Curate existing template engine into 6 launch templates with categories and safe default. |
| 4 | Personal details | Ready | Keep schema; simplify labels; collapse optional fields. |
| 5 | Work experience | Adapt | Keep entries; add job-title tips and curated phrase patterns. |
| 6 | Education | Ready | Data model and rendering exist. Add reorder-before-experience for low-experience users. |
| 7 | Skills | Adapt | Add deterministic role-based skill suggestions; unchecked by default. |
| 8 | Summary | Adapt | Add fill-in-the-blank formulas and examples by experience level. |
| 9 | Additional sections | Ready | Custom sections already cover projects, certificates, languages, etc. |
| 10 | Review | Build | Deterministic checks: completeness, dates, placeholders, duplicates, long bullets, overflow, privacy. |
| 11 | Design | Adapt | Colors, fonts, spacing, page size, section order exist; hide advanced settings by default. |
| 12 | Export | Adapt | PDF runs client-side; add filename, disclosure, and retry. DOCX can be deferred to Should. |
| 13 | Save account | Ready | Better Auth + PostgreSQL; delay prompt until after first value/preview/export. |

### HTML-mock flow split

The `Doc/pack/html-mocks/` prototype now separates the two creation paths so the team can test each journey before the production fork:

- **Create new resume**: `setup.html` → `templates.html` → `wizard.html`. `wizard.html` is an 8-step wizard that mirrors the screenshot flow (Personal → Professional Experience → Education → Areas of Expertise → Professional Summary → Technical Proficiencies → Additional Sections → Complete & Review).
- **Upload existing resume**: `setup.html` → `builder.html?source=upload`. `builder.html` remains the full-form editor for parsed/uploaded content and shows an upload-source banner.

---

## 5. Implementation slices

Each slice is a shippable milestone. Slices are ordered by dependency. Within each slice, todos are listed in the recommended execution order. A more granular slice backlog with detailed acceptance criteria and task checklists is maintained in `Doc/pack/slice-backlog.md` (S0–S11); the coarse slices below map to it as: Slice 0 = S0, Slice 1 = S1, Slice 2 = S2, Slice 3 = S5, Slice 4 = S9, Slice 5 = S7+S8, Slice 6 = S4+S6+S10+S11.

### Slice 0  Fork, baseline, and team setup

**Goal:** A clean, reproducible fork with all AI/optional features disabled and the team able to run it locally.

**What we reuse (from whom):**

- `AHMED9937/headcv` v5.1.6: entire monorepo, `apps/web/`, `packages/pdf/`, `packages/ui/`, pnpm workspace, `docker-compose.yml`, CI workflows, Biome config.
- `AHMED9937/headcv`: React 19 + TanStack Start setup, Vite, Tailwind, existing component library.
- `AHMED9937/headcv`: Better Auth integration, Drizzle ORM schema, PostgreSQL migrations, session handling.
- `AHMED9937/headcv`: `@react-pdf/renderer` PDF template system and existing templates.
- `AHMED9937/headcv`: i18n/lingui setup, `ar-SA.po` locale, RTL PDF test fixtures.
- `AHMED9937/headcv`: existing test infrastructure (Vitest), auth/guest integration tests.

**What we build / adapt:**

- Organization fork, branch protection, and baseline branch.
- `THIRD-PARTY-NOTICES.md` and license audit.
- `.env` template and local developer documentation.
- AI removal/remediation plan (no upstream AI features in MVP).
- Baseline verification scripts and developer onboarding.

**Todos:**

- [ ] Fork `AHMED9937/headcv` to the organization's GitHub.
- [ ] Create `chore/upstream-headcv-v5.1.6` branch from the stable release tag.
- [ ] Set branch protection and CI for the baseline branch.
- [ ] Run `corepack enable && pnpm install`.
- [ ] Install `dotenvx` CLI so `drizzle-kit` can load `.env.local` (it does not read `.env` files itself).
- [ ] Run `docker compose -f compose.dev.yml up -d postgres` and start the app; verify `/api/health`.
- [ ] Run the first migration with `dotenvx run -f .env.local -- pnpm db:migrate`.
- [ ] Audit and document all upstream third-party licenses in `THIRD-PARTY-NOTICES.md`.
- [ ] Remove or disable AI integrations, AI provider keys, and AI-related navigation.
  - Remove `@headcv/ai` and `@headcv/mcp` packages and their imports.
  - Remove AI provider env vars from `.env.example`: `REDIS_URL`, `ENCRYPTION_SECRET`, `FLAG_ALLOW_UNSAFE_AI_BASE_URL`.
  - Remove AI-related entries from `turbo.json` `globalEnv`.
- [ ] Remove or disable optional cloud features not needed for MVP (e.g., external analytics if any).
- [ ] Verify all existing upstream templates render a PDF in English and with Arabic sample data.
- [ ] Set up `.env.local` from `.env.example` and write `docs/LOCAL-SETUP.md`.
  - Required vars: `APP_URL`, `DATABASE_URL`, `AUTH_SECRET`.
  - Optional vars: `PORT`, `SERVER_PORT`, `SMTP_*`, `S3_*`, `LOCAL_STORAGE_PATH`, feature flags.
- [ ] Confirm the team can build, test (`pnpm test`), and export a PDF from the baseline.

**Deliverable:** Running local HeadCV fork, clean `main`, AI disabled.

**Verification:** Any developer can run `docker compose -f compose.dev.yml up` and create a guest CV.

---

### Slice 1  Brand, landing, and visual identity

**Goal:** Replace upstream branding with our own; build the landing page around one CTA.

**What we reuse (from whom):**

- `AHMED9937/headcv`: existing routing, app shell, SSR/CSR patterns, i18n loading.
- `AHMED9937/headcv`: Tailwind/daisyUI/theme configuration, dark/light mode support.
- `AHMED9937/headcv`: form primitives, button components, layout primitives.
- Resume.io / FlowCV / Canva (UX benchmark only, not assets): one dominant CTA pattern, clean landing structure, no-account-start flow.

**What we build / adapt:**

- Promote frozen tokens from `Doc/pack/brand-and-style.md` and `Doc/pack/html-mocks/styles.css` into the production theme config (colors, typography, spacing, radii, shadows).
- New logo, favicon, app name, and marketing copy.
- Landing page with single `Create my CV` CTA and secondary `Sign in`.
- Early commercial disclosure block.
- Landing analytics privacy guard (no CV text in events).
- Remove upstream pre-auth dashboard/landing choices.

**Todos:**

- [ ] Promote the frozen color palette, typography, spacing, and icon set from `Doc/pack/brand-and-style.md` into the production Tailwind / CSS theme.
- [ ] Replace logo, favicon, app name, and marketing copy.
- [ ] Build landing page with single primary `Create my CV` CTA and `Sign in` as secondary.
- [ ] Add early commercial disclosure block: what is free, what requires account, what may be paid.
- [ ] Add language selector if landing is localized.
- [ ] Implement responsive layout (desktop and mobile).
- [ ] Remove or hide upstream dashboard/landing choices before the user has a CV.
- [ ] Add analytics privacy check: no CV text sent to analytics.
- [ ] Write unit and visual tests for the landing page.

**Deliverable:** Branded landing page with one CTA and honest disclosure.

**Verification:** Landing renders correctly; no broken links; disclosure visible before setup; LCP p75 <= 2.5s and WCAG 2.2 AA targets from §8 are met.

---

### Slice 2  Quick setup wizard and template recommendation

**Goal:** Ask language, target job, and experience level before opening the editor; recommend up to 3 templates with a default.

**What we reuse (from whom):**

- `AHMED9937/headcv`: existing template rendering engine, template metadata shape, A4/Letter preview, template switch logic.
- `AHMED9937/headcv`: guest session/state management, local storage persistence.
- `AHMED9937/headcv`: form components, select/combobox, dialog, card primitives.
- `AHMED9937/headcv`: i18n infrastructure for language switching.
- Zety / Resume.io / Enhancv (flow pattern only): asking job/experience early, recommending templates, category filters.

**What we build / adapt:**

- `apps/web/src/features/onboarding/` quick setup wizard.
- 3-step setup form: language, target job (with manual fallback), experience level.
- Curated job-title dataset (JSON, Arabic + English) in `packages/content/`.
- Template recommendation rules.
- Template gallery with cards, previews, style badges, Free/Paid state.
- Category filters: Simple, Professional, Modern, Creative.
- Safe default template selection and `See all` path.
- Setup choices stored in guest session.

**Todos:**

- [ ] Create `apps/web/src/features/onboarding/`.
- [ ] Build 3-step setup form: CV language, target job (with manual fallback), experience level.
- [ ] Add job-title suggestion dataset (curated JSON, Arabic + English).
- [ ] Implement template recommendation logic based on job + experience.
- [ ] Build template gallery: cards with full-page preview, name, style, ATS-safe label, page behavior, Free/Paid state.
- [ ] Add category filters: Simple, Professional, Modern, Creative.
- [ ] Select a safe default template and allow `See all`.
- [ ] Ensure template choice updates preview without losing or reordering content.
- [ ] Add progress indicator and `Back`/`Continue` navigation.
- [ ] Store setup choices in guest session state.
- [ ] Add E2E tests for the full setup → template → editor flow.

**Deliverable:** Quick setup wizard and template gallery.

**Verification:** User can complete setup, see 3 recommendations, pick one, and land in the editor. Template switch preserves content.

---

### Slice 3  Guided content builder

**Goal:** Adapt the editor into a 13-step ordered wizard with tips and curated phrase patterns.

**What we reuse (from whom):**

- `AHMED9937/headcv`: existing section editor, form fields, repeatable entries, drag-and-drop reordering.
- `AHMED9937/headcv`: section data model (basics, experience, education, skills, custom sections).
- `AHMED9937/headcv`: live preview engine, real-time update, autosave, undo/redo.
- `AHMED9937/headcv`: rich text editor and formatting rules.
- `AHMED9937/headcv`: mobile responsive layout and split-screen preview.
- Resume.io (flow pattern only): ordered personal → summary → links → experience → education → skills → extras flow.
- Zety / Kickresume (flow pattern only): short tips, job-aware guidance, ready-made phrase patterns.

**What we build / adapt:**

- 13-step stepper with named steps, completion state, and progress bar.
- Adapted forms for Personal, Experience, Education, Skills, Summary, Additional.
- `packages/content/` phrase catalogue (curated, editable, job-title filtered, Arabic + English).
- Placeholder validation: a phrase cannot be accepted while named placeholders remain unresolved.
- Experience-level tips and examples.
- Role-based skill suggestions (unchecked by default).
- Fill-in-the-blank summary formulas.
- Mobile Editor/Preview tabs.
- Safe section controls with keyboard alternatives.

**Todos:**

- [ ] Build stepper component showing 13 named steps and completion state.
- [ ] Implement `Personal details` form: name, title, email, phone, location, optional photo, optional links; collapse optional fields.
- [ ] Implement `Work experience` form: repeatable roles with job title, employer, location, dates, current, bullet points.
- [ ] Add job-title-filtered tips and curated phrase patterns; require user to edit placeholders before acceptance.
- [ ] Implement `Education` form with reorder-before-experience for low-experience users.
- [ ] Implement `Skills` form: manual entry, search, categories, reorder, optional level.
- [ ] Add role-based skill suggestions; unchecked by default.
- [ ] Implement `Summary` with fill-in-the-blank formulas and experience-level examples.
- [ ] Implement `Additional sections` adder: languages, certificates, courses, projects, volunteering, awards, publications, references, hobbies, internships, activities, custom.
- [ ] Add safe section controls: add, edit, duplicate, hide, delete, rename, reorder via drag and keyboard buttons.
- [ ] Ensure optional steps have `Skip` / `Not applicable`.
- [ ] Implement `Back` to last incomplete step on return.
- [ ] Add inline tips and examples appropriate to experience level.
- [ ] Add autosave with Saving/Saved/Offline/Error states.
- [ ] Add undo/redo for current session.
- [ ] Add E2E tests for each step.

**Deliverable:** Guided content builder with tips and phrase patterns.

**Verification:** A user can complete all 9 content steps without getting lost; autosave recovers after refresh.

---

### Slice 4  Deterministic CV coach and review

**Goal:** Build the `Improve CV` checklist with transparent, rule-based findings.

**What we reuse (from whom):**

- `AHMED9937/headcv`: CV data schema, section metadata, field path helpers.
- `AHMED9937/headcv`: existing validation utilities and form focus/navigation patterns.
- `AHMED9937/headcv`: i18n strings and section title localization.
- Kickresume / Zety (flow pattern only): section analysis, review grouped by section, direct fix links.

**What we build / adapt:**

- `packages/content/src/rules/` rule engine and `apps/web/src/features/review/` UI.
- Deterministic checks (no AI):
  - empty required data,
  - impossible/illogical dates,
  - unresolved phrase placeholders,
  - duplicate skills/bullets,
  - long bullets,
  - dictionary-based spelling,
  - missing contact,
  - page overflow,
  - privacy warnings.
- `Improve CV` panel grouped by section with rule explanation and direct fix links.
- Passed/Improve/Review badges; no opaque score.
- Tests for each rule in Arabic and English.

**Todos:**

- [ ] Create `packages/content/src/rules/` and `apps/web/src/features/review/`.
- [ ] Implement rule engine for deterministic checks:
  - [ ] Empty required data
  - [ ] Impossible/illogical dates
  - [ ] Unresolved placeholders in accepted phrases
  - [ ] Duplicate skills/bullets
  - [ ] Long bullets (word count thresholds)
  - [ ] Spelling checks (dictionary-based, not AI)
  - [ ] Missing contact details
  - [ ] Page overflow detection
  - [ ] Privacy warnings (photo, sensitive data)
- [ ] Build `Improve CV` panel grouped by section with rule explanation and direct fix link.
- [ ] Selecting a finding focuses the exact field; returning preserves review position.
- [ ] Use Passed/Improve/Review badges; no opaque ATS score or job probability.
- [ ] Add tests for each rule in Arabic and English.
- [ ] Add E2E tests for review → fix → review again.

**Deliverable:** Deterministic review checklist.

**Verification:** All known bad-input cases produce at least one accurate finding; no AI/LLM calls.

---

### Slice 5  Original templates and design system

**Goal:** Build 6 original, ATS-safe, accessible templates (3 LTR, 3 RTL) with shared design tokens.

**What we reuse (from whom):**

- `AHMED9937/headcv`: `@react-pdf/renderer` template rendering contract, style rules, page model, A4/Letter support.
- `AHMED9937/headcv`: existing templates as structural/technical references (not as final visual identity).
- `AHMED9937/headcv`: RTL test fixtures and `packages/pdf/src/templates/shared/rtl.ts`.
- `AHMED9937/headcv`: color, font, spacing customization controls.
- Resume.io / FlowCV / Canva (visual and category inspiration only): simple, professional, modern, creative categories; two-column vs single-column patterns; photo placement.
- Figma Community and MIT open-source resume templates (inspiration only): layout ideas, but every final design is original.

**What we build / adapt:**

- `packages/content/src/templates/metadata.ts` and 6 original template specs.
- 3 LTR templates: Simple ATS, Professional, Modern.
- 3 RTL templates: Simple ATS, Professional, Modern.
- Shared design token system (colors, font sets, density, divider styles) sourced from `Doc/pack/brand-and-style.md`.
- Template controls: template, accent, font set, text scale, density, divider, A4/Letter.
- Arabic font embedding and RTL-safe punctuation/dates.
- Automated PDF snapshot tests for every template × language.
- WCAG 2.2 AA color contrast verification.
- `TEMPLATE-CREDITS.md` documenting any external inspiration.

**Todos:**

- [ ] Create `packages/content/src/templates/metadata.ts`.
- [ ] Define 6 launch template specs:
  - [ ] Simple ATS (LTR)
  - [ ] Professional (LTR)
  - [ ] Modern (LTR)
  - [ ] Simple ATS (RTL)
  - [ ] Professional (RTL)
  - [ ] Modern (RTL)
- [ ] Implement each template in the existing PDF template format.
- [ ] Promote shared design tokens (colors, font sets, density, divider styles) from `Doc/pack/brand-and-style.md` into the PDF and web theme configs.
- [ ] Add template controls: template, accent, font set, text scale, density, divider style, A4/Letter.
- [ ] Enforce readable limits: prevent clipped text, unreadable font size, unsafe contrast, content outside margins.
- [ ] Add Arabic font embedding and RTL-safe punctuation/dates.
- [ ] Build automated PDF snapshot tests for every template in English and Arabic.
- [ ] Add visual regression testing for template renders.
- [ ] Verify WCAG 2.2 AA color contrast on template previews.

**Deliverable:** 6 launch templates with RTL parity and snapshot tests.

**Verification:** Snapshot diffs pass for all 12 language × template combinations; no overflow on common CV sizes.

---

### Slice 6  Export, save, and account migration

**Goal:** Honest, reliable PDF export and guest-to-account conversion.

**What we reuse (from whom):**

- `AHMED9937/headcv`: client-side PDF export via `@react-pdf/renderer`, DOCX/JSON export.
- `AHMED9937/headcv`: guest mode, anonymous session, local storage fallback.
- `AHMED9937/headcv`: Better Auth signup, login, session, password reset flows.
- `AHMED9937/headcv`: dashboard, resume list, rename, duplicate, delete patterns.
- `AHMED9937/headcv`: PostgreSQL/Drizzle data migration utilities.
- Resume.io (flow pattern only): delayed account, no-account start, export disclosure.

**What we build / adapt:**

- Honest export flow with progress, retry, and duplicate-click protection.
- Filename sanitizer: `Candidate Name CV.pdf`.
- Page preview, page count, A4/Letter boundaries.
- Plain-text preview for logical reading order.
- Export privacy filter: hidden sections, examples, placeholders, target-job notes never enter file.
- Commercial disclosure before download.
- Guest-to-account data migration on signup/login.
- Delayed account prompt after first preview or export.
- CV dashboard: create, rename, edit, duplicate, archive, restore, delete.
- Private workspace and CV isolation security.

**Todos:**

- [ ] Implement PDF export with progress, retry, and duplicate-click protection.
- [ ] Implement safe filename: candidate name + `CV`, sanitize invalid characters.
- [ ] Show page preview, page count, and A4/Letter boundaries.
- [ ] Show exact free/account/payment rule before download.
- [ ] Add plain-text preview for logical reading order.
- [ ] Ensure hidden sections, examples, placeholders, and target-job notes never enter the exported file.
- [ ] Implement guest data migration to account on signup/login.
- [ ] Build account prompt after first preview or export, never before builder.
- [ ] Build CV dashboard: create, rename, edit, duplicate, archive, restore, delete.
- [ ] Implement account security: private workspace, CV isolation, secure sessions.
- [ ] Add export error recovery and clear error messages.
- [ ] Add E2E tests for full guest → export → signup → dashboard flow.

**Deliverable:** Export and account system.

**Verification:** User can export PDF as guest, create account, and find their CV in dashboard. PDF text is selectable and matches preview.

---

### Slice 7  Performance, accessibility, Arabic, and launch QA

**Goal:** The product meets the quality baseline and is ready for launch.

**What we reuse (from whom):**

- `AHMED9937/headcv`: existing test setup (Vitest, Playwright), CI workflows.
- `AHMED9937/headcv`: accessibility patterns in existing components.
- `AHMED9937/headcv`: `ar-SA.po` locale, RTL fixtures, PDF RTL tests.
- `AHMED9937/headcv`: existing security middleware (CSRF, XSS, rate limiting patterns).
- `AHMED9937/headcv`: existing analytics privacy approach.

**What we build / adapt:**

- Performance budgets and CI gates (LCP, save p95, PDF export p95).
- Full accessibility audit and keyboard/screen-reader fixes.
- Native Arabic copy review for all UI and phrase content.
- RTL QA: preview, controls, section order, dates, punctuation, PDF export.
- Mobile QA at 360px for all 13 steps.
- Security hardening review.
- Cross-browser test matrix (Chrome, Edge, Firefox, Safari current and previous).
- Analytics privacy verification (no CV text in events).
- Legal review: MIT compliance, third-party notices, data policy, ToS.
- Launch runbook: deployment, rollback, monitoring.

**Todos:**

- [ ] Performance: landing p75 LCP <= 2.5s; save p95 <= 500ms; PDF export p95 <= 10s.
- [ ] Accessibility: keyboard navigation, screen reader labels, focus management, zoom to 400%, error recovery.
- [ ] Arabic QA: native copy review for all UI strings and phrase patterns.
- [ ] RTL QA: preview, controls, dates, section order, punctuation, PDF export.
- [ ] Mobile QA: Editor/Preview tabs, 360px, all 13 steps usable.
- [ ] Security: authorization, validation, CSRF/XSS defenses, encryption, rate limits, private logs.
- [ ] Browser support: current and previous Chrome, Edge, Firefox, Safari.
- [ ] Analytics privacy: track steps, completion, template, findings, export success without CV text.
- [ ] Legal review: confirm MIT compliance, license notices, data policy, and ToS.
- [ ] Run full E2E suite and fix failures.
- [ ] Create launch runbook: deployment, rollback, monitoring.

**Deliverable:** Launch-ready application.

**Verification:** All acceptance criteria in `Doc/pack/requirements.md` pass; security review complete; performance budgets met.

---

## 6. Best practices

### 6.1 Code and repository

- **One foundation, one repo.** Do not mix multiple resume-builder codebases.
- **Branch per slice or feature.** Use the branch strategy from the research:
  - `chore/upstream-headcv-v5.1.6`
  - `feat/beginner-guided-flow`
  - `feat/deterministic-cv-coach`
  - `feat/profession-template-catalog`
  - `feat/arabic-rtl-hardening`
  - `feat/guest-to-account-saas`
- **Keep upstream and product layers separated.** Add new files in `apps/web/src/features/` rather than editing upstream files directly when possible. `packages/content/` is a new v1 package for curated catalogue data and deterministic review rules; it does not exist upstream.
- **Environment variable discipline.** Any new variable in `packages/env/src/server.ts` must also be added to `turbo.json` `globalEnv`. Turborepo 2.x strict env mode filters out unlisted variables, making them `undefined` at runtime even when set in the shell.
- **Document every upstream modification.** If you must edit upstream code, add a comment and track it in `UPSTREAM-CHANGES.md`.
- **Never remove or hide copyright/license notices.** Add a `THIRD-PARTY-NOTICES.md` file.
- **No AGPL or proprietary code.** Only MIT-compatible open-source snippets, and only if small and self-contained.

### 6.2 No AI in MVP

- No LLM/embedding/generative service calls.
- No AI SDK or API keys committed.
- All assistance is deterministic: curated JSON catalogues, explicit rules, validated placeholders.

### 6.3 Content and templates

- Build the phrase/skill/template catalogue as **reviewed human content**, not AI output or copied competitor text.
- All templates are **original**; competitor sites are used for layout/category inspiration only.
- Arabic copy must be reviewed by a native speaker; never rely on machine translation for user-facing text.

### 6.4 Testing

- **Unit tests** for rules, validation, and catalogue lookups.
- **Integration tests** for save/load, export, and auth flows.
- **E2E tests** for the full 13-step user journey.
- **PDF snapshot tests** for every template × language.
- **Visual regression** for landing, editor, and export.
- **Accessibility audit** with automated tools and manual keyboard/screen-reader checks.
- **Performance budgets** tracked in CI.

### 6.5 Security and privacy

- CV data isolated per user; no user can access another's draft or PDF.
- Secrets in environment variables; no keys in Git.
- Rate limiting on auth and export endpoints.
- XSS/CSRF defenses from upstream retained and tested.
- Analytics must not include CV text or PII.

### 6.6 i18n and RTL

- Use the existing i18n system; add `ar-SA` and `en-US`/`en-GB` as launch locales.
- All UI strings externalized; no hardcoded English or Arabic in components.
- RTL layout tested at component and PDF levels.

### 6.7 Performance

- Lazy-load heavy editor features.
- Debounce preview updates.
- Client-side PDF generation; server only for persistence and auth.
- Image optimization for template previews and landing.

---

## 7. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Upstream HeadCV changes break our patches | High | Pin to stable tag; upgrade intentionally; document all upstream changes. |
| Template designs accidentally copy Resume.io/FlowCV | Legal / reputational | Use original design; run visual diff against competitor screenshots. |
| AGPL code enters repo through snippet copy | Legal | License audit in CI; only MIT-compatible snippets. |
| AI feature scope creep | Requirement failure | No AI keys in repo; automated scan for `openai`, `anthropic`, etc. imports. |
| Arabic RTL PDF regressions | Launch blocker | Snapshot tests for every template in Arabic; native copy review. |
| Performance budget breach | UX failure | CI performance gates; lazy loading; debounced preview. |
| Paywall surprise upsets users | Trust / conversion | Early disclosure and clear free/account/paid rules before setup. |

---

## 8. Success metrics

All targets below are sourced from `Doc/pack/user-stories.md` or `Doc/pack/requirements.md`. Funnel conversion percentages are not set in v1 requirements and will be defined after baseline analytics.

| Metric | Target | Source |
|---|---|---|
| Funnel conversion targets | TBD after baseline analytics |  |
| First PDF export p95 | <= 10s | User story M15 |
| Common save p95 | <= 500ms | User story M15 |
| Landing LCP p75 | <= 2.5s | User story M15 |
| WCAG 2.2 AA core flow | Pass | User stories M13, M14 |
| Arabic RTL PDF snapshot pass rate | 100% of launch templates | User story M13 |
| Zero AI/LLM calls in MVP | Verified in CI | Requirements MVP boundary |

---

## 9. Open decisions to resolve before Slice 1

From `Doc/pack/requirements.md` open questions:

| ID | Question | Recommended default | Status |
|---|---|---|---|
| Q1 | Is first PDF export free without an account? | Yes; offer account after download | Open |
| Q2 | What exactly is paid in MVP? | Nothing until flow conversion and rendering cost are measured | Open |
| Q3 | Are Arabic and English both launch requirements? | Yes | Open |
| Q4 | How many launch templates? | Six: three LTR and three RTL using shared design tokens | Open |
| Q5 | PDF only or PDF plus DOCX at launch? | PDF Must; DOCX Should | Open |
| Q6 | Should target job be required? | No; recommend it but allow `General CV` (default template, standard section order, and broadest curated phrase/skill catalogue) | Open |
| Q7 | When should account creation occur? | After first preview or export, never before builder | Open |
| Q8 | Which competitor flow is the closest benchmark? | Resume.io structure + Zety guidance + Kickresume analysis, without AI | Open |
| Q9 | Product name/domain | Decide after trademark/domain review | Open |
| Q10 | Physical feature branches | Initialize Git only after this requirements document is approved | Open |

---

## 10. Appendix: technology and data sources

### 10.1 Primary foundation

- `https://github.com/AHMED9937/headcv`

### 10.2 Competitor research references

- `https://resume.io`
- `https://flowcv.com`
- `https://zety.com`
- `https://enhancv.com`
- `https://kickresume.com`
- `https://canva.com/create/resumes`

### 10.3 Open-source references

- `https://github.com/xitanggg/open-resume` (AGPL  study only)
- `https://github.com/rendercv/rendercv` (Python  study only)
- `https://github.com/salomonelli/best-resume-ever` (Vue  study only)
- `https://github.com/sadanandpai/resume-builder` (Next.js  fallback only)
- `https://github.com/pdfme/pdfme` (generic PDF  not for MVP)
- `https://jsonresume.org` and `@jsonresume/theme-metadata` (schema reference)

### 10.4 License and legal notes

This plan is not legal advice. Retain all upstream copyright and license notices. Have legal counsel review the final distribution and service model before public launch.
