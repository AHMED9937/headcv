# User Flows  Universal CV Builder v1

This document maps every v1 screen, journey, action, and state based on `user-stories.md`. It contains no screens outside the v1 (Must) scope and no orphan buttons.

---

## Journeys

### J1  First-time guest creates and exports a CV

**Goal:** A non-technical user lands, answers setup, chooses a template, fills content, reviews, designs, and exports a PDF  without signing in.

1. `Landing` → clicks `Create my CV`.
2. `Quick setup` → chooses language, target job, experience level.
3. `Template gallery` → picks recommended template or uses default.
4. `Personal details` → enters name, title, contact, optional photo/links.
5. `Work experience` → adds roles with tips and phrase patterns.
6. `Education` → adds schools/degrees or skips.
7. `Skills` → adds skills manually or from suggestions.
8. `Summary` → fills guided summary or skips.
9. `Additional sections` → adds optional sections or skips.
10. `Review` → checks `Improve CV` findings and fixes issues.
11. `Design` → changes template, accent, font, density, paper size.
12. `Export` → previews pages, names file, downloads PDF.
13. `Account prompt` → creates account or continues as guest.

### J2  Returning user edits and re-exports a CV

**Goal:** A logged-in user opens an existing CV, updates it, and exports again.

1. `Dashboard` → selects a CV.
2. `Builder` (resumes at last incomplete or selected step) → edits any section.
3. `Review` → re-runs checks.
4. `Design` → adjusts look if needed.
5. `Export` → downloads updated PDF.
6. `Dashboard` → returns to list.

### J3  User reviews and fixes CV before export

**Goal:** A user uses the deterministic review checklist to find and fix issues.

1. `Builder` on any step → clicks `Review` or `Improve CV`.
2. `Review` → sees findings grouped by section.
3. Clicks a finding → focuses the exact field in the related step.
4. Edits the field → autosaves.
5. Returns to `Review` → findings update.
6. Clicks `Export` when ready.

### J4  User customizes design and template

**Goal:** A user changes the visual style without losing content.

1. `Builder` any step → clicks `Design` step or design panel.
2. `Design` → changes template, accent, font set, text scale, density, divider, A4/Letter.
3. Preview updates in real time.
4. Clicks `Export` or `Back to content`.

### J5  Guest converts to account and manages CVs

**Goal:** A guest creates an account after seeing value and manages saved CVs.

1. `Export` success → sees `Create account to save your CV` prompt.
2. Clicks `Create account` → `Sign up`.
3. Enters email, password → `Sign up` API call.
4. `Verify email` (if required) → clicks link.
5. `Dashboard` → sees migrated CV.
6. Renames, duplicates, archives, edits, or deletes CVs.

---

## Screens table

| Screen | Route | Purpose | Reached from |
|---|---|---|---|
| **Landing** | `/` | Explain product, show CTA, disclose commercial rules. | Direct entry, `Sign out`, external link. |
| **Quick setup** | `/setup` | Capture language, target job, experience level. | `Landing` → `Create my CV`. |
| **Template gallery** | `/templates` | Recommend and let user choose a template. | `Quick setup` → `Continue`. |
| **Personal details** | `/builder/personal` | Enter name, title, contact, photo, links. | `Template gallery` → `Continue`, stepper. |
| **Work experience** | `/builder/experience` | Add job history with tips and phrase patterns. | `Personal details` → `Continue`, stepper, review link. |
| **Education** | `/builder/education` | Add education entries. | `Work experience` → `Continue`, stepper, review link. |
| **Skills** | `/builder/skills` | Add and order skills. | `Education` → `Continue`, stepper, review link. |
| **Summary** | `/builder/summary` | Build summary from user facts. | `Skills` → `Continue`, stepper, review link. |
| **Additional sections** | `/builder/additional` | Add optional sections or finish. | `Summary` → `Continue`, stepper, review link. |
| **Review** | `/builder/review` | Show transparent checklist and findings. | Stepper, `Improve CV` button, `Builder` any step. |
| **Design** | `/builder/design` | Change template and visual style. | Stepper, design panel toggle. |
| **Export** | `/builder/export` | Preview, name file, download PDF. | Stepper, `Review` → `Export`, `Design` → `Export`. |
| **Sign up** | `/auth/signup` | Create account from guest. | `Account prompt`, `Sign in` → `Create account`. |
| **Log in** | `/auth/login` | Log in to existing account. | Landing header, `Account prompt` → `Log in`, `Sign up` → `Already have an account`. |
| **Forgot password** | `/auth/forgot-password` | Request password reset. | `Log in` → `Forgot password`. |
| **Verify email** | `/auth/verify-email` | Confirm email address. | Email link after sign up. |
| **Dashboard** | `/dashboard` | List, rename, duplicate, archive, delete CVs. | `Sign up`/`Log in` completion, landing if logged in with CVs, `Account prompt` → `Go to dashboard`. |
| **Settings** | `/settings` | Export account data, delete account, update profile. | `Dashboard` → menu, header avatar. |

---

## Key actions matrix

### Landing

| Action | Intended API effect | Data touched |
|---|---|---|
| Click `Create my CV` | Creates a new guest CV session. | `cv` (new, empty), `session` (guest), `analytics.event: landing_cta_click`. |
| Click `Sign in` | none (client-only) | none  navigates to `/auth/login`. |
| Select language from header/footer (if present) | none (client-only) | `i18n.locale` (client). |

### Quick setup

| Action | Intended API effect | Data touched |
|---|---|---|
| Select CV language | none (client-only) | `cv.settings.language` (client). |
| Type/select target job | `GET /api/job-titles?query=` | `jobTitleSuggestions` (client). |
| Select experience level | none (client-only) | `cv.settings.experienceLevel` (client). |
| Click `Continue` | `PATCH /api/cv/:id` saves setup answers; returns recommended templates and section order. | `cv.settings.language`, `cv.settings.targetJob`, `cv.settings.experienceLevel`, `cv.sectionsOrder`, `templateRecommendations`. |
| Click `Back` | none (client-only) | none  navigates to `/`. |

### Template gallery

| Action | Intended API effect | Data touched |
|---|---|---|
| Select category filter | none (client-only) | `templateFilter` (client). |
| Click a template card | none (client-only) | `cv.settings.templateId` (client preview). |
| Click `Use recommended` | none (client-only) | `cv.settings.templateId` set to default. |
| Click `Continue` | `PATCH /api/cv/:id` saves selected template. | `cv.settings.templateId`, `cv.settings.lastStep`. |
| Click `Back` | none (client-only) | none  navigates to `/setup`. |
| Switch template after preview | none (client-only) | `cv.settings.templateId` (client); content preserved. |

### Personal details

| Action | Intended API effect | Data touched |
|---|---|---|
| Type in name, title, email, phone, location | `PATCH /api/cv/:id` (debounced autosave) | `cv.data.personal.*`. |
| Expand `Add photo` / `Add links` | none (client-only) | none  UI state. |
| Upload photo | `POST /api/upload` (or client-side base64 for preview) | `cv.data.personal.photoUrl` or file. |
| Add a link | `PATCH /api/cv/:id` (autosave) | `cv.data.personal.links[]`. |
| Click `Continue` | `PATCH /api/cv/:id` save and update `lastStep`. | `cv.data.personal`, `cv.sections.personal.status`. |
| Click `Back` | none (client-only) | none  navigates to `/templates`. |
| Click `Skip` | none (client-only) | `cv.sections.personal.status = skipped`; navigates to `/builder/experience`. |
| Click stepper step | none (client-only) | none  navigates to selected step. |
| Toggle language/RTL (header) | `PATCH /api/cv/:id` if confirmed, save language; else client-only. | `cv.settings.language`, `cv.settings.direction`. |

### Work experience

| Action | Intended API effect | Data touched |
|---|---|---|
| Click `+ Add role` | none (client-only) | `cv.data.experience[]` (new empty entry, client). |
| Type job title, employer, location, dates | `PATCH /api/cv/:id` (debounced) | `cv.data.experience[i].*`. |
| Toggle `Current role` | none (client-only) | `cv.data.experience[i].current`; hides end date. |
| Focus bullet field | `GET /api/phrases?jobTitle=` | `phraseSuggestions` (client). |
| Select phrase pattern | none (client-only) | `cv.data.experience[i].bullets[j]` with placeholder markers. |
| Fill placeholder | `PATCH /api/cv/:id` (debounced) | `cv.data.experience[i].bullets[j]`. |
| Add/remove bullet | `PATCH /api/cv/:id` | `cv.data.experience[i].bullets[]`. |
| Duplicate/delete role | `PATCH /api/cv/:id` | `cv.data.experience[]`. |
| Click `Continue` | `PATCH /api/cv/:id` save and update `lastStep`. | `cv.data.experience`, `cv.sections.experience.status`. |
| Click `Back` | none (client-only) | none  navigates to `/builder/personal`. |
| Click `Skip` | none (client-only) | `cv.sections.experience.status = skipped`. |

### Education

| Action | Intended API effect | Data touched |
|---|---|---|
| Click `+ Add education` | none (client-only) | `cv.data.education[]` (new empty entry). |
| Type institution, qualification, field, location, dates | `PATCH /api/cv/:id` (debounced) | `cv.data.education[i].*`. |
| Reorder education before work (for entry-level) | `PATCH /api/cv/:id` | `cv.sectionsOrder[]`. |
| Duplicate/delete entry | `PATCH /api/cv/:id` | `cv.data.education[]`. |
| Click `Continue` | `PATCH /api/cv/:id` save and update `lastStep`. | `cv.data.education`, `cv.sections.education.status`. |
| Click `Back` | none (client-only) | none  navigates to `/builder/experience`. |
| Click `Skip` | none (client-only) | `cv.sections.education.status = skipped`. |

### Skills

| Action | Intended API effect | Data touched |
|---|---|---|
| Type skill in tag input | `GET /api/skills?query=` | `skillSuggestions` (client). |
| Check a suggested skill | `PATCH /api/cv/:id` | `cv.data.skills[]` (adds skill with optional level). |
| Type and add custom skill | `PATCH /api/cv/:id` | `cv.data.skills[]`. |
| Remove skill | `PATCH /api/cv/:id` | `cv.data.skills[]`. |
| Reorder skills | `PATCH /api/cv/:id` | `cv.data.skills[].order`. |
| Change proficiency level | `PATCH /api/cv/:id` | `cv.data.skills[i].level`. |
| Click `Continue` | `PATCH /api/cv/:id` save and update `lastStep`. | `cv.data.skills`, `cv.sections.skills.status`. |
| Click `Back` | none (client-only) | none  navigates to `/builder/education`. |
| Click `Skip` | none (client-only) | `cv.sections.skills.status = skipped`. |

### Summary

| Action | Intended API effect | Data touched |
|---|---|---|
| Fill prompt fields (e.g., years, strength, achievement) | none (client-only) | `summaryBuilder.inputs` (client). |
| Generate summary from prompts | none (client-only) | `cv.data.summary` (assembled from inputs, client-side). |
| Edit generated summary | `PATCH /api/cv/:id` (debounced) | `cv.data.summary`. |
| Click `Continue` | `PATCH /api/cv/:id` save and update `lastStep`. | `cv.data.summary`, `cv.sections.summary.status`. |
| Click `Back` | none (client-only) | none  navigates to `/builder/skills`. |
| Click `Skip` | none (client-only) | `cv.sections.summary.status = skipped`. |

### Additional sections

| Action | Intended API effect | Data touched |
|---|---|---|
| Click `Add section` | none (client-only) | `additionalSectionsMenu` (client UI). |
| Select an additional section (e.g., certificates) | none (client-only) | `cv.data[sectionKey]` initialized empty. |
| Fill section fields | `PATCH /api/cv/:id` (debounced) | `cv.data[sectionKey][].*` |
| Rename custom section | `PATCH /api/cv/:id` | `cv.data.custom[].title`. |
| Hide/delete section | `PATCH /api/cv/:id` | `cv.sections[sectionKey].status = hidden` or `cv.data[sectionKey]` removed. |
| Click `Continue` | `PATCH /api/cv/:id` save and update `lastStep`. | `cv.data.*`, `cv.sections.*.status`. |
| Click `Back` | none (client-only) | none  navigates to `/builder/summary`. |
| Click `Skip` for an optional section | none (client-only) | `cv.sections[sectionKey].status = skipped`. |

### Review

| Action | Intended API effect | Data touched |
|---|---|---|
| Load review | `POST /api/cv/:id/review` (or client-side rule engine) | `reviewFindings` (computed). |
| Click a finding | none (client-only) | none  navigates to the field, preserves `reviewScrollPosition`. |
| Fix field and return to review | `PATCH /api/cv/:id` (autosave); review re-computed. | `cv.data.*`, `reviewFindings`. |
| Expand/collapse section | none (client-only) | none  UI state. |
| Click `Export` | none (client-only) | none  navigates to `/builder/export`. |
| Click `Design` | none (client-only) | none  navigates to `/builder/design`. |

### Design

| Action | Intended API effect | Data touched |
|---|---|---|
| Select template | `PATCH /api/cv/:id` (debounced) | `cv.settings.templateId`. |
| Select accent color | none (client-only) | `cv.settings.accentColor` (client preview, then autosave). |
| Select font set | `PATCH /api/cv/:id` (debounced) | `cv.settings.fontSet`. |
| Change text scale | `PATCH /api/cv/:id` (debounced) | `cv.settings.textScale`. |
| Change density | `PATCH /api/cv/:id` (debounced) | `cv.settings.density`. |
| Change divider style | `PATCH /api/cv/:id` (debounced) | `cv.settings.dividerStyle`. |
| Toggle A4/Letter | `PATCH /api/cv/:id` (debounced) | `cv.settings.paperSize`. |
| Click `Export` | none (client-only) | none  navigates to `/builder/export`. |
| Click `Back to content` | none (client-only) | none  navigates to previous content step. |
| Click `Undo` / `Redo` | `POST /api/cv/:id/undo` or `redo` (or client-side history) | `cv.settings.*`, `cv.undoStack`, `cv.redoStack`. |

### Export

| Action | Intended API effect | Data touched |
|---|---|---|
| Load export screen | `GET /api/cv/:id/preview` or client-side render | `cv.data.*`, `cv.settings.*`, `pageCount`, `pagePreviews[]`. |
| Edit filename | none (client-only) | `export.filename` (client). |
| Toggle A4/Letter (already set in Design) | none (client-only) | none  reflects `cv.settings.paperSize`. |
| Click `Download PDF` | `POST /api/cv/:id/export/pdf` | `cv.data.*`, `cv.settings.*` → `pdfFile` (stream/download). |
| Click `Preview as plain text` | none (client-only) | `plainTextPreview` (client render). |
| Click `Create account to save` | none (client-only) | none  shows `Account prompt` modal or navigates to `/auth/signup`. |
| Click `Maybe later` | none (client-only) | none  stays on export or returns to dashboard if logged in. |
| Click `Back` | none (client-only) | none  navigates to `/builder/design` or `/builder/review`. |

### Sign up

| Action | Intended API effect | Data touched |
|---|---|---|
| Type email | none (client-only) | `form.email`. |
| Type password | none (client-only) | `form.password`. |
| Confirm password | none (client-only) | `form.confirmPassword`. |
| Click `Sign up` | `POST /api/auth/signup`; then `POST /api/cv/:id/migrate-to-user` | `user` (new), `cv.userId` (migrated), `session`. |
| Click `Log in` link | none (client-only) | none  navigates to `/auth/login`. |

### Log in

| Action | Intended API effect | Data touched |
|---|---|---|
| Type email | none (client-only) | `form.email`. |
| Type password | none (client-only) | `form.password`. |
| Click `Log in` | `POST /api/auth/login`; then `POST /api/cv/:id/migrate-to-user` if guest CV exists. | `user`, `session`, `cv.userId` (if migration). |
| Click `Forgot password` | none (client-only) | none  navigates to `/auth/forgot-password`. |
| Click `Sign up` link | none (client-only) | none  navigates to `/auth/signup`. |

### Forgot password

| Action | Intended API effect | Data touched |
|---|---|---|
| Type email | none (client-only) | `form.email`. |
| Click `Send reset link` | `POST /api/auth/forgot-password` | `email` (used for token). |
| Click `Back to log in` | none (client-only) | none  navigates to `/auth/login`. |

### Verify email

| Action | Intended API effect | Data touched |
|---|---|---|
| Open from email link | `GET /api/auth/verify-email?token=` | `user.emailVerified`. |
| Click `Continue to dashboard` | none (client-only) | none  navigates to `/dashboard`. |

### Dashboard

| Action | Intended API effect | Data touched |
|---|---|---|
| Load dashboard | `GET /api/cvs` | `cvs[]` (list). |
| Click `Create new CV` | Creates new empty CV or guest session. | `cv` (new), `session` or `cv.userId`. |
| Click `Edit` on a CV | `GET /api/cv/:id` | `cv` loaded; navigates to last step. |
| Click `Rename` | `PATCH /api/cv/:id` | `cv.title`. |
| Click `Duplicate` | `POST /api/cv/:id/duplicate` | `cv` (new copy). |
| Click `Archive` | `PATCH /api/cv/:id` | `cv.status = archived`. |
| Click `Restore` | `PATCH /api/cv/:id` | `cv.status = active`. |
| Click `Delete` (with confirmation) | `DELETE /api/cv/:id` | `cv` removed. |
| Click `Settings` | none (client-only) | none  navigates to `/settings`. |
| Click `Sign out` | `POST /api/auth/logout` | `session` cleared; navigates to `/`. |

### Settings

| Action | Intended API effect | Data touched |
|---|---|---|
| Click `Export my data` | `GET /api/account/export-data` | `user`, `cvs[]` (JSON download). |
| Click `Delete account` (with confirmation) | `DELETE /api/account` | `user`, `cvs[]` deleted. |
| Change language | `PATCH /api/user` (if saved) or client-only. | `user.language` or `i18n.locale`. |
| Click `Back to dashboard` | none (client-only) | none  navigates to `/dashboard`. |

---

## Empty / error / loading states per screen

| Screen | Empty state | Error state | Loading state |
|---|---|---|---|
| **Landing** | No CVs shown; CTA visible. | None. | Static; no loading. |
| **Quick setup** | Form starts empty; language defaults to browser. | Invalid job title is allowed (falls back to General CV). No blocking errors. | Job suggestions loading spinner while typing. |
| **Template gallery** | No templates if none match filter. | Failed to load previews: retry button. | Skeleton cards while templates load. |
| **Personal details** | Form fields empty; optional fields collapsed. | Invalid email/phone/URL inline warning. | Autosave `Saving...` badge. |
| **Work experience** | No roles; `+ Add role` visible. | End date before start date; unresolved placeholders. | Phrase suggestions loading. |
| **Education** | No entries; `+ Add education` visible. | End date before start date. | Autosave `Saving...` badge. |
| **Skills** | No skills; suggestion chips visible. | Duplicate skill warning. | Skill suggestions loading. |
| **Summary** | Builder fields empty; summary blank. | None. | Autosave `Saving...` badge. |
| **Additional sections** | No sections added; `Add section` visible. | None. | Autosave `Saving...` badge. |
| **Review** | No findings if CV is complete. | Rule engine fails: show generic checklist. | `Analyzing...` spinner. |
| **Design** | Defaults to current template/design. | Contrast/font warning. | Preview re-rendering indicator. |
| **Export** | No pages if CV is empty. | PDF generation fails: error + retry. | `Generating PDF...` progress. |
| **Sign up** | Form empty. | Email in use, invalid password, password mismatch. | `Creating account...` spinner. |
| **Log in** | Form empty. | Invalid credentials, account not verified. | `Logging in...` spinner. |
| **Forgot password** | Email input empty. | Email not found. | `Sending...` spinner. |
| **Verify email** | Waiting for token. | Invalid/expired token. | `Verifying...` spinner. |
| **Dashboard** | Empty state: "No CVs yet. Create one." | Failed to load CVs: retry. | Skeleton list. |
| **Settings** | No data; buttons disabled until loaded. | Failed to export data: retry. | `Loading...` spinner. |

---

## Flow checks

- **No orphan buttons:** Every button in the key actions matrix above has an intended API effect or is explicitly marked `none (client-only)`.
- **No screens outside v1 scope:** This document includes only the 13 core builder steps, landing, setup, template gallery, auth (signup/login/forgot/verify), dashboard, and settings. Should/Later features (DOCX, import, LinkedIn, share link, job ad comparison, version history, billing, AI) are not mapped to new screens in v1.
- **No AI screens:** All flows use deterministic, rule-based interactions only.
