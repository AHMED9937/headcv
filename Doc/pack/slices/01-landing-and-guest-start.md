# Slice 1  Landing and Guest Start

## One-sentence summary

Replace the upstream landing experience with a HeadCV-branded landing page built around one primary `Create my CV` action, an honest commercial-disclosure block, and a privacy-safe analytics layer  all without requiring the user to sign in.

## Scope and prompt hats

This slice is a pure front-end and configuration slice. It follows these hats from `prompts-playbook.md`:

- `BUILD-04: Frontend`  branding, theme tokens, landing page, responsiveness, accessibility.
- `BUILD-06: SEO`  public route metadata, canonical, structured data, OG/Twitter, manifest cleanup.
- `BUILD-02: Security`  analytics privacy guard; no CV text or PII in events.
- `SHIP-01: Test`  landing page unit tests, accessibility checks, Lighthouse performance budget.
- `SHIP-02: Release`  build, smoke, and LCP/CLS verification.

## Inputs from the pack

- `brand-and-style.md`  frozen voice, color, typography, spacing, motion, and component rules. **Note:** the doc is still `draft`; use the current token values and freeze G2 before S2 starts.
- `html-mocks/styles.css`  canonical `:root` token values.
- `html-mocks/index.html`  landing structure and CTA placement.
- `requirements.md` M1  entry and setup requirements.
- `user-stories.md` M1  guest starts from one CTA.
- `user-flows.md`  landing actions and analytics rules.

## Goal

Replace upstream branding with the HeadCV identity and build a landing page centered on one `Create my CV` CTA, honest commercial disclosure, and analytics privacy.

## Stories covered

- `M1  Guest starts from one CTA`

## Depends on

- `S0  Foundation fork and team setup` (runnable upstream baseline, no AI/MCP, dev env ready).

## Riskiest assumption

Users understand the free/account/payment rules before starting and still click `Create my CV`.

## What we build / adapt

### 1. Theme tokens and design system (`BUILD-04: Frontend`)

- The project uses **Tailwind v4 CSS-based config** (no `tailwind.config` file). Theme tokens live in `packages/ui/src/styles/globals.css` and are mapped through `@theme inline`.
- Switch the app default from `dark` to `light` in `apps/web/src/libs/theme.ts` (`const defaultTheme: Theme = "light"`). Keep dark-mode support and the theme toggle; do not add a landing-only toggle.
- Promote the HeadCV tokens from `html-mocks/styles.css` into `:root` in `packages/ui/src/styles/globals.css` and mirror them in `@theme inline` so Tailwind utilities (`bg-background`, `text-primary`, etc.) resolve to HeadCV values.
- Map semantic aliases:
  - `--primary` `#1e3a5f`
  - `--primary-dark` `#152642`
  - `--primary-light` `#e8e0d6`
  - `--accent` `#c9a227`
  - `--bg` `#f5efe6`
  - `--surface` `#ffffff`
  - `--font-body` Inter
  - `--font-display` Playfair Display
  - `--font-arabic` Noto Sans Arabic
- Remove or replace the upstream IBM Plex Sans import (`@import "@fontsource-variable/ibm-plex-sans"`) with:
  - `@fontsource-variable/inter` (body UI)
  - `@fontsource/playfair-display` or `@fontsource-variable/playfair-display` (display)
  - `@fontsource/noto-sans-arabic` (RTL Arabic fallback)
- Add the Noto Sans Arabic font import/fallback for RTL preview of the Arabic landing variant.

### 2. Brand assets (`BUILD-04: Frontend`)

- Replace the upstream `favicon.ico`, `favicon.svg`, `apple-touch-icon-180x180.png`, `pwa-64x64.png`, `pwa-192x192.png`, `pwa-512x512.png`, `maskable-icon-512x512.png` with the HeadCV logo mark.
- Replace or create SVG assets at:
  - `apps/web/public/icon/light.svg`
  - `apps/web/public/icon/dark.svg`
  - `apps/web/public/logo/light.svg`
  - `apps/web/public/logo/dark.svg`
- Build the SVG logo mark from `html-mocks/logo-icon.svg` and add a wordmark.
- Update `apps/web/index.html` title and meta tags to use the working product name `HeadCV` (Q9 is still open; rename in one place once Q9 closes).
- Update `apps/web/public/manifest.webmanifest`: change `name`, `short_name`, `description`, `theme_color`, `background_color`, and **remove the `"ai"` category** (no-AI boundary).
- Replace OpenGraph images under `apps/web/public/opengraph/`.
- Update `apps/web/src/libs/seo.ts` to HeadCV branding, URLs, and honest commercial JSON-LD (`isAccessibleForFree`, accurate `offers`, no upstream repository claim unless true).
- Update any hard-coded upstream strings that surface in the landing shell.

### 3. SEO / metadata (`BUILD-06: SEO`)

- `apps/web/src/libs/seo.ts` is the single source of truth for root structured data and helper functions.
- Update the production root URL constant (`https://headcv.com/`) to the planned HeadCV domain or `APP_URL` fallback.
- Rewrite JSON-LD:
  - `WebSite` name = HeadCV.
  - `SoftwareApplication` description uses HeadCV copy and honest free/account/paid disclosure.
  - Remove upstream `codeRepository` or point it to the HeadCV fork URL once Q9 closes.
  - `FAQPage` uses only HeadCV-branded questions (reuse a short, honest FAQ block if one is kept on the landing page).
- In `apps/web/src/routes/_home/index.tsx`, add OpenGraph/Twitter meta tags to the route `head`:
  - `og:title`, `og:description`, `og:image`, `og:url`, `og:type`
  - `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`
- Ensure `index.html` has a base title, meta description, and favicon links; route `head` can override specific pages later.
- For Arabic/RTL SEO: set `<html lang="ar" dir="rtl">` dynamically through the Lingui locale. The `index.html` static `lang` attribute can remain `en`; the client should update it after locale resolution.

### 4. Landing page (`BUILD-04: Frontend`)

File targets:

- Layout shell: `apps/web/src/routes/_home/route.tsx`
- Landing content: `apps/web/src/routes/_home/index.tsx`
- Header: `apps/web/src/routes/_home/-sections/header.tsx`
- Hero: `apps/web/src/routes/_home/-sections/hero.tsx`
- New sections: `apps/web/src/routes/_home/-sections/tools.tsx`, `features.tsx`, `templates-showcase.tsx`, `hired-bar.tsx`, `final-cta.tsx`, `footer.tsx`

Sections to implement, matching `html-mocks/index.html`:

- Sticky header with logo, language selector, and a secondary `Sign in` link.
- Hero with one dominant `Create my CV` CTA above the fold.
- Commercial disclosure block visible before the CTA or immediately adjacent to it.
- Counter / social-proof bar (optional but from mock).
- Tools grid (Get Noticed / Get Hired / Get Paid More / Get Promoted).
- Feature blocks using the calm, expert, non-technical voice from `brand-and-style.md`.
- Template showcase with up-sell to the full gallery.
- Hired-bar (social-proof companies).
- Final CTA section.
- Footer with links to support, privacy, and (placeholder) terms.

UX rules from the pack:

- One primary action per viewport group.
- `Sign in` is reachable but visually secondary and never required to reach `/setup`.
- Disclosure must state: what is free now, what requires an account, and what may become paid later.
- Language selector sets the i18n locale client-side without sending personal data.
- Responsive at `>900px`, `601–900px`, and `≤600px` with the breakpoints from `brand-and-style.md`.
- CTA keyboard focus is visible and reachable within one tab sequence on page load.
- No upstream pre-auth dashboard or power-user chrome is visible before the user has a CV.

Upstream sections to remove or rebrand:

- Remove `DonationBanner`, upstream `Statistics`, `Testimonials`, and the upstream `FAQ` from the landing page.
- A short HeadCV FAQ may be retained if it supports SEO/JSON-LD and matches brand voice.
- Replace the upstream `Footer` links with support, privacy, terms placeholders.

### 5. Guest start flow

- `Create my CV` immediately generates a lightweight guest session ID (UUIDv4) stored in `localStorage` and navigates to `/setup`.
- No sign-in is required.
- S1 does **not** need to create the persistent guest DB model or call an API; that is finalized in S2/S4. The CTA only creates client-side state and routes forward.
- If a previous guest session exists, reuse it instead of generating a new one.

### 6. Analytics privacy guard (`BUILD-02: Security`)

- Create `apps/web/src/libs/analytics.ts` (follow the existing `libs/` convention, not `lib/`).
- It must:
  - Never send CV text, names, emails, phone numbers, or uploaded file content.
  - Hash or omit identifiers that could be tied back to a person.
  - Only track landing events: `landing_view`, `landing_cta_click`, `language_select`, `disclosure_view`.
  - Log events in a structured shape documented in the slice spec.
- If no analytics provider is configured, the wrapper can write to `console.debug` in dev, but the privacy rules are enforced by code so a future provider cannot accidentally receive PII.
- Add unit tests proving redaction for sample PII inputs in `apps/web/src/libs/analytics.test.ts`.

### 7. Accessibility and performance

- Semantic heading order, landmark regions (`<header>`, `<main>`, `<footer>`), `aria-label` on the CTA, and keyboard focus management.
- Keep the existing skip-link in `_home/route.tsx`.
- Color contrast for the navy/gold/sand palette verified against WCAG 2.2 AA.
- LCP target p75 `≤ 2.5s` and Lighthouse performance/accessibility `≥ 90`.
- Preload critical fonts (Inter, Playfair Display) and lazy-load below-the-fold marketing images with `loading="lazy"`.
- Use `font-display: swap` for web fonts to avoid invisible text.
- RTL: Arabic landing renders with `dir="rtl"`, `Noto Sans Arabic`, and correctly flipped/mirrored directional icons.

### 8. i18n / copy workflow

- All new user-facing strings must use Lingui macros (`<Trans>`, `` t`...` ``).
- After adding copy, run `pnpm --filter web lingui:extract` to update `.po` files.
- Arabic translations can be stubbed with the English source in `apps/web/locales/ar-SA.po`; a native translation pass is a separate task.

## Acceptance criteria

- One primary `Create my CV` action is visible above the fold on desktop and mobile.
- `Sign in` is reachable but secondary and never required to reach the builder/setup.
- Free, account, and paid/export rules are disclosed before setup starts.
- LCP p75 `<= 2.5s`; Lighthouse performance and accessibility scores `>= 90`.
- Analytics events exclude CV text, names, emails, phone numbers, and uploaded files.
- Keyboard and screen-reader users can reach the CTA within one tab sequence.
- Arabic landing renders RTL with `Noto Sans Arabic` and correctly flipped/mirrored directional icons.
- No broken upstream dashboard or power-user chrome is visible before the user has a CV.
- `manifest.webmanifest` contains no `"ai"` category and uses HeadCV name/description.
- `apps/web/src/libs/seo.ts` contains no upstream URLs or copy.
- `pnpm build`, `pnpm typecheck`, and `pnpm exec turbo boundaries` pass for `apps/web`.

## Detailed task checklist

### Theme & design system

- [ ] Switch `defaultTheme` to `"light"` in `apps/web/src/libs/theme.ts`.
- [ ] Promote `:root` tokens from `html-mocks/styles.css` into `packages/ui/src/styles/globals.css`.
- [ ] Map semantic tokens into Tailwind v4 `@theme inline` in `packages/ui/src/styles/globals.css`.
- [ ] Replace IBM Plex Sans import with Inter, Playfair Display, and Noto Sans Arabic font packages.
- [ ] Add Noto Sans Arabic font loading for the `ar` locale.

### Brand assets & SEO

- [ ] Replace favicon, PWA icons, and logo assets under `apps/web/public/`.
- [ ] Update `<title>`, meta description, and OpenGraph tags in `apps/web/index.html`.
- [ ] Rewrite `apps/web/src/libs/seo.ts` with HeadCV branding and honest commercial JSON-LD.
- [ ] Add route-level OG/Twitter meta tags in `apps/web/src/routes/_home/index.tsx`.
- [ ] Update `apps/web/public/manifest.webmanifest` (name, description, colors, remove `"ai"`).
- [ ] Replace OpenGraph images under `apps/web/public/opengraph/`.

### Landing page

- [ ] Update layout shell `apps/web/src/routes/_home/route.tsx` if needed (skip link already exists).
- [ ] Replace header in `apps/web/src/routes/_home/-sections/header.tsx`: logo, language selector, Sign in.
- [ ] Rewrite hero in `apps/web/src/routes/_home/-sections/hero.tsx`: one CTA, disclosure, brand voice.
- [ ] Add/rewrite sections: counter-bar, tools, features, template showcase, hired-bar, final-cta, footer.
- [ ] Remove or rebrand upstream-specific sections (DonationBanner, upstream FAQ, Testimonials, Statistics).
- [ ] Implement responsive grid/breakpoints (`>900px`, `601–900px`, `≤600px`).
- [ ] Remove/hide upstream pre-auth dashboard choices and power-user chrome.
- [ ] Add `aria-label` and focus rings to the CTA and language selector.

### Guest start & analytics

- [ ] Create `apps/web/src/libs/analytics.ts` privacy-safe wrapper.
- [ ] Implement `landing_view`, `landing_cta_click`, `language_select`, `disclosure_view` events.
- [ ] Redact or hash any identifier; never send CV text or PII.
- [ ] On `Create my CV`, generate or reuse a guest session ID in `localStorage` and navigate to `/setup`.
- [ ] Add unit tests proving redaction for sample PII inputs.

### i18n

- [ ] Wrap all new copy in Lingui `<Trans>` or `` t`...` `` macros.
- [ ] Run `pnpm --filter web lingui:extract` and commit updated `.po` files.
- [ ] Verify Arabic `ar-SA.po` has source strings (translation pass optional for S1).

### Tests and verification (`SHIP-01: Test` / `SHIP-02: Release`)

- [ ] Write unit tests for the landing CTA and disclosure visibility.
- [ ] Write tests for analytics redaction.
- [ ] Run accessibility checks (semantic roles, labels, contrast).
- [ ] Run `pnpm --filter web typecheck`.
- [ ] Run `pnpm --filter web build`.
- [ ] Run `pnpm exec turbo boundaries`.
- [ ] Measure LCP and Lighthouse on a local build; record scores.
- [ ] Test the Arabic landing with `dir="rtl"`; verify `Noto Sans Arabic` and no layout breaks.

## Deliverable

Branded landing page with one CTA, honest disclosure, and analytics privacy  reachable without signing in.

## Verification

- Manual: landing renders, CTA creates a guest session and routes to `/setup`, disclosure is visible, Lighthouse meets targets, analytics payload contains no PII.
- Automated: `pnpm build`, `pnpm typecheck`, `pnpm exec turbo boundaries`, landing unit tests, and Lighthouse CI pass.

## Files to create or modify

- `packages/ui/src/styles/globals.css`  token promotion and Tailwind v4 `@theme inline` mapping.
- `apps/web/src/libs/theme.ts`  switch default theme to light.
- `apps/web/public/*`  favicon, logo, PWA icons, OpenGraph images.
- `apps/web/public/manifest.webmanifest`  remove `"ai"`, rename app.
- `apps/web/index.html`  title/meta.
- `apps/web/src/libs/seo.ts`  root SEO helpers and JSON-LD.
- `apps/web/src/routes/_home/index.tsx`  landing route meta + section composition.
- `apps/web/src/routes/_home/route.tsx`  layout shell (skip link already present).
- `apps/web/src/routes/_home/-sections/header.tsx`  sticky header.
- `apps/web/src/routes/_home/-sections/hero.tsx`  hero and disclosure.
- `apps/web/src/routes/_home/-sections/tools.tsx`  tools grid.
- `apps/web/src/routes/_home/-sections/features.tsx`  feature blocks.
- `apps/web/src/routes/_home/-sections/templates-showcase.tsx`  template showcase.
- `apps/web/src/routes/_home/-sections/hired-bar.tsx`  social proof.
- `apps/web/src/routes/_home/-sections/final-cta.tsx`  bottom CTA.
- `apps/web/src/routes/_home/-sections/footer.tsx`  footer links.
- `apps/web/src/libs/analytics.ts`  privacy-safe analytics wrapper.
- `apps/web/src/libs/analytics.test.ts`  analytics redaction tests.
- `apps/web/src/routes/_home/index.test.tsx`  landing page tests.
- `apps/web/locales/*.po`  updated strings via Lingui extract.

## Design/UX references

- `brand-and-style.md`  voice, color, typography, motion, button/landing patterns.
- `html-mocks/styles.css`  canonical `:root` token values.
- `html-mocks/index.html`  landing structure and CTA placement.
- `html-mocks/logo-icon.svg`  logo mark source.

## Technical references

- `apps/web/src/routes/_home/index.tsx` and `apps/web/src/routes/_home/route.tsx` from the S0 baseline.
- `apps/web/src/libs/seo.ts`, `apps/web/src/libs/theme.ts`, `apps/web/src/libs/locale.ts`.
- `apps/web/public/manifest.webmanifest`.
- `packages/ui/src/styles/globals.css` and `packages/ui/src/styles/shadcn-theme.css`.
- `packages/ui/` buttons, cards, headers, language selector, form primitives.
- `apps/web/src/features/locale/combobox.tsx` for language selector wiring.
- `apps/web/src/libs/orpc/client.ts`  not needed for S1, but the future CTA will call an API in S2/S4.

## Open questions / notes

- `Q2`: exact paid-model wording for the disclosure block. Use the recommended default  "free now, account required to save, paid tiers may be introduced later"  until Q2 is resolved.
- `Q9`: product name and domain. Use `HeadCV` as the working name in this slice; rename in one place once Q9 closes.
- The CTA guest session is client-side for S1 if the guest DB model is not ready; persistence is finalized in S2/S4.
- `brand-and-style.md` is currently `draft`. S1 uses the current draft tokens; G2 style freeze must happen before S2 begins to avoid downstream rework.
- The app currently defaults to `dark`; S1 switches the default to `light` to match the brand palette while keeping the theme toggle.

## Risks and considerations

- **Style freeze dependency:** `brand-and-style.md` is `draft`. If tokens change after this slice, the landing and downstream templates must be redone. Freeze G2 before S2.
- **Theme change blast radius:** switching the default theme to `light` affects every screen, not just the landing. Verify builder/dashboard still render correctly in both modes.
- **Lighthouse budget:** the Playfair Display and Noto Sans Arabic web fonts, plus RTL styles, must not push LCP above `2.5s` on a throttled 4G profile. Preload critical fonts.
- **Upstream landing complexity:** `_home/index.tsx` may also be referenced by the dashboard path for logged-in users. Ensure the landing-only path remains clean while not breaking authenticated routes.
- **Analytics provider TBD:** if a real analytics provider is chosen later, the privacy wrapper must be the only code path that sends events. Document this contract in `analytics.ts`.
- **i18n loading:** the language selector reloads the page on change in the current codebase. This is acceptable for S1; a smoother no-reload swap can be improved later.
- **Font package availability:** confirm the chosen `@fontsource*` packages exist and support the required weights before installing.
- **No-AI boundary:** verify `manifest.webmanifest` categories and any landing copy do not imply AI features.
