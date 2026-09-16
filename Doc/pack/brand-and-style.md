# Brand and style  HeadCV

Owners: **brand-designer** (writes) + **web-ui-engineer** (mocks)  
Pack steps: **4↔5**  
Status: `draft`

> Written FROM the compose-mocks feedback loop. The data schema and slices are blocked until Status is `frozen` (gate G2).  
> `html-mocks/styles.css` is the single source of truth for token values and shared component styles.

---

## How to use this doc

Canonical reference for HeadCV brand, tokens, type rules, shared components, and accessibility.

- **brand-designer**  voice, color, imagery, and content direction.
- **web-ui-engineer**  CSS implementation and production component contract.
- **content-designer**  microcopy tone, labels, hints, and errors.
- **product-manager**  Governance, Feedback log, and Freeze checklist to unblock sprints.

---

## Derived from compose-mocks

Informed by `html-mocks/`. LTR files are listed below; each has an `ar/` counterpart.

- `index.html`  landing, hero, social proof, templates, final CTA.
- `setup.html`  language, job target, experience level.
- `templates.html`  template gallery and selection.
- `builder.html`  full-form editor, upload/edit, live preview.
- `wizard.html`  8-step prototype wizard and ready screen (production flow is 13 steps; see `../../implementation-plan.md`).
- `review.html`  deterministic review findings.
- `design.html`  template, color, font, density, paper-size controls.
- `export.html`  export progress, preview, download.
- `auth.html`  sign up, log in, forgot password.
- `dashboard.html`  saved CV list and management.
- `settings.html`  account and preference controls.
- `pricing.html`  plan comparison.
- `examples.html`  sample CV gallery.
- `styles.css`  single source of truth for tokens and component classes.

---

## Brand direction

### Voice

- Calm, expert, non-technical. A skilled career advisor, not a chatbot or sales page.
- Honest and transparent. No AI-washing.
- Encouraging without being dramatic. 'Only 2% of CVs win. Yours will be one of them.' is confident, not fear-mongering.
- Action-oriented. Headings and buttons lead with verbs.

### Atmosphere

- **Trusted Professional:** deep navy, warm sand, restrained gold.
- **Paper-first:** surfaces feel like high-quality resume paper.
- **Human and guided:** silhouettes, step-by-step progress, deterministic help.

### Design principles

1. Clarity over cleverness. Every screen answers: what should the user do next?
2. Progressive disclosure. Minimum fields first, advanced controls on demand.
3. Document realism. The preview looks like a real A4 CV at every step.
4. Restraint. Gold is a confidence accent; motion celebrates completion, not decoration.

### What makes this NOT a generic AI-default look

- No neon tech palette. Navy dominates; gold is sparing.
- Editorial typography. Playfair Display for headings; Inter for UI.
- Real document preview. Users see an A4-style CV as they type.
- No generated-content framing. Help is labeled as 'curated phrases' and 'fill-in-the-blank formulas'.

### Brand promise in one line

'Build the CV that gets you hired  guided, transparent, and ATS-friendly.'

---

## Content & UX writing

### Microcopy tone

- Second person: 'Add your latest role' not 'User adds latest role'.
- Sentence case: 'Work experience' not 'Work Experience'.
- Short labels. Explanations belong in hints below fields.
- Avoid AI clichés: 'smart', 'magic', 'instant', 'effortless'.

### Button labels

- Primary: 'Save and continue', 'Build CV', 'Export PDF', 'Get started'.
- Secondary: 'Back', 'Preview', 'Skip for now'.
- Destructive: 'Delete', 'Remove', 'Discard changes'.
- Never use 'Submit' as the primary label in a multi-step flow.

### Error messages

- State what happened, why it matters, and how to fix it.
- Example: 'We could not save your CV because the title is empty. Add a title and try again.'
- Inline errors appear below the field in `--danger-dark` with a red border.
- Avoid blame: use 'We could not...' or 'This field needs...'.

### Hints

- Use hints for formatting guidance: 'Recruiters scan this in 6 seconds. Keep it to one sentence.'
- Place hints below the input in `--text-muted`.
- Do not hide validation rules in hints.

### Success states

- Toast messages should be specific: 'CV saved', 'PDF downloaded', 'Section added'.
- Avoid generic 'Success!' toasts.
- Ready screen uses a checkmark icon inside a green circle and clear next steps.

---

## Token architecture

### Naming convention

All tokens use `kebab-case` following `category-usage-modifier`:

- `category`  color, font, space, radius, shadow, motion.
- `usage`  what the token describes.
- `modifier`  optional state or scale.

Examples: `--color-primary-dark`, `--space-6`, `--radius-lg`, `--shadow-primary-hover`.

### Global vs semantic/alias tokens

- **Global/raw tokens** describe absolute values: `--color-primary: #1e3a5f`, `--space-4: 16px`.
- **Semantic/alias tokens** describe intent: `--surface: var(--color-white)`, `--focus-ring: 0 0 0 3px var(--primary-light)`.
- Production code should prefer semantic tokens.

### CSS custom properties

Live tokens are declared in `:root` inside `html-mocks/styles.css`. Mirror them exactly before promoting to a framework-specific implementation.

### Future W3C DTCG / JSON tokens

A future `tokens.json` will live at `Doc/pack/tokens.json` and follow the W3C Design Tokens Community Group format. Until then, `styles.css` is the source of truth.

### Token lifecycle

1. **Draft**  token appears in this doc and `styles.css` with a usage note.
2. **Review**  brand-designer and web-ui-engineer confirm it is used and not redundant.
3. **Frozen**  token is promoted to canonical `:root` and may not change without a changelog entry.
4. **Deprecated**  token is flagged, a replacement is documented, removed in the next major release.

---

## Tokens

### Color

#### Raw brand palette

| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | `#1e3a5f` | Primary navy; CTAs, active states, links, header, footer. |
| `--primary-dark` | `#152642` | Hover / pressed primary, gradients, deep footer. |
| `--primary-light` | `#e8e0d6` | Subtle backgrounds, placeholder, hover fills, selected pills, focus rings. |
| `--accent` | `#c9a227` | Confidence gold; stars, stats, premium hints, hover lift. |
| `--accent-light` | `#f5efe6` | Warning / disclosure backgrounds, hero gradient base. |
| `--success` | `#10b981` | Passed states, free labels, completion, positive actions. |
| `--success-light` | `#d1fae5` | Success badge and chip backgrounds. |
| `--danger` | `#ef4444` | Delete, errors, low score, destructive actions. |
| `--warning` | `#c9a227` | Improve / caution states; same value as `--accent`. |
| `--bg` | `#f5efe6` | Page background, sand/cream canvas. |
| `--surface` | `#ffffff` | Cards, modals, preview page, frosted header. |
| `--text` | `#1e293b` | Main body text and headings. |
| `--text-muted` | `#5c6a7a` | Placeholders, hints, secondary labels, footer text. |
| `--border` | `#d9d0c3` | Card borders, input borders, dividers, hairlines. |
| `--color-white` | `#ffffff` | Pure white, inverse text, text on dark backgrounds. |
| `--color-black` | `#000000` | Highest contrast elements, rare. |

#### Semantic aliases

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `var(--bg)` | Page canvas. |
| `--foreground` | `var(--text)` | Default readable text. |
| `--muted` | `var(--text-muted)` | Secondary text. |
| `--border-default` | `var(--border)` | Default dividers and input borders. |
| `--text-on-primary` | `var(--color-white)` | Text on primary navy. |
| `--danger-light` | `#fee2e2` | Error field backgrounds, review badge backgrounds. |
| `--danger-dark` | `#991b1b` | Error message text. |
| `--warning-dark` | `#92400e` | Text on amber warning backgrounds. |
| `--success-dark` | `#065f46` | Text on success-light backgrounds. |

#### Contrast notes

- Navy on white and sand passes WCAG AA for normal text.
- Gold is only used for icons, stars, and large numbers, not small text.
- Muted text on `--surface` passes AA.
- Danger red on white passes AA but should be paired with an icon or label for color-blind users.

#### Dark mode mapping (future)

When dark mode is implemented, map semantic aliases to a future dark palette. Values are TBD by production.

- `--background` `#f5efe6` → deep navy / charcoal
- `--surface` `#ffffff` → `#232b3a`
- `--foreground` `#1e293b` → `#f1f5f9`
- `--muted` `#5c6a7a` → `#94a3b8`
- `--border-default` `#d9d0c3` → `#475569`

### Typography

| Token | Value | Usage |
|-------|-------|-------|
| `--font-body` | `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` | Body, buttons, labels, forms, UI microcopy. |
| `--font-display` | `'Playfair Display', Georgia, serif` | Headings, hero titles, section titles, editorial moments. |
| `--font-arabic` | `'Noto Sans Arabic', sans-serif` | Arabic body and fallback headings in RTL. |

Display font is never used for UI labels, buttons, or body text. Arabic pages use `Noto Sans Arabic` for headings and body.

### Spacing & layout

- `--space-1` = `4px`; `--space-2` = `8px`; `--space-3` = `12px`; `--space-4` = `16px`; `--space-5` = `20px`; `--space-6` = `24px`; `--space-8` = `32px`; `--space-10` = `40px`; `--space-12` = `48px`; `--space-16` = `64px`; `--space-20` = `80px`.
- `--container-max` = `1200px` (max page width).
- `--container-gutter` = `24px` (desktop); `--container-gutter-md` = `20px` (tablet); `--container-gutter-sm` = `16px` (mobile).

### Radius & shape

- `--radius-sm` = `6px` (chips, badges)
- `--radius` = `12px` (inputs, buttons, standard cards, tags)
- `--radius-lg` = `20px` (large cards, landing sections, hero images, modals)
- `--radius-full` = `9999px` (pills, tabs, toggle switches)

### Elevation & shadow

- `--shadow-sm` = `0 1px 2px rgba(30,58,95,0.05)` (subtle elevation, inline buttons)
- `--shadow` = `0 4px 6px -1px rgba(30,58,95,0.08), 0 2px 4px -2px rgba(30,58,95,0.06)` (cards, toasts, dropdowns)
- `--shadow-lg` = `0 20px 25px -5px rgba(30,58,95,0.1), 0 8px 10px -6px rgba(30,58,95,0.08)` (modals, hero visuals, selected template bar, sticky bottom)
- `--shadow-primary` = `0 4px 14px rgba(30,58,95,0.35)` (primary button resting shadow)
- `--shadow-primary-hover` = `0 8px 22px rgba(30,58,95,0.4)` (primary button hover shadow)
- `--shadow-primary-glow` = `0 4px 24px rgba(30,58,95,0.6), 0 0 0 4px rgba(30,58,95,0.1)` (pulsing glow on primary CTAs)

Shadows are always based on `--primary` navy, never on a generic indigo or purple.

### Motion

- `--transition` = `0.2s cubic-bezier(0.4, 0, 0.2, 1)` (standard hovers, focus, tabs)
- `--transition-bounce` = `0.4s cubic-bezier(0.34, 1.56, 0.64, 1)` (stepper dots, toasts, card entrances)
- `--duration-fast` = `150ms`; `--duration-base` = `200ms`; `--duration-slow` = `400ms`
- `--ease-standard` = `cubic-bezier(0.4, 0, 0.2, 1)`; `--ease-bounce` = `cubic-bezier(0.34, 1.56, 0.64, 1)`
- `--focus-ring` = `0 0 0 3px var(--primary-light)` (shared focus indicator)

---

## Type & composition rules

### Display vs body

- **Display font (`--font-display`)** reserved for headings `h1–h2`, large section titles, and logo wordmark.
- **Body font (`--font-body`)** used for everything else: navigation, buttons, labels, hints, cards, builder UI.
- **Arabic override:** in `dir='rtl'` pages, body text and headings fall back to `Noto Sans Arabic`.

### Heading scale

| Element | Desktop | Tablet | Mobile | Notes |
|---------|---------|--------|--------|-------|
| `h1` | `3.2rem` | `2.2rem` | `1.8rem` | Hero only; line-height `1.1`. |
| `h2` | `2.2rem` | `1.6rem` | `1.4rem` | Section titles; line-height `1.2`. |
| `h3` | `1.4rem` | `1.25rem` | `1.15rem` | Card headers, feature titles. |
| `h4` | `1.1rem` | `1rem` | `1rem` | Sub-headings inside cards. |

### Body scale

| Size | Value | Usage |
|------|-------|-------|
| Large | `1.15rem` | Hero subtext, feature paragraphs. |
| Base | `1rem` | Standard body, form inputs, buttons. |
| Small | `0.9rem` | Card descriptions, secondary copy. |
| Micro | `0.82rem` | Hints, placeholders, badges, tooltips. |

### Line-height & measure

- Body default: `1.5`.
- Headings: `1.1–1.2`.
- CV preview body: `1.35` for dense but readable documents.
- Max paragraph measure: `520px` marketing; `720px` builder hints.

### Density

- **Marketing pages:** generous whitespace, large sections, strong hierarchy.
- **Builder / wizard pages:** compact but breathable. Cards stack with `16–24px` gaps; input rows use `16px` vertical margin.
- **CV preview:** the only dense surface. Emulates a real A4 page and may use smaller type (`0.55–1.05rem`).

### Motion & interaction

- **Page load:** `pageIn`  `0.5s` fade + `12px` slide up on `.page`.
- **Section entry:** `sectionIn`  `0.35s` slide-up with bounce for cards and wizard steps.
- **Hover:** `0.2s` scale, translate, and color transitions. Interactive cards lift `translateY(-6px)` with `--shadow-lg`.
- **Focus:** `var(--focus-ring)` on inputs and buttons. No default outline.
- **Feedback:** `toast` bounces in from bottom-right; score bar fills smoothly.
- **Loading:** `spinner`, `bouncing-dots`, and `building-overlay` for analysis / PDF generation.
- **Celebration:** `confetti-fall` and `paper-stack` for export success. Use sparingly.

### Responsive breakpoints

- **Desktop:** `> 900px`  full grids, side-by-side hero, 4-column templates, builder split view.
- **Tablet:** `601px – 900px`  2-column grids, hero stacks vertically, builder becomes single column.
- **Mobile:** `≤ 600px`  single column, stacked form rows, bottom-sticky buttons, smaller type scale.

---

## Iconography

- All icons are SVG, `currentColor`, stroke `1.5–2px`.
- Sizes: `.icon-sm` = `18px`, `.icon` = `22px`, `.icon-lg` = `28px`.
- Color inherited from parent text. Do not bake brand colors into SVG files.
- Arrows and directional icons flip horizontally in RTL via `transform: scaleX(-1)` or asset swap.
- Bi-directional icons such as checks, stars, and trash cans do not flip.
- Use `display: inline-flex; align-items: center; gap: 8px;` for any icon-label pair.
- Never center an icon alone inside a button unless it has an accessible `aria-label`.

---

## Imagery

### Illustration

- Style: flat, geometric, navy + gold + sand. No gradients except subtle paper shadows.
- Subject: abstract humans, documents, career metaphors. No detailed facial features.
- Usage: hero graphics, empty states, export success, onboarding.

### Photos

- Use real team or user photography only when authentic and licensed.
- Default to circular avatars or rounded-square placeholders.
- Photo upload states use `--bg` until an image is selected.

### Avatars

- Default avatar: neutral gradient from `--bg` to `--primary-light` with an outline user icon.
- Uploaded avatar: `object-fit: cover`, center-weighted.

### No-stock rule

- Do not use generic stock photography of people in offices.
- Every image must be a custom illustration, an authentic user-uploaded photo, or a screenshot of the product itself.

---

## Shared UI components

Production components should use these exact class names and token values unless the design system review process approves a change.

### Button

Use `.btn` with `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-success`, or `.btn-glow`. Primary CTAs are navy/white with a primary shadow. Hover moves to `--primary-dark` and `translateY(-2px)`; active scales `0.98`; disabled fades to `opacity: 0.55`; loading adds `.is-loading` with a spinner. Keep one primary action per group, sentence-case labels, and full-width on mobile when sole action. Do not place two primary buttons side by side or use `.btn-glow` more than once per screen. Maintain a `44px` touch target, `var(--focus-ring)`, and `aria-busy='true'` while loading.

`<button class='btn btn-primary'>Save and continue</button>`

### Input

Use `.field` wrapping a `label`, `input`/`select`/`textarea`, and an optional `.hint`. `.field-row` creates a two-column layout that stacks on mobile; `.field-file` handles uploads with `.field-photo`. Default state uses `var(--border)` on `var(--bg)`; hover darkens the border to `--primary`; focus removes outline, sets `--primary` border, and adds `var(--focus-ring)`. Disabled fades to `opacity: 0.6`; errors apply `.is-error` or `.has-error` for red border, `--danger-light` background, and `--danger-dark` message. Pair labels via `for` + `id`, mark required with `aria-required='true'`, and link errors with `aria-describedby`. Do not use placeholder text as a label or remove focus indicators.

`<div class='field'><label for='name'>Full name</label><input id='name' type='text'/><p class='hint'>As on your ID.</p></div>`

### Card

Use `.card` for white surfaced containers; `.form-card` adds a header row; `.card-interactive` adds pointer cursor and lift on hover. Default is white, `--shadow`, `--radius-lg`. Hover lifts `translateY(-3px)` with `--shadow-lg`; active scales `0.99`; loading shows skeleton/spinner; errors add a red left border or banner. Keep one primary action per card and padding `24px` desktop / `16px` mobile. Do not nest cards or use a card where a divider is enough. Interactive cards must be focusable and activatable with Enter/Space; do not rely on hover alone.

`<div class='card card-interactive'><h3>Work experience</h3><p>Add your latest role.</p></div>`

### Header / Logo

Use `.header` as a sticky frosted white bar with `.logo`, `.logo-mark`, `.header-actions`, `.lang-switch`, and `.user-avatar`. Default is frosted white with a bottom border; sticky stays at `top: 0` with `z-index: 50`. Keep header height stable, use the SVG `.logo-mark`, and set the wordmark in Inter 800. Do not change the logo color per page or hide the language switch behind a desktop menu. The logo link returns home with an `aria-label`; the language switch identifies the current locale.

`<header class='header'><div class='container'><a class='logo' href='index.html' aria-label='HeadCV home'><span class='logo-mark'></span><span>HeadCV</span></a></div></header>`

### Stepper

Use `.stepper`, `.step`, `.step-dot`, and `.step-line` for dot-and-label progress; `.wizard-stepper` and `.wizard-dot` are the compact wizard variant. Default steps show a gray dot and muted label; active uses a navy dot with halo and scale `1.1`; completed turns green with white check; disabled future steps are visible but not clickable. Keep labels short on mobile and mark completed only after validation. Do not make future steps clickable unless free navigation is allowed, and do not remove labels on desktop. Use `aria-current='step'` on the active step and `aria-label` on completed steps.

`<nav class='stepper' aria-label='Steps'><div class='step completed'><span class='step-dot'>1</span><span>Role</span></div><div class='step-line active'></div><div class='step active' aria-current='step'><span class='step-dot'>2</span><span>Experience</span></div></nav>`

### Builder tabs

Use `.builder-tabs` with `.builder-tab` buttons to switch between Edit, Design, and Preview. Default tab is transparent with muted text; hover darkens to `--text`; active shows white background, navy text, and subtle border/shadow. Keep the set to 2–4 tabs and visually distinguish the active tab from buttons. Do not use builder tabs for wizard steps or nest another tab set inside a panel. Use `role='tablist'`, `role='tab'`, `role='tabpanel'`, and `aria-selected='true'` on the active tab.

`<div class='builder-tabs' role='tablist'><button class='builder-tab active' role='tab' aria-selected='true'>Edit</button><button class='builder-tab' role='tab'>Design</button></div>`

### Score / Progress

Use `.builder-score`, `.score-badge`, `.score-label`, `.score-hint`, `.score-bar`, and `.score-fill` for the resume score; `.progress-bar` and `.progress-fill` handle export/analysis loading. Default badge color reflects the score tier; the fill animates width; completed turns success green at `100%`. Update after meaningful edits, throttled, and pair with a concrete next step. Do not use red above 60% or show a score on the landing page. Expose the value with `role='progressbar'` and `aria-valuenow/min/max`.

`<div class='score-bar' role='progressbar' aria-valuenow='72' aria-valuemin='0' aria-valuemax='100'><div class='score-fill' style='width:72%'></div></div>`

### Skill pill / Badge

Use `.skill-pill` for suggested skill toggles, `.skill-chip` for user-added removable skills, and `.badge` with `.badge-passed`/`.badge-improve`/`.badge-review` for review status; `.pill-green` and `.pill-amber` are generic status pills. Default is sand background with border; hover shifts to `--primary-light` with `--primary` text; active/selected uses navy background and white text; disabled fades to `opacity: 0.5`. Use `.skill-pill` for suggestions and `.skill-chip` for selections; keep text short. Do not use `.badge` as navigation tags or mix green/amber/red meanings in one list. Toggle pills are `button` elements with `aria-pressed`; removable chips expose a visible remove button with an accessible name.

`<button class='skill-pill active' aria-pressed='true'>Project Management</button>`

### Toast

Use `.toast` as a single bottom-right container toggled with `.show`. Hidden state is `translateY(120%)`; visible slides up with bounce easing and auto-dismisses after ~3 seconds. Keep messages under six words and reserve toasts for success only. Do not stack multiple toasts or use them for critical decisions. Set `role='status'` and `aria-live='polite'`; do not move focus into the toast.

`<div class='toast' id='toast' role='status' aria-live='polite'>CV saved</div>`

### Loading

Use `.building-overlay` for full-screen blocking states, `.spinner` for inline rotation, `.bouncing-dots` for typing waits, and `.confetti` for export success. Default overlay shows a progress bar at `0%` with a step label; in-progress fills the bar and updates the label; completion fades the overlay and may trigger confetti once. Show progress for any task longer than one second; use a step label such as 'Analyzing your CV...'. Do not use `.spinner` alone for tasks longer than five seconds or block the UI for client-side-only actions. The overlay uses `role='dialog'` and `aria-busy='true'`; the progress bar exposes accessible values; respect `prefers-reduced-motion`.

`<div class='building-overlay' role='dialog' aria-busy='true'><div class='building-card'><div class='progress-bar'><div class='progress-fill' style='width:45%'></div></div></div></div>`

### Template card

Use `.template-grid`, `.template-card`, `.template-thumb`, and `.selected` for the gallery; `.tmpl-card` is the larger landing-page showcase. Default card is white with a border and thumbnail gradient; hover lifts `translateY(-6px) scale(1.02)`, changes border to `--primary`, and adds `--shadow-lg`; selected adds a navy border and halo ring; locked fades to `opacity: 0.5`. Show the template name and a realistic thumbnail, and update the live preview on selection. Do not use screenshots of other products or auto-select the first template before interaction. Treat cards as radio buttons or buttons with `aria-checked`/`aria-pressed`; selection must be programmatic.

`<div class='template-card selected' role='radio' aria-checked='true'><div class='template-thumb'></div><h4>Professional</h4></div>`

### CV preview

Use `.cv-real` and its child classes for the header, photo, sections, entries, bullets, and tags; theme with `.theme-professional`, `.theme-simple`, or `.theme-creative`. The component renders the user's CV as a realistic A4 document. Default scales to the preview panel; full-page print mode uses `1.05rem` base under `.preview-page`; loading shows `.cv-real-line` placeholders; errors show a fallback message. Keep small type readable, mirror RTL text direction, and do not break page margins or inject UI controls inside `.cv-real`. The preview is not keyboard focusable by default; provide a 'Download PDF' action with a clear accessible name.

`<div class='cv-real theme-professional'><div class='cv-real-header'><div class='cv-real-photo'></div><div><div class='cv-real-name'>Alex Morgan</div><div class='cv-real-title'>Product Designer</div></div></div></div>`

### Wizard shell

Use `.wizard-app`, `.wizard-step`, `.wizard-step-header`, `.wizard-form`, `.wizard-actions`, `.wizard-stepper`, `.wizard-dot`, `.wizard-bottom-sticky`, and `.ready-screen`/`.ready-cards` for the 8-step flow and completion screen. Steps default to hidden; active steps display with an entrance animation; completed dots turn green; active dots turn navy and scale; ready cards lift on hover. Always allow backward navigation and persist answers between steps. Do not reset the form on refresh or hide the stepper on desktop. Mark the active step with `aria-current='step'` and keep the sticky bottom bar keyboard reachable.

`<div class='wizard-step active'><div class='wizard-step-header'><h2>Personal details</h2><p>Let us start with the basics.</p></div><div class='wizard-form'>...</div></div>`

### Empty / Auth states

Use `.empty-state` for dashboards and galleries with no results, `.auth-card` for sign-up/log-in, `.setup-card` for the first-question screen, `.delete-card` for confirmation, and `.builder-empty` for the builder before sections are added. Default is a centered layout with muted text and an illustration or icon; CTA hover follows the primary button state; loading shows the primary button spinner; errors show inline field messages. Explain why the screen is empty and provide one primary action. Do not use generic 'No data' messages or hide the sign-up link behind a modal-only entry. Empty-state illustrations should have empty `alt` if decorative; auth forms follow standard label + input + error patterns.

`<div class='empty-state'><h3>No CVs yet</h3><p>Build your first CV in under 5 minutes.</p><a class='btn btn-primary' href='setup.html'>Get started</a></div>`

---

## Patterns

### Forms

- One primary action per form card.
- Group related fields in `.field-row` and let them stack on mobile.
- Use hints for formatting guidance, not placeholders.
- Validate on blur for individual fields; validate the full card on continue.
- Inline errors appear below the field with a red border and message.

### Feedback & validation

- Success: green badge, toast, or inline check.
- Warning/Improve: amber badge, actionable finding.
- Error: red border, red message, focus moved to the first invalid field.
- Score changes are throttled and paired with a concrete next step.

### Loading

- Show a spinner after 300ms for local actions.
- Show a progress bar for PDF generation or server analysis.
- Keep the user informed with a step label such as 'Analyzing your CV...'.
- Prevent duplicate submissions while loading.

### Empty & error states

- Empty states explain the situation and offer a single primary action.
- Error states include a recovery path: retry, go back, or contact support.
- Full-page errors use the `.empty-state` pattern with an error icon.

### Review findings

- Findings are deterministic and grouped by section.
- Each `.finding` row has an icon, a short label, and a status badge.
- Hovering a finding highlights the related preview section.
- Clicking a finding scrolls the editor to the relevant field.

---

## RTL & i18n

- Arabic pages use `lang='ar' dir='rtl'` and load `Noto Sans Arabic`.
- `styles.css` contains `[dir='rtl']` overrides for `text-align: right`, `flex-direction` and `grid` mirror, `margin-left` / `margin-right` swaps, and `border-radius` corner flips.
- Directional SVG icons flip horizontally in RTL via `transform: scaleX(-1)` or asset swap.
- Number display and percentages remain LTR inside the Arabic UI.
- Builder grid flips order in RTL so the preview panel sits on the left and editor on the right.
- Toast moves from `right: 24px` to `left: 24px` in RTL.

### Checklist for new RTL screens

- Add `dir='rtl'` to the `<html>` element.
- Load `Noto Sans Arabic` before first render.
- Test tab order, focus rings, and arrow-key navigation.
- Flip or mirror directional icons.
- Keep percentages, phone numbers, and dates in a consistent format.

---

## Accessibility

### WCAG target

- Target: WCAG 2.1 Level AA for all user-facing screens.
- Operable: all interactive elements reachable by keyboard.
- Understandable: form errors explain how to fix the problem.
- Robust: ARIA roles and labels match the visual state.

### Contrast

- Navy on white and sand passes WCAG AA for normal text.
- Gold is only used for icons, stars, and large numbers, not small text.
- Muted text on `--surface` passes AA.
- Error text on `--danger-light` passes AA.

### Focus

- All interactive elements receive `var(--focus-ring)`.
- Focus order follows the visual order in both LTR and RTL.
- Focus rings are not clipped by overflow or sticky headers.

### Reduced motion

- If `prefers-reduced-motion: reduce` is active, disable `pageIn`, `sectionIn`, `previewIn`, `floatCard`, `confetti-fall`, `paper-stack`, `spinner`, and `bouncing-dots`.
- Keep instant state changes such as color and border transitions.

### Touch targets

- Buttons and tappable cards are at least `44px` in responsive views.
- Inputs have at least `12px` vertical padding.
- Wizard sticky buttons are full-width on mobile.

### Screen readers

- Headings follow a logical order (`h1` through `h4`).
- Decorative images have empty `alt` attributes.
- Icons not paired with text have an `aria-label`.
- Live regions announce score changes and toast messages.

### Alt text

- Logo mark: `alt='HeadCV home'`.
- Template thumbnails: `alt='Preview of the Professional template'`.
- User avatars: `alt='Profile photo of [Name]'` or empty if decorative.
- Hero illustrations: empty `alt` because surrounding text describes the value.

---

## Implementation notes

### CSS custom properties

All live tokens are declared in `:root` inside `html-mocks/styles.css`. Production code should import or copy this block as the first stylesheet. New tokens must be added to `:root` before they are referenced in component CSS.

### Future React / Tailwind mapping

When the frontend moves to React + Tailwind, map semantic tokens to a Tailwind theme:

- `colors.primary` → `var(--primary)`
- `colors.background` → `var(--bg)`
- `fontFamily.display` → `var(--font-display)`
- `borderRadius.lg` → `var(--radius-lg)`
- `boxShadow.card` → `var(--shadow)`

Keep component class names stable so the migration is mostly a token swap.

### Migration path from mocks to production

1. Freeze this doc and `styles.css` together at gate G2.
2. Copy `:root` tokens into production CSS or design-token pipeline.
3. Port component classes one family at a time: Button, Input, Card, Header, Stepper, Builder tabs, Score, Skill pill/Badge, Toast, Loading, Template card, CV preview, Wizard shell, Empty/Auth.
4. Add tests for contrast, focus order, and RTL mirroring before deleting the mocks.
5. Deprecate mock-only classes after they are replaced by production components.

---

## Governance & versioning

### Owners

- **brand-designer**  voice, color, typography, imagery, and content rules.
- **web-ui-engineer**  token implementation, component CSS, accessibility, and performance.

### Review cadence

- **Per mock iteration**  update this doc when a new mock introduces a component or token.
- **Pre-freeze review**  full review before gate G2.
- **Post-freeze changes**  require a changelog entry and owner sign-off.

### Changelog

| Date | Author | Change |
|------|--------|--------|
| 2026-08-19 | brand-designer + web-ui-engineer | Initial draft extracted from `styles.css` and core mocks. |

### Deprecation

- Mark deprecated tokens with a comment in `styles.css` and a note in the changelog.
- Keep deprecated tokens for at least one release cycle.
- Remove only after all mocks and production components are updated.

### Freeze gate G2

Gate G2 is reached when this doc and `styles.css` are approved together. Until then, tokens and component structures may change. After freeze, the data schema and frontend slices are unblocked.

---

## Feedback log

| Date | Round | Founder feedback | Change made |
|------|-------|------------------|-------------|
| 2026-08-19 | 1 | Initial freeze drafted from HTML mocks. | Created doc; tokens and components extracted from `styles.css` and `index.html` / `builder.html` / `wizard.html`. |

---

## Freeze checklist

- [ ] Founder approved style freeze on: `YYYY-MM-DD` (mock + this doc frozen together).
- [ ] No unused or undocumented tokens remain in `styles.css`.
- [ ] All 14 core component families are mapped in the Shared UI section.
- [ ] Raw and semantic color tokens are documented with contrast notes.
- [ ] Typography, spacing, radius, elevation, and motion tokens are documented.
- [ ] RTL / Arabic rules are documented.
- [ ] Accessibility rules are documented, including reduced-motion and focus handling.
- [ ] Content & UX writing rules are documented.
- [ ] Governance, changelog, and deprecation rules are documented.
- [ ] Feedback log includes at least the initial extraction round.
