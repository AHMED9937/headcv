# Slice Backlog  Universal CV Builder v1

> Foundation: `AHMED9937/headcv` v5.1.6. Stack: Node.js 24, pnpm/Turborepo, TanStack Start + React 19, Hono, Better Auth, Drizzle ORM + PostgreSQL, React PDF, Lingui, Tailwind v4, Biome.

## How to read this backlog

> **Partial story coverage** in a slice means the slice implements only some of that story's acceptance criteria; the remaining criteria are covered by other slices or deferred to Should/Later.

| Field | Meaning |
|---|---|
| **ID** | Slice identifier for planning and branches. |
| **Goal** | One-sentence outcome. |
| **Stories covered** | User-story IDs from `user-stories.md`. |
| **Upstream reuse** | Packages, files, or patterns taken from the upstream foundation. |
| **What we build / adapt** | New code, configuration, or UX changes. |
| **Depends on** | Slices that must be accepted first. |
| **Riskiest assumption** | Biggest unknown the slice must prove or disprove. |
| **Definition of done** | Concrete evidence the slice is complete. |
| **Acceptance criteria** | Testable outcomes. |
| **Detailed tasks** | Granular checklist items. |
| **Deliverable** | Artifact produced for users or downstream slices. |
| **Verification** | How the team confirms success. |
| **Design/UX references** | Links to brand, style, and mock files. |
| **Technical references** | Links to ERD, technical-research, and upstream paths. |
| **Open questions / notes** | Pending decisions or blockers. |

## Walking skeleton (S0–S4)

The walking skeleton is the thinnest possible full product path: land, start, answer setup questions, choose a template, enter personal details, see a live preview, export a basic PDF, and create an account. It defers full content sections, deterministic review, RTL hardening, and launch QA until the core engine is proven.

The new `packages/content/` package is introduced in v1 for curated job-title, phrase, and skill catalogues plus deterministic review rules. It does not exist upstream and must follow the same export-map and boundary conventions as existing internal packages.

### S0  Foundation fork and team setup

- **Goal**
  A clean, reproducible fork of `AHMED9937/headcv` v5.1.6 with all AI/MCP integrations removed and every developer able to build, test, and export a PDF locally.

- **Stories covered**
  None directly; enables all downstream slices.

- **Upstream reuse**
  - `AHMED9937/headcv` v5.1.6 monorepo: `apps/web/`, `apps/server/`, `packages/db/`, `packages/pdf/`, `packages/ui/`, `packages/auth/`, `packages/schema/`.
  - `packages/db/src/schema/*`: Drizzle schema for `resume`, `user`, `session`.
  - `packages/pdf/`: `@react-pdf/renderer` templates and adapters.
  - `packages/auth/`: Better Auth and Drizzle adapter.
  - `packages/schema/src/resume/data.ts`: `ResumeData` Zod schema.

- **What we build / adapt**
  - Organization fork and protected baseline branch.
  - `THIRD-PARTY-NOTICES.md` with full license audit.
  - `.env` template and `docs/LOCAL-SETUP.md`.
  - AI/MCP removal plan and no-AI gate verification.
  - Baseline verification scripts.

- **Depends on**
  None.

- **Riskiest assumption**
  The upstream repo builds and exports a PDF on the team's environment without modifications.

- **Definition of done**
  Every developer can run `docker compose up`, create a guest CV, preview it, and export a PDF; the baseline branch is free of AI/MCP packages and keys; license audit and CI are green.

- **Acceptance criteria**
  - `pnpm install` and `docker compose up` succeed on a fresh clone.
  - Upstream Vitest suite passes (`pnpm test`).
  - At least one upstream template renders a PDF in English and Arabic sample data.
  - No imports remain for `ai`, `@ai-sdk/*`, `ollama-ai-provider-v2`, `@headcv/ai`, or `@headcv/mcp`.
  - No AI provider API keys are present in `.env.example` or committed code.
  - `THIRD-PARTY-NOTICES.md` lists all licenses.
  - `.env.example` documents `APP_URL`, `DATABASE_URL`, `AUTH_SECRET`, and optional categories.

- **Detailed tasks**
  - [ ] Fork `AHMED9937/headcv` v5.1.6 and create `chore/upstream-headcv-v5.1.6`.
  - [ ] Enable branch protection and required CI checks.
  - [ ] Run `corepack enable && pnpm install` and commit a stable lockfile.
  - [ ] Start the stack with `docker compose up` and verify `/api/health`.
  - [ ] Run upstream tests and record any failures in `docs/BASELINE-FAILURES.md`.
  - [ ] Audit dependencies and write `THIRD-PARTY-NOTICES.md`.
  - [ ] Remove `@headcv/ai` and `@headcv/mcp` packages and dependent imports.
  - [ ] Strip AI navigation, feature flags, API routes, and provider key env vars.
  - [ ] Add CI scan for forbidden AI imports (`openai`, `anthropic`, `@ai-sdk`, `ollama-ai-provider-v2`).
  - [ ] Verify the forbidden packages are removed from the dependency tree (run `pnpm why @headcv/ai` and `pnpm why @headcv/mcp`; CI should fail if either resolves).
  - [ ] Create `.env.example` and `docs/LOCAL-SETUP.md`.

- **Deliverable**
  Runnable local fork with AI disabled, license audit complete, baseline CI green.

- **Verification**
  Any developer follows `docs/LOCAL-SETUP.md` and completes `docker compose up` plus a guest PDF export.

- **Design/UX references**
  Not applicable.

- **Technical references**
  - `erd-mvp.md`  Better Auth baseline, `Resume`, `GuestSession` ownership.
  - `technical-research.md`  upstream foundation, monorepo architecture, AI/MCP removal.
  - Upstream: `package.json`, `Dockerfile`, `compose.dev.yml`, `packages/db/src/schema/*`.

- **Open questions / notes**
  - `Q10`: feature branches pending requirements approval.
  - `Q9`: product name and domain pending trademark/domain review.

### S1  Landing and guest start

- **Goal**
  Replace upstream branding with the HeadCV identity and build a landing page centered on one `Create my CV` CTA, honest commercial disclosure, and analytics privacy.

- **Stories covered**
  `M1`.

- **Upstream reuse**
  - `apps/web/src/routes/_layout/index.tsx` and `apps/web/src/router.tsx`.
  - `packages/ui/` buttons, cards, headers, language selector, form primitives.
  - Upstream Tailwind v4 / Base UI theme configuration and i18n loading.

- **What we build / adapt**
  - Promote frozen design tokens from `brand-and-style.md` and `html-mocks/styles.css` into the production theme.
  - New logo, favicon, app name, and marketing copy.
  - Landing page with one primary `Create my CV` CTA and a secondary `Sign in` link.
  - Early commercial disclosure block.
  - Analytics privacy guard that excludes CV text and PII from events.

- **Depends on**
  S0.

- **Riskiest assumption**
  Users understand the free/account/payment rules before starting and still click `Create my CV`.

- **Definition of done**
  Landing page is live, branded, responsive, accessible, and analytics-safe; CTA creates a guest session and routes to `/setup`.

- **Acceptance criteria**
  - One primary `Create my CV` action is visible above the fold on desktop and mobile.
  - `Sign in` is reachable but secondary and never required to reach the builder.
  - Free, account, and paid/export rules are disclosed before setup starts.
  - LCP p75 <= 2.5 s; Lighthouse performance and accessibility scores >= 90.
  - Analytics events exclude CV text, names, emails, phone numbers, and uploaded files.
  - Keyboard and screen-reader users can reach the CTA within one tab sequence.

- **Detailed tasks**
  - [ ] Promote `:root` tokens from `html-mocks/styles.css` into the Tailwind v4 / CSS theme.
  - [ ] Map semantic tokens from `brand-and-style.md`: `--primary` `#1e3a5f`, `--accent` `#c9a227`, `--bg` `#f5efe6`, `--surface` `#ffffff`, `--font-body` Inter, `--font-display` Playfair Display, `--font-arabic` Noto Sans Arabic.
  - [ ] Replace upstream logo, favicon, and app name with HeadCV assets.
  - [ ] Write landing copy using the calm, expert, non-technical voice from `brand-and-style.md`.
  - [ ] Build landing with one dominant `Create my CV` CTA and secondary `Sign in` link.
  - [ ] Add commercial disclosure block: free now, account required to save, paid tiers may come later.
  - [ ] Add language selector that sets i18n locale without sending personal data.
  - [ ] Implement responsive hero, navigation, and footer for desktop, tablet, and 360 px mobile.
  - [ ] Remove or hide upstream pre-auth dashboard choices and power-user chrome.
  - [ ] Implement analytics privacy check: hash or omit identifiers; never send CV text or PII.

- **Deliverable**
  Branded landing page with one CTA, honest disclosure, and analytics privacy.

- **Verification**
  Manual: landing renders, CTA creates a guest session, disclosure visible, Lighthouse meets targets, analytics payload contains no PII.

- **Design/UX references**
  - `brand-and-style.md`  voice, color, typography, motion, button/landing patterns.
  - `html-mocks/styles.css`  canonical `:root` token values.
  - `html-mocks/index.html`  landing structure and CTA placement.

- **Technical references**
  - `technical-research.md`  web app, TanStack Start, Tailwind v4, i18n, analytics notes.
  - Upstream: `apps/web/src/routes`, `apps/web/src/router.tsx`, `packages/ui/`.

- **Open questions / notes**
  - `Q2`: what is paid in MVP is still pending; disclosure should say 'paid tiers may be introduced later' if no decision exists.
  - `Q9`: product name/domain must be reflected in logo and copy once decided.

### S2  Quick setup and template choice

- **Goal**
  Capture language, target job, and experience level before the editor, then recommend up to three templates with a safe default and a full gallery fallback.

- **Stories covered**
  `M2`, `M3`.

- **Upstream reuse**
  - `packages/pdf/src/templates/index.ts` and `packages/schema/src/templates.ts` template registry.
  - Guest session/state management and local storage persistence from upstream.
  - `packages/ui/` form primitives, select/combobox, card, dialog components.
  - Existing i18n infrastructure.

- **What we build / adapt**
  - `apps/web/src/features/onboarding/` quick setup wizard.
  - 3-step setup form: CV language, target job, experience level.
  - Curated `JobTitle` dataset in `packages/content/` (Arabic + English).
  - Template recommendation rules and safe default logic.
  - Template gallery with category filters, previews, style badges, and Free/Paid state.
  - Setup choices persisted in the guest session.

- **Depends on**
  S1.

- **Riskiest assumption**
  A non-technical user can answer three simple questions and pick a template without choice overload.

- **Definition of done**
  A user completes setup, sees up to three recommended templates, picks one or uses the default, and enters the editor without losing content.

- **Acceptance criteria**
  - Setup asks exactly three questions: CV language, target job, experience level.
  - Target job has curated suggestions and a manual `General CV` fallback.
  - Product recommends up to three templates with one pre-selected safe default.
  - Category filters Simple, Professional, Modern, and Creative work.
  - Template cards show full-page preview, name, style, ATS-safe label, page behavior, and Free/Paid state.
  - Switching templates in the gallery updates preview without reordering or deleting content.
  - Setup answers are stored in the guest session and survive a browser refresh.
  - E2E test covers landing -> setup -> gallery -> editor.

- **Detailed tasks**
  - [ ] Create `apps/web/src/features/onboarding/` with `SetupPage` and `TemplateGalleryPage`.
  - [ ] Build 3-step setup form with language, target job, and experience level controls.
  - [ ] Add curated job-title JSON dataset in `packages/content/src/job-titles/` (English and Arabic).
  - [ ] Implement fuzzy job-title search using `fuse.js`.
  - [ ] Implement template recommendation logic based on job title, experience level, and language/direction.
  - [ ] Build template gallery with cards, full-page thumbnails, style badges, and Free/Paid labels.
  - [ ] Add category filters: Simple, Professional, Modern, Creative.
  - [ ] Pre-select a safe default template and allow `Use recommended`.
  - [ ] Ensure gallery selection updates client-side preview without persisting partial content.
  - [ ] Persist setup answers and selected template in guest session / local state.

- **Deliverable**
  Quick setup wizard and template gallery.

- **Verification**
  Manual and E2E: a user completes setup, sees three recommendations, picks a template, and lands in the editor with the correct language and direction.

- **Design/UX references**
  - `brand-and-style.md`  button, card, stepper, template-card patterns.
  - `html-mocks/setup.html` and `templates.html`.

- **Technical references**
  - `erd-mvp.md`  `GuestSession` and `Resume` ownership notes.
  - `technical-research.md`  template engine, i18n, form primitives.
  - Upstream: `packages/schema/src/templates.ts`, `packages/pdf/src/templates/index.ts`, `apps/web/src/routes`.

- **Open questions / notes**
  - `Q6`: target job should not be required; when skipped or unmatched, fall back to `General CV` (default template, standard section order, and broadest curated phrase/skill catalogue).
  - `Q4`: six launch templates expected; gallery must hide unfinished templates.

### S3  Personal details and live preview

- **Goal**
  Deliver the first content step as a guided personal-details form with a live side-by-side preview on desktop and Editor/Preview tabs on mobile, plus autosave and undo/redo.

- **Stories covered**
  `M4`, `M14` partial, `M15` partial.

- **Upstream reuse**
  - `apps/web/src/routes/builder/$resumeId` builder shell and route conventions.
  - `packages/schema/src/resume/data.ts`: `basics`, `summary`, metadata shape.
  - Upstream section editor, form fields, live preview engine, autosave, undo/redo.
  - `packages/ui/` inputs, file upload, and responsive layout primitives.

- **What we build / adapt**
  - 13-step stepper shell with named steps and completion state.
  - Personal details form: name, title, email, phone, location, optional photo, optional links.
  - Collapsed optional fields.
  - Mobile Editor/Preview tabs.
  - Autosave with Saving/Saved/Offline/Error states.

- **Depends on**
  S2.

- **Riskiest assumption**
  The live preview updates within 300 ms and feels credible to a non-technical user.

- **Definition of done**
  A user can enter personal details, see the preview update while typing, recover after refresh, and complete the step on a 360 px mobile device.

- **Acceptance criteria**
  - Desktop shows form and preview side by side; mobile uses persistent Editor/Preview tabs.
  - Preview updates within 300 ms for a typical CV after a field change.
  - Email, phone, and URL fields are validated inline.
  - Optional fields (photo, links) are collapsed by default.
  - Autosave shows Saving/Saved/Offline/Error states and retries on failure.
  - Refresh recovers the last saved state.
  - All 13 steps are visible in the stepper; required-field progress is reflected.
  - Touch targets and focus order meet WCAG 2.2 AA.

- **Detailed tasks**
  - [ ] Build stepper component with 13 named steps, completion state, and progress indicator.
  - [ ] Create `apps/web/src/features/builder/` shell with split-screen desktop layout and mobile Editor/Preview tabs.
  - [ ] Implement personal details form with name, title, email, phone, and location.
  - [ ] Collapse optional fields (photo, links) behind disclosure buttons.
  - [ ] Add email, phone, and URL validation with accessible error messages.
  - [ ] Wire live preview to `ResumeData.basics` changes with debounced updates.
  - [ ] Implement autosave using `PATCH /api/cv/:id` with Saving/Saved/Offline/Error badges.
  - [ ] Add undo/redo for the current session's content changes.
  - [ ] Implement photo upload with file-size and format limits.
  - [ ] Ensure preview works at 360 px viewport and on tablet.

- **Deliverable**
  Personal details step with live preview, autosave, and mobile support.

- **Verification**
  Manual: type name and title; preview updates within 300 ms; refresh restores data; mobile tabs function at 360 px.

- **Design/UX references**
  - `brand-and-style.md`  form, input, builder tabs, focus, responsive rules.
  - `html-mocks/wizard.html` and `builder.html`.

- **Technical references**
  - `erd-mvp.md`  `Resume.data` JSONB document shape.
  - `technical-research.md`  builder route, TanStack Start, Query, Form, preview engine.
  - Upstream: `apps/web/src/routes/builder/$resumeId`, `packages/schema/src/resume/data.ts`.

- **Open questions / notes**
  - `Q1`: first PDF export should remain free without an account in the walking skeleton.

### S4  Basic PDF export and delayed account

- **Goal**
  Let a guest export a basic PDF with a safe filename and clear disclosure, then prompt them to create an account after value, migrating the guest CV without data loss.

- **Stories covered**
  `M11`, `M12` partial, `M15` partial.

- **Upstream reuse**
  - `packages/pdf/`: `@react-pdf/renderer` browser/server adapters and template renderers.
  - Better Auth signup/login flows in `packages/auth/` and `apps/web/src/routes/auth/`.
  - Upstream guest mode, anonymous session handling, dashboard route, and resume list patterns.

- **What we build / adapt**
  - Export page with page preview, page count, A4/Letter toggle, and filename editor.
  - Filename sanitizer defaulting to `{Candidate Name} CV.pdf`.
  - Commercial disclosure and retry/duplicate-click protection.
  - Guest-to-account migration flow.
  - Dashboard shell: create, rename, edit, duplicate, archive, delete.
  - Private workspace enforcement.

- **Depends on**
  S3.

- **Riskiest assumption**
  The exported PDF matches the preview and guest data survives account creation.

- **Definition of done**
  A guest exports a PDF, sees it match the preview, is prompted to sign up, and finds the migrated CV in the dashboard after account creation.

- **Acceptance criteria**
  - PDF is text-selectable, searchable, correctly paginated, and visually matches the preview.
  - Default filename is `Candidate Name CV.pdf` with invalid characters sanitized.
  - Filename is editable before download.
  - Export rules are disclosed before download.
  - Typical PDF export p95 <= 10 s.
  - Hidden sections, examples, placeholders, target-job notes, internal IDs, and analytics data do not enter the exported file.
  - Account prompt appears only after first preview or export, never before the builder.
  - Guest data migrates to the new user in one transaction without loss or duplication.
  - A user cannot access another user's CV, preview, or export.

- **Detailed tasks**
  - [ ] Implement `/builder/export` route and export shell.
  - [ ] Integrate client-side PDF generation via `@headcv/pdf/browser`.
  - [ ] Build page preview thumbnails with page count and A4/Letter boundaries.
  - [ ] Implement safe filename default and sanitizer; expose editable filename input.
  - [ ] Add export disclosure block before download button.
  - [ ] Add progress indicator, retry button, and duplicate-click protection.
  - [ ] Implement plain-text preview of logical reading order before export.
  - [ ] Add export privacy filter that strips hidden sections, placeholders, target-job notes, and internal IDs.
  - [ ] Trigger account prompt after first preview or export with `Maybe later` and `Create account` options.
  - [ ] Wire Better Auth signup/login to `POST /api/cv/:id/migrate-to-user`.

- **Deliverable**
  Export flow with delayed account creation and a basic dashboard.

- **Verification**
  Manual: guest exports PDF, creates account, and sees CV in dashboard; export PDF matches preview; cross-user access is denied.

- **Design/UX references**
  - `brand-and-style.md`  export, auth, dashboard, empty-state patterns.
  - `html-mocks/export.html`, `auth.html`, `dashboard.html`.

- **Technical references**
  - `erd-mvp.md`  `Resume` nullable `userId`, `guestSessionId`, `ExportRecord`, `AuditLog`, migration ownership.
  - `technical-research.md`  PDF/export, Better Auth, storage, security.
  - Upstream: `packages/pdf/`, `packages/auth/`, `apps/web/src/routes/builder/$resumeId`, `apps/web/src/routes/dashboard/`.

- **Open questions / notes**
  - `Q1`: first PDF export is expected to be free without an account.
  - `Q7`: account prompt timing is after first preview or export.
  - DOCX export is out of scope for the walking skeleton.

## After the skeleton (S5–S11)

Once the walking skeleton proves the engine, we build outward. The order is dependency-first (content before review, templates before design) and risk-first (RTL, review, and launch QA are not left until the end).

### S5  Content builder sections

- **Goal**
  Complete the guided wizard for work experience, education, skills, summary, and optional sections with job-aware tips and curated, editable phrase patterns.

- **Stories covered**
  `M5`, `M6`, `M7`, `M8` partial.

- **Upstream reuse**
  - Upstream repeatable entries, drag-and-drop, section data model, rich text editor, mobile layout.
  - `packages/schema/src/resume/data.ts`: `experience`, `education`, `skills`, `summary`, and custom sections.
  - Upstream autosave and undo/redo patterns.

- **What we build / adapt**
  - Work experience form with repeatable roles, tips, and curated phrase patterns.
  - Education form with reorder-before-experience prompt for low-experience users.
  - Skills form with manual entry, search, categories, reorder, optional level, and job-title suggestions.
  - Summary builder with fill-in-the-blank formulas.
  - Additional sections adder (languages, certificates, courses, projects, volunteering, awards, publications, references, hobbies, internships, activities, custom).
  - Skip/Not applicable handling and last-incomplete-step resume logic.

- **Depends on**
  S3, S4.

- **Riskiest assumption**
  Job-title-filtered phrase patterns help users write better bullets without AI.

- **Definition of done**
  A user can complete every content step with inline tips and phrases; all sections render in the live preview and are persisted through autosave.

- **Acceptance criteria**
  - Work experience supports repeatable roles with job title, employer, location, dates, current flag, and bullets.
  - Job-title-filtered tips appear when a bullet field is focused.
  - Curated phrase patterns are searchable and editable; phrases with unresolved placeholders cannot be accepted.
  - Accepted text remains fully editable and the system never invents achievements or numbers.
  - Education supports reorder-before-experience for low-experience users after confirmation.
  - Skills support manual entry, search, categories, reorder, and optional levels; job-title suggestions appear unchecked.
  - Summary uses fill-in-the-blank formulas built only from user-selected facts.
  - Additional sections are optional and can be skipped; custom sections can be renamed.
  - Returning to the builder opens the last incomplete step.

- **Detailed tasks**
  - [ ] Implement work experience repeatable-role form.
  - [ ] Build curated phrase catalogue in `packages/content/src/phrases/` filtered by job title, section, and experience level.
  - [ ] Add phrase search and insertion UI inside the bullet field.
  - [ ] Implement placeholder detection that blocks acceptance until all named placeholders are resolved.
  - [ ] Add job-title-aware tips that appear on bullet focus.
  - [ ] Implement education form with institution, qualification, field, location, dates, and details.
  - [ ] Add confirmation prompt to reorder education before work experience for entry-level users.
  - [ ] Implement skills form with tag input, categories, reorder, and optional proficiency level.
  - [ ] Add job-title-filtered skill suggestion list; every suggestion is unchecked by default.
  - [ ] Implement summary builder with fill-in-the-blank prompts and assembled output.

- **Deliverable**
  Guided content builder with tips, phrases, skills, summary, and optional sections.

- **Verification**
  Manual: a non-technical user completes personal -> experience -> education -> skills -> summary -> additional; all sections appear in preview; autosave recovers after refresh.

- **Design/UX references**
  - `brand-and-style.md`  hints, skill pills, badges, toasts, wizard shell.
  - `html-mocks/wizard.html`.

- **Technical references**
  - `erd-mvp.md`  `Phrase`, `Skill`, `JobTitle` catalogue tables; `Resume.data` sections.
  - `technical-research.md`  content package conventions and validation rules.
  - Upstream: `packages/schema/src/resume/data.ts`, `apps/web/src/routes/builder/`.

- **Open questions / notes**
  - `Q6`: keep target job optional; fall back to `General CV` tips and phrases.

### S6  Section controls and safe reordering

- **Goal**
  Let users add, edit, duplicate, hide, delete, rename, and reorder sections safely without breaking the document or losing content when switching templates.

- **Stories covered**
  `M8`.

- **Upstream reuse**
  - Upstream section editor and drag-and-drop reordering using `@dnd-kit`.
  - `packages/schema/src/resume/data.ts`: section metadata and `customSections`.
  - Upstream hide/show and section title editing patterns.

- **What we build / adapt**
  - Safe section controls with keyboard alternatives.
  - Section persistence across template switches.
  - Duplicate and rename behavior that never rewrites user content.
  - Hidden-section privacy filter for export.

- **Depends on**
  S5.

- **Riskiest assumption**
  Template and design changes never delete, rewrite, or reorder user content.

- **Definition of done**
  All section operations work; switching templates preserves order and content; hidden sections never appear in export.

- **Acceptance criteria**
  - User can add, edit, duplicate, hide, delete, rename, and reorder sections.
  - Reordering supports drag-and-drop and keyboard buttons.
  - No free-position text boxes or graphics are allowed.
  - Content stays in semantic sections.
  - Template and design changes preserve both section order and content.
  - Hidden sections are preserved but not shown in preview or export.
  - Duplicate creates an independent copy.
  - Rename applies only to supported sections and updates labels without changing data keys.

- **Detailed tasks**
  - [ ] Implement add/edit/duplicate/hide/delete/rename/reorder UI for every supported section.
  - [ ] Integrate `@dnd-kit` drag-and-drop for section and item reordering.
  - [ ] Add keyboard-only reorder buttons as an accessible alternative to drag.
  - [ ] Persist section order in `Resume.data.metadata.layout` or equivalent field.
  - [ ] Implement hidden-section state and ensure hidden sections are excluded from preview and PDF export.
  - [ ] Add duplicate-section logic that deep-clones section data with a new internal key.
  - [ ] Implement safe rename that updates display labels only and preserves data keys.
  - [ ] Add migration safeguard for unsupported or legacy section types.
  - [ ] Verify that switching templates after reordering restores the same order.
  - [ ] Wire section controls into undo/redo history.

- **Deliverable**
  Safe section controls with keyboard alternatives and template-switch preservation.

- **Verification**
  Manual: reorder sections, hide one, duplicate another, switch templates, and confirm content/order survive.

- **Design/UX references**
  - `brand-and-style.md`  drag alternatives, focus, button patterns.
  - `html-mocks/builder.html`.

- **Technical references**
  - `erd-mvp.md`  `Resume.data` JSONB holds sections, ordering, and hidden flags.
  - `technical-research.md`  `@dnd-kit` and UI stack.
  - Upstream: `packages/schema/src/resume/data.ts`, `apps/web/src/features/resume/`.

- **Open questions / notes**
  - None.

### S7  Arabic/RTL and original 6 templates

- **Goal**
  Make the product fully usable in Arabic and English with six original, RTL-ready launch templates (3 LTR, 3 RTL) built from the HeadCV design system.

- **Stories covered**
  `M3` partial, `M10` partial, `M13`.

- **Upstream reuse**
  - `packages/pdf/src/templates/`: PDF template contract, style rules, A4/Letter support, RTL helpers.
  - `packages/pdf/src/templates/shared/rtl.ts` for RTL layout utilities.
  - Upstream `ar-SA.po` locale and RTL test fixtures.
  - `@react-pdf/renderer` font registration and fallback patterns.

- **What we build / adapt**
  - Six original templates: Simple ATS, Professional, Modern for LTR; matching three for RTL.
  - Shared design-token system for PDF and web.
  - Arabic font embedding (`Noto Sans Arabic`).
  - Arabic UI copy and phrase review.
  - RTL snapshot tests for all template x language combinations.

- **Depends on**
  S4, S5, S6.

- **Riskiest assumption**
  Arabic text, dates, punctuation, and section order render correctly in preview and PDF.

- **Definition of done**
  Snapshot tests pass for all six templates in English and Arabic; a native speaker signs off all Arabic UI strings and phrase content.

- **Acceptance criteria**
  - Six original templates exist: 3 LTR, 3 RTL.
  - Templates use shared design tokens and do not copy competitor assets.
  - Arabic preview, controls, section order, punctuation, and dates render correctly.
  - Arabic PDF is text-selectable and correctly laid out.
  - `Noto Sans Arabic` is embedded or falls back gracefully.
  - Date formats adapt to locale.
  - Arabic UI strings, tips, and phrase patterns are reviewed by a native speaker.
  - Language switch warns and preserves translatable content.
  - Snapshot tests pass for 12 combinations (6 templates x 2 languages).

- **Detailed tasks**
  - [ ] Create `packages/content/src/templates/metadata.ts` with launch template specs.
  - [ ] Build 3 LTR templates: Simple ATS, Professional, Modern.
  - [ ] Build 3 RTL templates using the same categories and layout mirrors.
  - [ ] Promote tokens from `brand-and-style.md` and `html-mocks/styles.css` into the PDF theme config.
  - [ ] Register `Noto Sans Arabic` in `packages/pdf/src/` and apply it for Arabic text.
  - [ ] Implement RTL-safe punctuation, date formatting, and section-order mirroring.
  - [ ] Flip directional icons in RTL via `transform: scaleX(-1)` or asset swap.
  - [ ] Review and localize all Arabic UI strings, tips, and phrase patterns with a native speaker.
  - [ ] Update template gallery to show only v1 templates and mark direction/style.
  - [ ] Add PDF snapshot tests for every template in English and Arabic.

- **Deliverable**
  Six original, RTL-ready launch templates with Arabic/English parity.

- **Verification**
  Automated snapshot diffs pass for all 12 combinations; native Arabic review is signed off; manual Arabic export matches preview.

- **Design/UX references**
  - `brand-and-style.md`  color, typography (`--font-arabic`), spacing, shadows, RTL rules.
  - `html-mocks/styles.css`  `:root` tokens and `[dir='rtl']` overrides.
  - `html-mocks/templates.html`.

- **Technical references**
  - `technical-research.md`  PDF/RTL, fonts, Lingui, snapshot tests.
  - `erd-mvp.md`  `Resume.data` metadata stores template, locale, and direction.
  - Upstream: `packages/pdf/src/templates/`, `packages/pdf/src/templates/shared/rtl.ts`, `packages/fonts/`.

- **Open questions / notes**
  - `Q3`: Arabic/English are treated as launch requirements.
  - `Q4`: six templates are the launch target; additional templates are deferred to **Should requirement S4** (more templates).

### S8  Design customization

- **Goal**
  Let users change template, accent color, font set, text scale, density, divider style, and paper size within tested, readable limits.

- **Stories covered**
  `M10`.

- **Upstream reuse**
  - Upstream color, font, spacing, and page-size controls.
  - `packages/schema/src/resume/data.ts`: `metadata.design` and `metadata.page`.
  - `packages/pdf/src/templates/`: template rendering contract.

- **What we build / adapt**
  - Template selector with safe switching.
  - Design panel with accent, font set, text scale, density, divider, and A4/Letter controls.
  - Readable-limit guards for contrast, font size, and margins.
  - Mobile design panel in a collapsible tab.

- **Depends on**
  S7.

- **Riskiest assumption**
  Design changes update the preview instantly but never break content or section order.

- **Definition of done**
  All design controls work; the system rejects or warns against unsafe contrast, font size, or paper-size combinations.

- **Acceptance criteria**
  - Controls available for template, accent, font set, text scale, density, divider style, and A4/Letter.
  - Template change updates preview without losing content or section order.
  - Color, font, density, and paper-size changes update preview in real time.
  - System prevents clipped text, unreadable font size, unsafe contrast, and content outside margins.
  - Unsafe combinations are rejected or clearly warned.
  - Mobile design controls live in a collapsible panel or tab.
  - Design changes are autosaved and reversible.

- **Detailed tasks**
  - [ ] Build `/builder/design` route and design panel UI.
  - [ ] Implement template selector with live preview and content preservation.
  - [ ] Add accent-color picker limited to the brand palette from `brand-and-style.md`.
  - [ ] Add font-set selector using tested font pairings (`--font-body`, `--font-display`, `--font-arabic`).
  - [ ] Add text-scale and density controls with minimum readable-size guardrails.
  - [ ] Add divider-style toggle.
  - [ ] Add A4/Letter paper-size toggle.
  - [ ] Implement contrast and font-size validation before applying changes.
  - [ ] Wire all design controls to `Resume.data.metadata` and autosave.
  - [ ] Add mobile collapsible design panel inside the builder tabs.

- **Deliverable**
  Design customization panel with readable-limit guards.

- **Verification**
  Manual: change template, accent, font, density, paper size; confirm content/order survive and unsafe choices are blocked.

- **Design/UX references**
  - `brand-and-style.md`  tokens, color usage, typography, contrast, safe-customization rules.
  - `html-mocks/styles.css`  `:root` design tokens.
  - `html-mocks/design.html`.

- **Technical references**
  - `erd-mvp.md`  `Resume.data` stores design metadata.
  - `technical-research.md`  PDF template contract and rendering.
  - Upstream: `packages/schema/src/resume/data.ts`, `packages/pdf/src/templates/`.

- **Open questions / notes**
  - `Q5`: DOCX export is a Should and must not block this slice; PDF remains the only launch export.

### S9  Deterministic CV review

- **Goal**
  Build the `Improve CV` checklist with transparent, rule-based findings that link directly to the fields that need fixing.

- **Stories covered**
  `M9`.

- **Upstream reuse**
  - `packages/schema/src/resume/data.ts`: section metadata and field paths.
  - Upstream validation utilities and form focus/navigation patterns.
  - Upstream i18n strings and section title localization.

- **What we build / adapt**
  - `packages/content/src/rules/` deterministic rule engine.
  - `apps/web/src/features/review/` review panel UI.
  - Grouped findings with rule explanations and direct fix links.
  - Dictionary-based spelling checks for English and Arabic.
  - Page-overflow and privacy-rule detection.

- **Depends on**
  S5, S6.

- **Riskiest assumption**
  Rule-based findings are accurate and useful enough that users act on them before export.

- **Definition of done**
  All rule tests pass in English and Arabic; selecting a finding focuses the exact field and returning preserves the review position.

- **Acceptance criteria**
  - Review panel opens from the `Review` step or an `Improve CV` button.
  - Findings are grouped by section and each explains the rule.
  - Clicking a finding focuses the exact field; returning preserves review scroll position.
  - Checks cover missing data, impossible dates, unresolved placeholders, duplicates, long bullets, spelling, missing contact, page overflow, and privacy warnings.
  - Status is Passed/Improve/Review, not an opaque ATS score or job probability.
  - All checks are deterministic; no AI/LLM calls.
  - Review updates in real time as issues are fixed.
  - User can export after seeing the checklist.

- **Detailed tasks**
  - [ ] Create `packages/content/src/rules/` with a pure rule engine operating on `ResumeData`.
  - [ ] Implement empty required-data rule (name, email, phone, at least one role or education).
  - [ ] Implement impossible/illogical date rule (end before start, future dates).
  - [ ] Implement unresolved-placeholder rule for accepted phrase patterns.
  - [ ] Implement duplicate-skill and duplicate-bullet detection.
  - [ ] Implement long-bullet rule with word-count thresholds.
  - [ ] Implement dictionary-based spelling checks for English and Arabic.
  - [ ] Implement missing-contact, page-overflow, and privacy-warning rules.
  - [ ] Build `Improve CV` panel with grouped findings, rule explanation, and direct fix links.
  - [ ] Add focus management so selecting a finding scrolls the editor to the field.

- **Deliverable**
  Deterministic `Improve CV` review panel.

- **Verification**
  Manual: introduce a bad date, missing email, and long bullet; confirm each appears as a finding, clicking it focuses the field, and fixing it clears the finding.

- **Design/UX references**
  - `brand-and-style.md`  review findings, badge, score-bar patterns.
  - `html-mocks/review.html`.

- **Technical references**
  - `erd-mvp.md`  `ResumeReview` table stores deterministic findings.
  - `technical-research.md`  validation, no-AI gate, testing.
  - Upstream: `packages/schema/src/resume/data.ts`, `apps/web/src/features/resume/`.

- **Open questions / notes**
  - Spelling dictionaries must be curated or open-source and MIT-compatible; no cloud spell-check API.
  - Page-overflow detection may need iteration on thresholds once real templates are loaded.

### S10  Accessibility and mobile polish

- **Goal**
  Make the core flow accessible and reliable on desktop, tablet, and mobile, including keyboard-only and screen-reader users.

- **Stories covered**
  `M14`.

- **Upstream reuse**
  - Upstream accessibility patterns in `packages/ui/` components.
  - Existing responsive layout and RTL fixtures.
  - Upstream ARIA labels and focus management where present.

- **What we build / adapt**
  - WCAG 2.2 AA fixes for all 13 steps.
  - Keyboard alternatives for drag actions and template selection.
  - Screen-reader labels for icons, colors, preview, and section controls.
  - Focus management across stepper, review links, and mobile tabs.
  - 360 px mobile QA runbook.

- **Depends on**
  S3, S5, S6, S7, S8, S9.

- **Riskiest assumption**
  A screen-reader or keyboard-only user can complete the entire core flow.

- **Definition of done**
  Automated accessibility audit passes for the core flow; manual keyboard and screen-reader walkthrough passes; mobile QA passes at 360 px.

- **Acceptance criteria**
  - Core flow meets WCAG 2.2 AA for contrast, focus, labels, and error recovery.
  - Every drag action has a keyboard alternative.
  - Every icon, color, and preview action has a text or keyboard alternative.
  - Focus order follows visual order in LTR and RTL.
  - All 13 steps are usable at a 360 px viewport.
  - Zoom to 400% does not break layout or hide critical actions.
  - `prefers-reduced-motion` disables non-essential motion.
  - Touch targets are at least 44 px.

- **Detailed tasks**
  - [ ] Run automated accessibility audit on every route and fix high-severity issues.
  - [ ] Add `aria-label`, `aria-describedby`, and `aria-live` regions to autosave, toasts, and review score changes.
  - [ ] Ensure every icon button has an accessible name.
  - [ ] Replace drag-only interactions with keyboard reorder buttons and focusable handles.
  - [ ] Implement focus management when navigating between wizard steps and review findings.
  - [ ] Add skip-to-content link on builder and landing pages.
  - [ ] Verify heading hierarchy (`h1` through `h4`) on every screen.
  - [ ] Test full flow at 360 px using device emulation and a real mobile browser.
  - [ ] Test LTR and RTL layouts at mobile width.
  - [ ] Verify `prefers-reduced-motion` disables page entrance, confetti, spinner, and bouncing-dot animations.

- **Deliverable**
  Accessible and mobile-polished core flow.

- **Verification**
  Automated a11y report has zero critical/serious issues; manual keyboard and screen-reader walkthroughs pass; mobile QA checklist is signed off.

- **Design/UX references**
  - `brand-and-style.md`  accessibility, focus, RTL, touch targets, reduced motion.
  - `html-mocks/` across all screens.

- **Technical references**
  - `technical-research.md`  UI stack, testing, responsive patterns.
  - Upstream: `packages/ui/`, `apps/web/src/features/resume/`.

- **Open questions / notes**
  - Screen-reader testing should include Arabic to verify reading order and pronunciation cues.

### S11  Performance, security, analytics, and launch QA

- **Goal**
  Harden the product so it meets quality baselines and is ready for public launch.

- **Stories covered**
  `M15`, `M16`, `M17`.

- **Upstream reuse**
  - Upstream test setup (Vitest, happy-dom, coverage).
  - Upstream security middleware and rate-limit helpers in `packages/api/`.
  - Upstream i18n tests and RTL fixtures.

- **What we build / adapt**
  - Performance budgets and CI gates.
  - Security hardening review and pen-test checklist.
  - Cross-browser test matrix.
  - Analytics privacy verification and event taxonomy.
  - Launch runbook with deployment, rollback, and monitoring.

- **Depends on**
  S0–S10.

- **Riskiest assumption**
  The product is fast, secure, and private enough to launch.

- **Definition of done**
  Performance budgets are met, security review passes, full E2E suite is green, and legal review is complete.

- **Acceptance criteria**
  - Landing p75 LCP <= 2.5 s.
  - Common save p95 <= 500 ms.
  - Typical PDF export p95 <= 10 s.
  - Server authorization and validation run on every API call.
  - CSRF and XSS defenses are in place and tested.
  - Secure session cookies with appropriate expiry.
  - Rate limits exist on auth and export endpoints.
  - Private logs do not contain CV text or PII.
  - Encryption in transit and at rest is confirmed.
  - Analytics events exclude CV text, names, emails, phone numbers, and uploaded files.
  - Analytics consent is obtained where required.
  - App works in current and previous Chrome, Edge, Firefox, and Safari.
  - Full E2E suite passes.
  - `THIRD-PARTY-NOTICES.md`, ToS, and privacy policy are reviewed by legal counsel.

- **Detailed tasks**
  - [ ] Define performance budgets in CI (LCP, save latency, export latency) and fail builds that breach them.
  - [ ] Optimize landing LCP: image formats, preload critical fonts, reduce render-blocking resources.
  - [ ] Debounce preview updates and lazy-load heavy editor features.
  - [ ] Add server-side request validation on every `PATCH`, `POST`, and `DELETE` endpoint.
  - [ ] Add CSRF tokens and verify XSS headers/content policies.
  - [ ] Configure secure, `HttpOnly`, `SameSite` session cookies with appropriate expiry.
  - [ ] Add rate limiting to auth (`/api/auth/*`) and export (`/api/cv/:id/export/*`) endpoints.
  - [ ] Audit all server logs and ensure no CV text or raw PII is written.
  - [ ] Confirm TLS in transit and encryption at rest for database and storage.
  - [ ] Finalize analytics event taxonomy; verify every event payload excludes CV text and PII.

- **Deliverable**
  Launch-ready application with performance, security, and analytics privacy baselines met.

- **Verification**
  CI green on performance, security scan, a11y, and E2E; security review signed off; legal review signed off.

- **Design/UX references**
  Not applicable.

- **Technical references**
  - `technical-research.md`  DevOps, security, performance, analytics, testing.
  - `erd-mvp.md`  security review notes, `AuditLog`, ownership, rate limiting.
  - `../../implementation-plan.md`  success metrics and open decisions.

- **Open questions / notes**
  - `Q1` through `Q10` remain open; unresolved items must be documented in the launch runbook and not silently decided in code.

## Cross-cutting concerns

### Security & privacy
- Enforce CV ownership on every read/write: caller must own `userId` or `guestSessionId` on the `Resume` row.
- Never store CV text, raw PII, or export file content in `AuditLog` or analytics events.
- Use signed, short-lived URLs for uploaded photos and exported files.
- Apply rate limiting to auth and export endpoints.
- Keep secrets in environment variables; run a pre-commit scan for API keys and model SDKs.
- Use CSRF tokens, XSS headers, secure session cookies, and server-side validation.
- Follow ownership and cascade rules in `erd-mvp.md`.

### i18n & RTL
- Launch locales are English (`en-US`/`en-GB`) and Arabic (`ar-SA`).
- Externalize all UI strings, tips, errors, and phrase patterns via Lingui; no hardcoded English or Arabic in components.
- Use `Noto Sans Arabic` for Arabic body and headings.
- Apply `[dir='rtl']` overrides for layout, icon mirroring, and toast positioning from `html-mocks/styles.css`.
- Arabic dates, punctuation, and section order must be reviewed by a native speaker.
- Date and number formatting must adapt to the active locale.

### Analytics & privacy
- Track only step completion, template selection, section usage, review findings count, export success, and account conversion.
- Hash or omit identifiers; never send CV text, names, emails, phone numbers, locations, or uploaded files.
- Document the event taxonomy before launch.
- Obtain consent where required and honor opt-out.

### Performance budgets
- Landing p75 LCP <= 2.5 s.
- Common save p95 <= 500 ms.
- Typical PDF export p95 <= 10 s.
- CI gates must fail builds that breach these budgets on representative test fixtures.

### Testing strategy
- Unit tests for rules, validation, catalogue lookups, and pure resume helpers.
- Integration tests for autosave, export, auth, and guest-to-account migration.
- PDF snapshot tests for every template x language combination.
- Visual regression for landing, builder, and export screens.
- Automated accessibility audit plus manual keyboard and screen-reader walkthrough.
- E2E tests covering the full 13-step guest journey in English and Arabic.

### DevOps & deployment
- Use the upstream multi-stage `Dockerfile` and `compose.dev.yml`.
- Run Drizzle migrations on startup in production.
- Expose `/api/health` and Docker healthchecks for all services.
- Add new environment variables to `packages/env/src/server.ts` and `turbo.json` `globalEnv`.
- Run `pnpm exec turbo boundaries` in CI to catch cross-package violations.
- Run `pnpm check` (Biome) and `lefthook` on every commit.
- Keep `@headcv/ai` and `@headcv/mcp` out of the v1 build.

## Riskiest assumptions summary table

| Assumption | Slice that tests it | Signal that disproves it | Mitigation |
|---|---|---|---|
| Upstream repo builds and exports PDF on team's stack. | S0 | Cannot build, tests fail, or PDF export fails. | Pin to stable tag; reproducible Docker setup; baseline scripts. |
| Non-technical users start guest flow from one CTA. | S1 | Low click-through on `Create my CV`. | A/B test copy and placement; simplify landing; clarify disclosure. |
| Three setup questions recommend a useful template. | S2 | Users abandon at setup or skip recommendations. | Allow `General CV` fallback; reduce questions; improve rules. |
| Live preview feels instant and credible. | S3 | Preview lag > 300 ms or users do not trust it. | Debounce updates; skeleton states; simple default template. |
| Guest data survives account creation. | S4 | Data loss on signup or users refuse to create account. | One-transaction migration; E2E coverage; `Maybe later` option. |
| Phrase patterns help users write better bullets without AI. | S5 | Low phrase usage or high placeholder acceptance. | Improve catalogue quality; strengthen tips; show examples. |
| Section operations and template switches never break content. | S6 | Content lost on reorder, duplicate, or template switch. | Immutable operations; content-preservation tests; undo/redo. |
| Arabic/RTL renders correctly in preview and PDF. | S7 | Arabic layout breaks, dates/punctuation wrong, or overflow. | Native copy review; PDF snapshot tests; fallback fonts. |
| Design changes update preview instantly without breaking layout. | S8 | Content breaks or unsafe contrast/font combinations allowed. | Readable-limit guards; real-time validation; snapshot tests. |
| Deterministic review findings are useful. | S9 | Users ignore findings or false positives are high. | Tune thresholds; explain rules; link findings to exact fields. |
| Screen-reader or keyboard-only user can complete the entire flow. | S10 | Automated audit fails or manual walkthrough blocked. | Fix audit issues; add keyboard alternatives; test with assistive tech. |
| Product is fast, secure, and private enough to launch. | S11 | Performance budgets breached, vulnerabilities found, or PII in analytics. | CI gates; security review; load tests; analytics event audit. |

## Suggested branch names

| Slice | Branch |
|---|---|
| S0 | `chore/upstream-headcv-v5.1.6` |
| S1 | `feat/landing-and-guest-start` |
| S2 | `feat/quick-setup-template-recommendation` |
| S3 | `feat/personal-details-live-preview` |
| S4 | `feat/basic-export-guest-to-account` |
| S5 | `feat/content-builder-sections` |
| S6 | `feat/section-controls-reorder` |
| S7 | `feat/arabic-rtl-original-templates` |
| S8 | `feat/design-customization` |
| S9 | `feat/deterministic-cv-review` |
| S10 | `feat/accessibility-mobile-polish` |
| S11 | `feat/performance-security-launch-qa` |

## Change log

| Date | Version | Author | Change |
|---|---|---|---|
| 2026-08-18 | 0.1.0 | data-modeler | Expanded backlog based on ../../implementation-plan.md, requirements, user-stories, user-flows, ERD, technical-research, and upstream `AHMED9937/headcv` v5.1.6. |
