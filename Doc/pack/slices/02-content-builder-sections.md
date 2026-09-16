# Slice 5  Content Builder Sections

## One-sentence summary

Complete the guided 13-step wizard for work experience, education, skills, summary, and optional sections with deterministic job-title tips and curated, editable phrase patterns  all without AI-generated text.

## Scope and prompt hats

This slice is mostly front-end and domain-logic work with a new internal content-catalogue package. It follows these hats from `prompts-playbook.md`:

- `BUILD-01: Data`  curated job-title, phrase, and skill catalogues in `packages/content/`.
- `BUILD-02: Security`  resume ownership on every `PATCH`, redaction of CV text/PII from analytics, deterministic-only guidance (no AI).
- `BUILD-03: Backend`  Hono / oRPC procedures for content lookup and CV updates; ownership checks; optional seed endpoints for catalogue fixtures.
- `BUILD-04: Frontend`  stepper shell, section forms, phrase picker, skill suggestions, summary builder, responsive + accessible UI.
- `SHIP-01: Test`  unit tests for catalogue filtering and placeholder rules, component tests for forms, E2E for the content steps.

## Inputs from the pack

- `slice-backlog.md`  S5 goal, acceptance criteria, and detailed tasks (authoritative for this slice).
- `user-stories.md`  `M5`, `M6`, `M7`, and `M8` acceptance criteria.
- `erd-mvp.md`  `Resume.data` JSONB shape, `JobTitle`, `Phrase`, `Skill` table notes, and ownership rules.
- `brand-and-style.md`  voice, form, hint, badge, skill-pill, wizard, and accessibility patterns.
- `technical-research.md`  builder route, TanStack Start, form primitives, no-AI gate.
- `implementation-plan.md`  13-step flow, phrase catalogue, summary formulas, skill suggestions.
- `apps/web/src/routes/builder/$resumeId/`  existing builder shell and section editors to adapt.
- `packages/schema/src/resume/data.ts`  section schemas.

## Goal

Deliver the guided content steps of the CV builder so a non-technical user can add work experience, education, skills, a summary, and optional sections with deterministic job-title tips and curated phrase patterns, then see every change reflected in the live preview and persisted by autosave.

## Stories covered

- `M5  Add work experience with guided tips`
- `M6  Add education and relevant skills`
- `M7  Complete summary and optional sections`
- `M8  Reorder and manage sections safely` (partial: add, hide, skip, custom rename; full reorder/duplicate is S6)

## Depends on

- `S3  Personal Details and Live Preview` (builder shell, autosave, side-by-side preview).
- `S4  Basic PDF Export and Delayed Account` (guest-to-user migration and dashboard basics; content steps assume the same autosave/PATCH flow).

## Riskiest assumption

Job-title-filtered phrase patterns and tips help users write better bullets without relying on AI; if users ignore the phrases or accept placeholders without editing, the guidance becomes noise.

## What we build / adapt

### Phase 0  Bootstrap `packages/content` (`BUILD-01: Data`)

1. Create the internal `packages/content` package following the monorepo export-map conventions (no `dist` assumption).
   - `packages/content/package.json` with exports for `./job-titles`, `./phrases`, `./skills`, and `./utils`.
   - `packages/content/tsconfig.json` aligned with `packages/config/tsconfig` presets.
2. Add curated catalogue data as typed JSON fixtures:
   - `packages/content/src/job-titles/en.json` and `ar.json`: id, title, experience levels, category.
   - `packages/content/src/phrases/en.json` and `ar.json`: id, section type (`experience`, `summary`), job-title ids, experience levels, pattern text, placeholder names.
   - `packages/content/src/skills/en.json` and `ar.json`: id, name, Arabic name, category, job-title ids, experience levels.
3. Add pure lookup helpers in TypeScript:
   - `getJobTitles(locale)` / `searchJobTitles(query, locale)` using `fuse.js` (installed as package dep).
   - `getPhrases({ sectionType, jobTitleId, experienceLevel, locale })`.
   - `getSkills({ jobTitleId, experienceLevel, locale })`.
   - `resolvePlaceholders(pattern, values)` and `listUnresolvedPlaceholders(pattern)`.
4. Enforce no-AI boundary: this package contains only curated, human-written patterns; no SDK imports for generative models.
5. Run `pnpm exec turbo boundaries` after adding the package to confirm it is only consumed by allowed apps/packages.

### Phase 1  13-step stepper shell (`BUILD-04: Frontend`)

1. Build or finalize `apps/web/src/features/builder/stepper.tsx`:
   - 13 named steps: Setup, Template, Personal Details, Work Experience, Education, Skills, Summary, Additional Sections, Review, Design, Export, Save Account.
   - Visual completion state per step based on required-field presence.
   - Progress indicator and mobile truncation (e.g., current + next/prev labels).
2. Integrate the stepper into `apps/web/src/routes/builder/$resumeId/route.tsx` without breaking the existing three-panel layout.
3. Add "last incomplete step" resume logic:
   - On entering the builder, redirect to the earliest step that is not fully completed.
   - Store the current step in URL state so refresh returns to the same step.
4. Add `Skip / Not applicable` handling:
   - Each content step exposes a non-destructive skip action.
   - Skipped steps are marked visually and can be reopened later.
5. Add `Continue` / `Back` navigation that updates the URL and autosaves before leaving.

### Phase 2  Work experience with tips and phrases (`BUILD-04: Frontend`)

1. Adapt the existing experience section editor at `apps/web/src/routes/builder/$resumeId/-sidebar/left/sections/experience.tsx` to the stepper-driven personal-details → work-experience flow.
2. Keep repeatable roles (company-level entry with nested roles) from upstream, but default to a single role for first-time users.
3. Add job-title-aware tips:
   - When the target job title is set in the guest session / resume metadata, show contextual tips below the bullet field.
   - Fallback to "General CV" tips when no target job title exists (`Q6`).
   - Tips are deterministic strings from `packages/content` only.
4. Add phrase pattern picker inside the bullet rich-text field:
   - Trigger button or slash-command popover near the bullet editor.
   - Search phrases by job title and section type.
   - Show preview of the pattern with highlighted placeholders.
5. Enforce placeholder resolution before acceptance:
   - A phrase cannot be inserted while named placeholders (e.g., `[Metric]`, `[Action]`) remain unresolved.
   - User edits replace placeholders with their own facts; the system never invents achievements, numbers, or skills.
6. Ensure inserted text is fully editable HTML via the existing `RichInput` (TipTap).
7. Add inline date validation:
   - End date before start date is rejected.
   - "Current role" hides the end-date field.
8. Add analytics events (privacy-safe): `section_started`, `tip_viewed`, `phrase_inserted`, `placeholder_resolved`  no CV text, names, or numbers.

### Phase 3  Education and skills (`BUILD-04: Frontend`)

1. Adapt the existing education section editor at `apps/web/src/routes/builder/$resumeId/-sidebar/left/sections/education.tsx`:
   - Fields: institution, qualification/degree, field, location, dates, details.
   - Repeatable entries with reorder via existing `Reorder.Group`.
2. Add "education before experience" prompt:
   - If setup experience level is `entry` and the user has at least one education entry but no experience, show a one-time confirmation to move the Education section before Work Experience in the layout.
   - Only reorder after explicit user confirmation; never auto-reorder.
3. Adapt the existing skills section editor at `apps/web/src/routes/builder/$resumeId/-sidebar/left/sections/skills.tsx`:
   - Manual skill entry with tag input.
   - Optional proficiency level (0–5 or descriptive).
   - Category assignment and manual reorder.
4. Add job-title-filtered skill suggestions:
   - Suggestion list appears unchecked by default.
   - User must explicitly check each skill to add it to the CV.
   - Suggested skills never auto-appear in the preview or data model.
   - Duplicate prevention: warn or silently deduplicate by normalized name.
5. Skills must remain fully editable after insertion.

### Phase 4  Summary builder (`BUILD-04: Frontend`)

1. Create `apps/web/src/features/builder/summary-builder.tsx` (or adapt `summary.tsx`):
   - Fill-in-the-blank formula assembled from user-selected facts (e.g., years of experience, top skill, target role).
   - User reviews and edits the assembled summary before saving.
   - Skip button is always available.
2. Pull facts from existing data where possible (experience dates, skills, target job title) rather than asking new questions.
3. Store the final summary as HTML in `Resume.data.sections.summary.content`.
4. Add summary formula strings to `packages/content/src/summary-formulas/` (English + Arabic).

### Phase 5  Additional sections adder (`BUILD-04: Frontend`)

1. Create `apps/web/src/features/builder/additional-sections.tsx`:
   - List of optional sections: languages, certificates, courses, projects, volunteering, awards, publications, references, hobbies, internships, activities, custom.
   - Each section has an `Add` button and a `Skip / Not applicable` action.
   - Added sections use the existing upstream section editor for that type.
2. Custom sections can be renamed inline; rename updates only display labels and preserves data keys.
3. Hidden sections are visually indicated and excluded from preview/PDF (reused from upstream `hidden` flag).
4. Ensure the section-add flow does not create orphan buttons  every action maps to a data change or explicit skip.

### Phase 6  Backend / ownership wiring (`BUILD-02: Security`, `BUILD-03: Backend`)

1. Ensure every `PATCH /api/cv/:id` (or equivalent oRPC `resume.update`) validates that the caller owns the `Resume` row via `userId` or `guestSessionId`.
2. Add a read-only oRPC procedure `content.search` (or use direct package imports) for job titles, phrases, and skills if the catalogue is too large for client-side search.
   - Default to static package imports; add server search only if bundle size or performance requires it.
3. Add rate limiting to any new search endpoint.
4. Confirm server logs never contain CV text or PII.

### Phase 7  i18n, RTL, and accessibility (`BUILD-04: Frontend`)

1. Wrap all new copy, tips, and placeholder labels in Lingui macros (`<Trans>`, `` t`...` ``).
2. Run `pnpm --filter web lingui:extract` and commit updated `.po` files.
3. Provide Arabic strings for all tips, phrases, and skill names; translation pass may be stubbed with English source, but placeholder resolution must still work.
4. Verify RTL layout for stepper, tip popovers, skill suggestions, and phrase picker.
5. Ensure keyboard-only flow through the stepper and all form dialogs (focus trap, `Esc` to close, visible focus).

### Phase 8  Tests and verification (`SHIP-01: Test`)

1. Unit tests in `packages/content/`:
   - Job-title search returns relevant matches.
   - Phrase filtering by section/job/experience works.
   - Placeholder resolution and unresolved detection works.
   - Duplicate skill detection works.
2. Component tests for `stepper.tsx`, `phrase-picker.tsx`, `skill-suggestions.tsx`, and `summary-builder.tsx`.
3. E2E test: landing → setup → template → personal details → work experience → education → skills → summary → additional sections.
4. Run `pnpm check`, `pnpm typecheck`, `pnpm test`, and `pnpm exec turbo boundaries`.

## Acceptance criteria

- A user can complete every content step with inline tips and phrase patterns; all sections render in the live preview and are persisted through autosave.
- Work experience supports repeatable roles with job title, employer, location, dates, current flag, and bullets.
- Job-title-filtered tips appear when a bullet field is focused; fallback to `General CV` tips when no target job is set.
- Curated phrase patterns are searchable and editable; phrases with unresolved placeholders cannot be accepted.
- Accepted text remains fully editable and the system never invents achievements, skills, or numbers.
- Education supports reorder-before-experience for low-experience users after confirmation.
- Skills support manual entry, search, categories, reorder, and optional levels; job-title suggestions appear unchecked.
- Summary uses fill-in-the-blank formulas built only from user-selected facts.
- Additional sections are optional and can be skipped; custom sections can be renamed.
- Returning to the builder opens the last incomplete step.
- All new UI strings are externalized via Lingui; Arabic RTL renders correctly.
- Every resume mutation enforces ownership via `userId` or `guestSessionId`.
- Analytics events exclude CV text, names, emails, phone numbers, and locations.
- `pnpm check`, `pnpm typecheck`, `pnpm test`, and `pnpm exec turbo boundaries` pass.

## Detailed task checklist

### `packages/content` catalogue package

- [ ] Create `packages/content/package.json` with exports `./job-titles`, `./phrases`, `./skills`, `./summary-formulas`, `./utils`.
- [ ] Add `packages/content/tsconfig.json` using the shared config preset.
- [ ] Add `packages/content/src/job-titles/en.json` and `ar.json` with id, title, category, experienceLevels.
- [ ] Add `packages/content/src/phrases/en.json` and `ar.json` with id, sectionType, jobTitleIds, experienceLevels, patternEn, patternAr, placeholders.
- [ ] Add `packages/content/src/skills/en.json` and `ar.json` with id, nameEn, nameAr, category, jobTitleIds, experienceLevels.
- [ ] Add `packages/content/src/summary-formulas/en.json` and `ar.json` with formula patterns and required facts.
- [ ] Implement `searchJobTitles`, `getPhrases`, `getSkills`, `getSummaryFormulas` helpers using `fuse.js`.
- [ ] Implement `resolvePlaceholders` / `listUnresolvedPlaceholders` helpers.
- [ ] Add unit tests for catalogue lookup and placeholder logic.
- [ ] Verify `pnpm exec turbo boundaries` passes with the new package.

### Stepper and wizard shell

- [ ] Build/finalize `apps/web/src/features/builder/stepper.tsx` with 13 named steps and completion state.
- [ ] Integrate stepper into `apps/web/src/routes/builder/$resumeId/route.tsx`.
- [ ] Implement URL-based step state and last-incomplete-step redirect.
- [ ] Add `Skip / Not applicable` action per step with visual state.
- [ ] Add `Continue` / `Back` navigation that autosaves before transition.
- [ ] Add step completion rules based on required fields.

### Work experience

- [ ] Adapt `apps/web/src/routes/builder/$resumeId/-sidebar/left/sections/experience.tsx` to stepper flow.
- [ ] Add job-title-aware tip display on bullet field focus.
- [ ] Build `apps/web/src/components/phrase-picker.tsx` for searching/inserting phrases.
- [ ] Implement placeholder detection that blocks acceptance until resolved.
- [ ] Ensure inserted phrases are editable HTML in `RichInput`.
- [ ] Add date validation: end before start rejected; current role hides end date.
- [ ] Add analytics events without CV text or PII.

### Education and skills

- [ ] Adapt `apps/web/src/routes/builder/$resumeId/-sidebar/left/sections/education.tsx`.
- [ ] Add confirmation prompt to reorder education before work experience for entry-level users.
- [ ] Adapt `apps/web/src/routes/builder/$resumeId/-sidebar/left/sections/skills.tsx`.
- [ ] Build `apps/web/src/components/skill-suggestions.tsx` with unchecked-by-default suggestions.
- [ ] Implement duplicate-skill warning/deduplication.
- [ ] Add skill categories, reorder, and optional proficiency level.

### Summary and additional sections

- [ ] Build/finalize `apps/web/src/features/builder/summary-builder.tsx` with fill-in-the-blank formulas.
- [ ] Assemble summary from user facts and allow editing before save.
- [ ] Build `apps/web/src/features/builder/additional-sections.tsx` adder UI.
- [ ] Support languages, certificates, courses, projects, volunteering, awards, publications, references, hobbies, internships, activities, custom.
- [ ] Add `Skip / Not applicable` for each optional section.
- [ ] Ensure custom-section rename updates labels only, preserving data keys.

### Security and backend

- [ ] Verify `PATCH /api/cv/:id` ownership check via `userId` or `guestSessionId`.
- [ ] Add rate limiting to any new content-search oRPC procedure (if added).
- [ ] Confirm no CV text or PII in server logs or analytics payloads.
- [ ] Add no-AI gate verification: no imports of `ai`, `@ai-sdk/*`, `ollama-ai-provider-v2`, `@headcv/ai`, `@headcv/mcp`.

### i18n, RTL, and accessibility

- [ ] Wrap all new strings in Lingui macros.
- [ ] Run `pnpm --filter web lingui:extract` and commit `.po` files.
- [ ] Add Arabic catalogue data and verify placeholder tokens work in Arabic.
- [ ] Test keyboard navigation through stepper and all new dialogs.
- [ ] Verify focus management and visible focus rings.

### Tests and verification

- [ ] Write unit tests in `packages/content/`.
- [ ] Write component tests for stepper, phrase picker, skill suggestions, summary builder.
- [ ] Write E2E test for full content-step journey.
- [ ] Run `pnpm check`.
- [ ] Run `pnpm typecheck`.
- [ ] Run `pnpm test`.
- [ ] Run `pnpm exec turbo boundaries`.

## Deliverable

Guided content builder with deterministic job-title tips, curated editable phrase patterns, skills suggestions, summary builder, and optional-section adder  all wired to autosave and live preview.

## Verification

- Manual: a non-technical user completes personal → experience → education → skills → summary → additional; all sections appear in preview; autosave recovers after refresh; skipping and resuming steps works.
- Automated:
  - `pnpm --filter @headcv/content test` passes.
  - `pnpm --filter web test` passes for new component tests.
  - E2E content-step journey passes.
  - `pnpm check`, `pnpm typecheck`, `pnpm exec turbo boundaries` pass.
- Security: confirm no AI imports, ownership check present, analytics redaction tested.

## Files to create or modify

### Create

- `packages/content/package.json`
- `packages/content/tsconfig.json`
- `packages/content/src/job-titles/en.json`
- `packages/content/src/job-titles/ar.json`
- `packages/content/src/phrases/en.json`
- `packages/content/src/phrases/ar.json`
- `packages/content/src/skills/en.json`
- `packages/content/src/skills/ar.json`
- `packages/content/src/summary-formulas/en.json`
- `packages/content/src/summary-formulas/ar.json`
- `packages/content/src/index.ts`
- `packages/content/src/utils.ts`
- `packages/content/src/job-titles/index.ts`
- `packages/content/src/phrases/index.ts`
- `packages/content/src/skills/index.ts`
- `packages/content/src/summary-formulas/index.ts`
- `packages/content/src/job-titles/index.test.ts`
- `packages/content/src/phrases/index.test.ts`
- `packages/content/src/skills/index.test.ts`
- `packages/content/src/utils.test.ts`
- `apps/web/src/features/builder/stepper.tsx`
- `apps/web/src/features/builder/summary-builder.tsx`
- `apps/web/src/features/builder/additional-sections.tsx`
- `apps/web/src/components/phrase-picker.tsx`
- `apps/web/src/components/skill-suggestions.tsx`
- `apps/web/src/components/tip-popover.tsx`

### Modify

- `pnpm-workspace.yaml`  add `packages/content` if not already matched by glob.
- `turbo.json`  add package build/test tasks if needed.
- `apps/web/src/routes/builder/$resumeId/route.tsx`  integrate stepper and step routing.
- `apps/web/src/routes/builder/$resumeId/-sidebar/left/sections/experience.tsx`  add tips and phrase picker.
- `apps/web/src/routes/builder/$resumeId/-sidebar/left/sections/education.tsx`  add reorder prompt.
- `apps/web/src/routes/builder/$resumeId/-sidebar/left/sections/skills.tsx`  add suggestions and categories.
- `apps/web/src/routes/builder/$resumeId/-sidebar/left/sections/summary.tsx`  swap in summary builder.
- `apps/web/src/router.tsx`  add step-param route(s) if using URL-based step state.
- `apps/web/locales/en-US.po` and `ar-SA.po`  extract new strings.
- `packages/api/src/features/resume/*`  verify ownership on update procedure.

## Design/UX references

- `brand-and-style.md`  voice, color, form patterns, hints, skill pills, badges, toasts, wizard shell, accessibility.
- `html-mocks/wizard.html`  wizard and builder patterns (if available).

## Technical references

- `slice-backlog.md` S5  original slice summary.
- `user-stories.md` M5–M8  acceptance criteria.
- `erd-mvp.md`  `Resume.data` JSONB shape and ownership rules.
- `implementation-plan.md`  13-step flow, content catalogue, summary formulas.
- `packages/schema/src/resume/data.ts`  section schemas.
- `apps/web/src/routes/builder/$resumeId/route.tsx`  builder shell.
- `apps/web/src/routes/builder/$resumeId/-sidebar/left/sections/*.tsx`  existing section editors.
- `apps/web/src/components/input/rich-input.tsx`  TipTap rich text editor.
- `apps/web/src/libs/resume/section.tsx`  section utilities.
- `apps/web/src/libs/tanstack-form.tsx`  `useAppForm` helper.

## Open questions / notes

- `Q6`: target job remains optional; fall back to `General CV` tips, phrases, and skill suggestions when missing.
- Catalogue size and delivery: this slice uses static JSON in `packages/content`. `erd-mvp.md` also describes `JobTitle`, `Phrase`, and `Skill` tables; if the product later needs admin-editable catalogues, migrate these fixtures to the DB in a future slice and keep `packages/content` as the seed source.
- `Q2`: paid-model wording does not affect this slice; content steps are part of the free guest flow.
- `Q3`: Arabic/English are launch requirements; Arabic catalogue data and RTL layout must be present but a native-speaker review pass is tracked separately.
- No AI boundary: this slice must not introduce any generative model, embedding, or LLM call. Tips, phrases, skills, and summaries are deterministic curated content or assembled from user facts.
- The 13-step stepper shell may have been started in S3; this slice finalizes the stepper logic and content-specific completion rules.

## Risks and considerations

- **Catalogue quality risk:** if phrases are too generic or placeholders too hard to resolve, users will ignore them. Mitigation: start with a small, high-quality set of patterns per job title and iterate.
- **Bundle size risk:** large JSON catalogues in `packages/content` can inflate the web bundle. Mitigation: load locale-specific files only, consider server-side search if catalogue grows.
- **Stepper blast radius:** the stepper changes the builder navigation model. Verify it does not break the existing section-editor sidebar or preview.
- **Education reorder prompt friction:** asking entry-level users to reorder sections may feel confusing. Mitigation: make it a one-time, reversible suggestion, not a forced action.
- **Placeholder acceptance edge cases:** users may paste text containing bracketed words that look like placeholders. Ensure detection only applies to curated pattern placeholders, not arbitrary user text.
- **RTL complexity:** phrase pickers, skill suggestions, and tip popovers need mirroring and Arabic copy. Test with real Arabic strings early.
- **Ownership regression:** any new update path must reuse the existing `protectedProcedure` / ownership check; do not bypass it for guest sessions.
