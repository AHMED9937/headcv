# User Stories  Universal CV Builder v1

## v1 scope summary

v1 ships a guest-first, Arabic/English CV builder that guides a non-technical job seeker through quick setup, template selection, structured content entry, deterministic review, and PDF export with delayed account creation  using original, RTL-ready templates and no AI.

## Release success metric

A first-time user, without signing in, clicks `Create my CV`, completes the quick setup, fills at least personal and work experience details, exports a PDF, and creates an account in the same session  in either English or Arabic.

---

## Quick navigation

| ID | Title | Group | Trace |
|---|---|---|---|
| M1 | Guest starts from one CTA | Must | M1.1–M1.3 |
| M2 | Quick setup guides the CV | Must | M1.4–M1.6, M2.5 |
| M3 | Choose from recommended templates | Must | M2.1–M2.4 |
| M4 | Enter personal details | Must | M3.1–M3.2, M5.1–M5.2 |
| M5 | Add work experience with guided tips | Must | M3.3, M4.1–M4.3 |
| M6 | Add education and relevant skills | Must | M3.4–M3.5, M4.4 |
| M7 | Complete summary and optional sections | Must | M3.6–M3.7, M3.9 |
| M8 | Reorder and manage sections safely | Must | M3.8, M6.2 |
| M9 | Review CV with transparent checklist | Must | M4.5–M4.7, M7.1–M7.2 |
| M10 | Customize design within safe limits | Must | M6.1, M6.3 |
| M11 | Export a professional PDF | Must | M7.3–M7.6 |
| M12 | Convert guest to account after value | Must | M8.1–M8.6 |
| M13 | Build in Arabic or English | Must | M2.3, M6.5, M9.1 |
| M14 | Use the builder on any device | Must | M5.2, M5.7, M9.2 |
| M15 | Rely on fast, stable performance | Must | M5.3–M5.6, M9.3 |
| M16 | Trust the security of the product | Must | M9.4–M9.5, M8.2 |
| M17 | Know my data stays private in analytics | Must | M9.6 |
| S1 | Export DOCX | Should | S1 |
| S2 | Import an existing CV | Should | S2 |
| S3 | Import LinkedIn data | Should | S3 |
| S4 | Add more templates | Should | S4 |
| S5 | Share a private link | Should | S5 |
| S6 | Compare against a job ad | Should | S6 |
| S7 | Restore a past version | Should | S7 |
| S8 | Understand pricing and billing | Should | S8 |
| L1 | AI first draft | Later | L1 |
| L2 | AI rewrite | Later | L2 |
| L3 | AI job tailoring | Later | L3 |
| L4 | AI translation | Later | L4 |
| L5 | AI import assistance | Later | L5 |

---

## How to read this table

| Column | Purpose |
|---|---|
| **Title** | Short, action-oriented story name. |
| **User story** | `As a / I want / so that` in one sentence. |
| **Acceptance criteria** | Numbered, independently testable outcomes (multiple per story). |
| **Description** | Why this story matters and what it covers. |
| **Trace** | Requirement IDs from `requirements.md`. |

> **Tip for long tables:** use your markdown viewer's in-page search (Ctrl+F) to find an ID, or jump to the group section below.

---

## Must (v1)

| Title | User story | Acceptance criteria | Description | Trace |
|---|---|---|---|---|
| **M1  Guest starts from one CTA** | As a non-technical job seeker, I want one clear `Create my CV` action on the landing page, so that I can start building a CV immediately without signing in. | <ol><li>One primary `Create my CV` action on the landing page.</li><li>`Sign in` is visible but secondary and never required to reach the builder.</li><li>Free, account, and paid rules are disclosed before setup starts.</li><li>Disclosure is on or before the landing page, not hidden in export.</li><li>Responsive CTA reachable within one viewport on desktop and mobile.</li><li>Meets WCAG 2.2 AA for contrast, focus, and screen-reader labels.</li><li>Analytics tracks landing view, CTA click, and disclosure without CV text.</li></ol> | Remove choice paralysis and be honest about commercial rules before the user commits time. | M1.1, M1.2, M1.3 |
| **M2  Quick setup guides the CV** | As a job seeker, I want to answer three setup questions (language, target job, experience level), so that the product can recommend the right template and section order. | <ol><li>Setup asks exactly three questions: CV language, target job, experience level.</li><li>Language defaults to browser language but is editable.</li><li>Target job has curated suggestions and a manual fallback.</li><li>Experience level has clear options.</li><li>Product recommends section order and up to three templates with a default selected.</li><li>User can continue with the default or choose another.</li><li>Back navigation does not lose input.</li><li>Progress is saved in the guest session.</li></ol> | Capture minimal context to personalize the experience and prevent template choice overload. | M1.4, M1.5, M1.6, M2.5 |
| **M3  Choose from recommended templates** | As a job seeker, I want to see template cards with previews, categories, and safe defaults, so that I can pick a professional look without design skill. | <ol><li>Cards show full-page preview, name, style, ATS-safe label, page behavior, Free/Paid state.</li><li>Filters for Simple, Professional, Modern, Creative work; Creative may be empty or paid at launch.</li><li>Recommended default is shown first or highlighted.</li><li>Switching templates does not lose or reorder content.</li><li>User can skip the gallery and use the default.</li><li>Only v1 templates are visible; paid templates are marked.</li><li>Previews render in selected language and direction.</li><li>Selecting a template opens the editor.</li></ol> | Let the user feel confident about the visual outcome before writing content. | M2.1, M2.2, M2.3, M2.4 |
| **M4  Enter personal details** | As a job seeker, I want to enter my name, title, contact info, and optional photo/links, so that my CV header is complete and professional. | <ol><li>Form collects name, title, email, phone, location.</li><li>Optional fields (photo, links) are collapsed by default.</li><li>Live preview updates within 300 ms.</li><li>Mobile uses Editor/Preview tabs; desktop is side-by-side.</li><li>Email, phone, and URL are validated.</li><li>Photo upload is optional and supports common formats with size limits.</li><li>Stepper progress reflects required fields only.</li><li>User can skip optional fields or the step if all required fields are empty.</li></ol> | Make the first content step simple and show instant results. | M3.1, M3.2, M5.1, M5.2 |
| **M5  Add work experience with guided tips** | As a job seeker, I want to add my work history with job-specific tips and editable phrase patterns, so that I can write strong bullets without AI. | <ol><li>Repeatable roles with job title, employer, location, dates, current, bullets.</li><li>Each role has multiple bullet points.</li><li>Job-title-filtered tips appear on bullet focus.</li><li>Curated phrase patterns are searchable by job title.</li><li>Phrases with unresolved placeholders cannot be accepted until edited.</li><li>All accepted text remains fully editable.</li><li>System does not invent achievements, skills, or numbers.</li><li>Date validation prevents end dates before start dates.</li><li>Current role hides end date.</li></ol> | Help non-technical users write strong experience bullets with deterministic, editable guidance. | M3.3, M4.1, M4.2, M4.3 |
| **M6  Add education and relevant skills** | As a job seeker, I want to add my education and select relevant skills, so that my CV shows my background clearly. | <ol><li>Repeatable education entries with institution, qualification, field, dates, details.</li><li>Low-experience users can place education before work after confirmation.</li><li>Skills support manual entry, search, categories, reorder, optional level.</li><li>Job-title skill suggestions appear unchecked.</li><li>User must explicitly check each skill.</li><li>Suggested skills never auto-appear in preview.</li><li>Duplicate skills are prevented or warned.</li><li>Skills can be reordered and levels changed.</li></ol> | Add structure with education and skills while keeping the user in control. | M3.4, M3.5, M4.4 |
| **M7  Complete summary and optional sections** | As a job seeker, I want a guided summary and the option to add extra sections, so that my CV is complete without being forced. | <ol><li>Summary uses fill-in-the-blank formulas from user-selected facts.</li><li>User reviews and edits the generated summary before it is saved.</li><li>Summary can be skipped and added later.</li><li>Additional sections include languages, certificates, courses, projects, volunteering, awards, publications, references, hobbies, internships, activities, custom.</li><li>Each additional section is optional and has Skip / Not applicable.</li><li>Custom sections can be renamed.</li><li>Stepper shows completed and skipped steps.</li><li>Returning opens the last incomplete step.</li></ol> | Build summary from facts, not AI, and never require an optional section. | M3.6, M3.7, M3.9 |
| **M8  Reorder and manage sections safely** | As a job seeker, I want to add, edit, duplicate, hide, delete, rename, and reorder sections safely, so that I can structure my CV. | <ol><li>User can add, edit, duplicate, hide, delete, rename, reorder sections.</li><li>Reordering supports drag-and-drop and keyboard buttons.</li><li>No free-position text boxes or graphics.</li><li>Content stays in semantic sections.</li><li>Template and design changes never delete, rewrite, or reorder content.</li><li>Hidden sections are preserved but not shown in preview or export.</li><li>Duplicate creates an independent copy.</li><li>Rename applies only to supported sections.</li></ol> | Give structure control without letting the user break the document. | M3.8, M6.2 |
| **M9  Review CV with transparent checklist** | As a job seeker, I want a transparent `Improve CV` checklist that points to exact issues, so that I can fix problems before exporting. | <ol><li>Review panel opens from `Review` step or `Improve CV` button.</li><li>Findings are grouped by section.</li><li>Each finding explains the rule and links to the exact field.</li><li>Clicking a finding focuses the field; returning preserves review position.</li><li>Checks include missing data, impossible dates, placeholders, duplicates, long bullets, spelling, missing contact, overflow, privacy.</li><li>Status is Passed/Improve/Review, not an ATS score.</li><li>All checks are deterministic; no AI calls.</li><li>Review updates in real time as issues are fixed.</li><li>User can export after seeing the checklist.</li></ol> | Replace opaque AI scores with deterministic, explainable checks. | M4.5, M4.6, M4.7, M7.1, M7.2 |
| **M10  Customize design within safe limits** | As a job seeker, I want to change template, accent, font set, density, and paper size within tested limits, so that my CV looks professional without breaking layout. | <ol><li>Controls: template, accent, font set, text scale, density, divider, A4/Letter.</li><li>Template change updates preview without losing content or section order.</li><li>Color, font, density, and paper size update preview in real time.</li><li>System prevents clipped text, unreadable font sizes, unsafe contrast, content outside margins.</li><li>Unsafe combinations are rejected or warned.</li><li>Mobile: design controls are in a collapsible panel or tab.</li><li>Design changes are autosaved and reversible.</li></ol> | Provide constrained, safe design controls. | M6.1, M6.3 |
| **M11  Export a professional PDF** | As a job seeker, I want to download a PDF that matches the preview with a safe filename and clear export rules, so that I can submit my CV with confidence. | <ol><li>PDF is text-selectable, searchable, and correctly paginated.</li><li>PDF visually matches the preview.</li><li>Default filename is `Candidate Name CV` with invalid chars sanitized.</li><li>Filename is editable before download.</li><li>Export rules are disclosed before download.</li><li>Hidden sections, examples, placeholders, target-job notes, internal IDs, and analytics data never enter the PDF.</li><li>Progress, retry, and duplicate-click protection work.</li><li>Export works for A4 and Letter.</li><li>Export works for English (LTR) and Arabic (RTL).</li><li>Export failures show a clear error and retry option.</li></ol> | Make export the climax of the flow with honest, reliable output. | M7.3, M7.4, M7.5, M7.6 |
| **M12  Convert guest to account after value** | As a job seeker, I want to create an account after I see value, so that I can save, rename, duplicate, edit, archive, and delete CVs. | <ol><li>Account prompt appears after first preview or export, never before the builder.</li><li>Guest can continue without an account for the first CV.</li><li>Guest data migrates to the account once without loss or duplication.</li><li>Dashboard supports create, rename, edit, duplicate, archive, restore, delete.</li><li>Duplicating creates an independent CV.</li><li>One user cannot access another user's CV, preview, or export.</li><li>Authentication includes signup, verification, login, logout, reset, expiry, secure sessions.</li><li>User can export stored data and delete account without support.</li><li>Dashboard is default landing for logged-in users with a CV.</li></ol> | Capture value before signup and keep user data private and portable. | M8.1, M8.2, M8.3, M8.4, M8.5, M8.6 |
| **M13  Build in Arabic or English** | As an Arabic or English speaker, I want the full core flow, templates, validation, email, help, and export in my language, so that I can build a CV that feels native to me. | <ol><li>Full core flow in Arabic and English.</li><li>UI strings, tips, phrases, and validation are localized.</li><li>Six original templates total (3 LTR English + 3 RTL Arabic) cover English LTR and Arabic RTL.</li><li>Arabic preview, controls, section order, punctuation, dates render correctly.</li><li>Arabic PDF export is text-selectable and correctly laid out.</li><li>Arabic font is embedded or falls back gracefully.</li><li>Date formats adapt to locale.</li><li>Arabic copy reviewed by a native speaker.</li><li>Language switch warns and preserves translatable content.</li></ol> | Make Arabic and English first-class launch languages. | M2.3, M6.5, M9.1 |
| **M14  Use the builder on any device** | As a job seeker, I want the core flow to work on desktop and mobile with accessible controls, so that I can build my CV anywhere. | <ol><li>Desktop shows form and preview side by side.</li><li>Mobile uses Editor and Preview as separate persistent tabs.</li><li>All 13 steps work at 360 px viewport.</li><li>Core flow meets WCAG 2.2 AA.</li><li>Every drag action has a keyboard alternative.</li><li>Every icon, color, and preview action has a text or keyboard alternative.</li><li>Focus management is logical and visible.</li><li>Screen-reader labels describe fields, errors, and actions.</li><li>Zoom to 400% does not break layout or hide critical actions.</li></ol> | Ensure responsive, accessible, keyboard-friendly, screen-reader-friendly flow. | M5.2, M5.7, M9.2 |
| **M15  Rely on fast, stable performance** | As a job seeker, I want a fast landing page, quick saves, and reliable PDF export, so that the app feels responsive and professional. | <ol><li>Landing p75 LCP <= 2.5 s.</li><li>Common save p95 <= 500 ms.</li><li>Typical PDF export p95 <= 10 s.</li><li>Autosave shows Saving/Saved/Offline/Error states and retries.</li><li>Undo/redo works for content, order, and design changes.</li><li>Page boundaries, count, overflow, and navigation are visible.</li><li>Plain-text preview is available before export.</li><li>Network failures are handled gracefully with retry and offline state.</li></ol> | Meet performance budgets and keep the editor reliable. | M5.3, M5.4, M5.5, M5.6, M9.3 |
| **M16  Trust the security of the product** | As a user, I want my data and session to be secure, so that I can trust the product with my personal information. | <ol><li>Server authorization and validation on every API call.</li><li>CSRF and XSS defenses in place.</li><li>Secure session cookies with appropriate expiry.</li><li>Rate limits on auth and export endpoints.</li><li>Private logs do not contain CV text or PII.</li><li>Encryption at rest and in transit.</li><li>App works in current and previous Chrome, Edge, Firefox, Safari.</li><li>Login, logout, password reset, and session expiry work correctly.</li></ol> | Protect against common web vulnerabilities and support major browsers. | M9.4, M9.5, M8.2 |
| **M17  Know my data stays private in analytics** | As a privacy-conscious user, I want product analytics to improve the product without storing my CV text, so that my personal information stays private. | <ol><li>Analytics tracks steps, completion, template, findings, export success.</li><li>No CV text stored in analytics events.</li><li>No PII stored in analytics events.</li><li>Analytics cannot be tied back to a specific CV's content.</li><li>Consent is obtained where required.</li><li>Analytics events are documented and reviewed before launch.</li></ol> | Improve the product while keeping CV text and PII out of analytics. | M9.6 |

---

## Should

| Title | User story | Acceptance criteria | Description | Trace |
|---|---|---|---|---|
| **S1  Export DOCX** | As a job seeker, I want an editable Word file, so that I can make offline changes. | <ol><li>DOCX export available from the export step.</li><li>Preserves headings, lists, links, logical order.</li><li>Visually matches template as closely as Word allows.</li><li>Offered only after PDF is stable.</li><li>Does not include hidden sections, placeholders, or internal data.</li></ol> | Secondary export format for offline editing. | S1 |
| **S2  Import an existing CV** | As a job seeker, I want to upload an existing CV and review the mapped fields before saving, so that I can start faster. | <ol><li>Upload PDF or DOCX.</li><li>System extracts and maps fields to the CV data model.</li><li>User reviews each mapped field before saving.</li><li>User can correct or reject mapped fields.</li><li>Import does not overwrite existing user edits.</li></ol> | Import existing CVs with user-controlled mapping. | S2 |
| **S3  Import LinkedIn data** | As a job seeker, I want to import supported public/profile data from LinkedIn, so that I do not have to retype my experience. | <ol><li>Paste a LinkedIn profile URL or public data.</li><li>System fetches supported data.</li><li>User reviews all imported fields before saving.</li><li>Unsupported data is ignored or left for manual entry.</li><li>User can reject the import at any time.</li></ol> | Reduce data entry with LinkedIn import and review. | S3 |
| **S4  Add more templates** | As a job seeker, I want more template choices after the launch set is proven, so that I can find a look that fits me. | <ol><li>New templates added one at a time.</li><li>Each passes the same content, RTL, PDF, and accessibility contract.</li><li>Supports A4 and Letter.</li><li>Tested with PDF snapshot tests in English and Arabic.</li><li>Gallery update does not break existing CVs.</li></ol> | Expand template library after launch contract is proven. | S4 |
| **S5  Share a private link** | As a job seeker, I want to share my CV via a private, revocable link, so that I can send it to recruiters without making it public. | <ol><li>Link is private by default and not indexed.</li><li>User can revoke a link.</li><li>User can set an optional expiry.</li><li>Shared view shows CV preview only, not editor.</li><li>Access is logged but no PII/CV text is stored.</li></ol> | Private, revocable CV sharing. | S5 |
| **S6  Compare against a job ad** | As a job seeker, I want to paste a job description and see exact present/missing terms without a fit score, so that I can tailor my CV manually. | <ol><li>Paste a job description.</li><li>System extracts relevant terms.</li><li>Compares to CV and lists present and missing terms.</li><li>No fit score, percentage, or job probability.</li><li>User can act on missing terms by editing the CV.</li></ol> | Deterministic job-ad term matching without AI or fake scores. | S6 |
| **S7  Restore a past version** | As a job seeker, I want to preview and restore past content or design versions, so that I can recover from mistakes or try different approaches. | <ol><li>Version history stores snapshots at meaningful points.</li><li>User can preview any past version.</li><li>User can restore a version or create a duplicate from it.</li><li>Restoring requires confirmation.</li><li>Current version is preserved before restoring.</li></ol> | Save and restore versions safely. | S7 |
| **S8  Understand pricing and billing** | As a user, I want clear pricing, free limits, checkout, invoices, cancellation, and downgrade paths, so that I know what I am paying for and can leave easily. | <ol><li>Pricing page lists plans, free limits, paid features.</li><li>Checkout is secure and shows total before payment.</li><li>Invoices in account settings.</li><li>Cancellation is self-service.</li><li>Downgrade preserves free-tier data and limits.</li><li>Free trial, if offered, is clearly labeled and does not auto-renew unexpectedly.</li></ol> | Transparent, self-service billing without dark patterns. | S8 |

---

## Later

| Title | User story | Acceptance criteria | Description | Trace |
|---|---|---|---|---|
| **L1  AI first draft** | As a job seeker, I want AI to propose a first draft from my verified facts, so that I can start faster when I do not know what to write. | <ol><li>AI generates a proposed draft from selected verified facts.</li><li>Nothing saves without user review.</li><li>Manual flow remains usable when AI is disabled.</li><li>User sees provider, data used, and retention before using.</li></ol> | Optional AI first draft with review and transparency. | L1 |
| **L2  AI rewrite** | As a job seeker, I want AI to rewrite a selected summary or bullet as a diff grounded in current facts, so that I can improve specific wording. | <ol><li>User selects a summary or bullet.</li><li>AI shows a visible diff.</li><li>User can Accept, Edit, or Reject.</li><li>Rewrite is grounded in current CV facts; unsupported claims are blocked or highlighted.</li></ol> | Optional AI rewrite for selected text. | L2 |
| **L3  AI job tailoring** | As a job seeker, I want AI to compare my CV to a job description and propose changes with evidence, so that I can tailor my CV for a specific role. | <ol><li>AI compares CV and job description semantically.</li><li>Explains evidence for each proposal.</li><li>Proposed changes are shown as diffs.</li><li>User reviews and accepts/rejects each proposal.</li><li>Unsupported facts are blocked or highlighted before acceptance/export.</li></ol> | Optional AI job tailoring with evidence and diff review. | L3 |
| **L4  AI translation** | As a job seeker, I want AI to draft a linked language version while preserving source text, so that I can have CVs in multiple languages. | <ol><li>AI drafts a linked language version.</li><li>Source text is preserved and visible.</li><li>User reviews and edits before saving.</li><li>Changes can be synced or kept independent.</li></ol> | Optional AI translation with source preservation. | L4 |
| **L5  AI import assistance** | As a job seeker, I want AI to help parse a difficult uploaded CV with field-by-field confirmation, so that I can import complex or unusual CVs. | <ol><li>AI improves parsing of difficult uploaded CVs.</li><li>Each extracted field is shown for confirmation.</li><li>User can edit, accept, or reject each field.</li><li>Unsupported fields are left for manual entry.</li></ol> | Optional AI import with field-by-field confirmation. | L5 |

---

## Non-goals reminder

These are explicitly out of scope for v1, copied from `requirements.md`:

| Non-goal | Boundary reason |
|---|---|
| Job tracker or application CRM | Product only creates CVs. |
| Automatic job applications | Outside the CV flow and removes user control. |
| Cover-letter builder in MVP | Keep the first product focused on one document. |
| Employer ATS or candidate ranking | Product serves the job seeker, not hiring decisions. |
| AI anywhere in MVP | Founder explicitly moved AI to a later pipeline. |
| Guaranteed ATS score, interview, or employment | Competitor marketing patterns are not product guarantees. |
| Canva-style freeform design canvas | Adds complexity and can break document structure. |
| Copying competitor layouts, content, or branding | Research informs flow only. |
| Public CV by default | CVs contain personal information. |
| Forced photo or sensitive personal information | Requirements vary by user and destination. |
| Fabricated achievements, skills, numbers, or credentials | Violates trust and may harm the user. |

---

## INVEST compliance

Every v1 story satisfies INVEST:

- **Independent:** Each Must story delivers a distinct slice of user value. Where a story depends on the core editor shell, it assumes the walking skeleton in the slice backlog is in place.
- **Negotiable:** Acceptance criteria describe outcomes, not implementation details. Teams can choose specific components and API contracts.
- **Valuable:** Each story is written from the perspective of the non-technical job seeker and maps to a real problem in the requirements.
- **Estimable:** Scope, multiple acceptance criteria, and boundaries are clear enough for the team to size.
- **Small:** v1 stories are feature-level and intended to be split into implementation tasks during sprint planning; no single v1 story covers more than one major flow stage.
- **Testable:** Every acceptance criterion is independently verifiable through manual QA, automated tests, or analytics events.

---

## Traceability

- Every Must story traces to one or more `M` requirements in `requirements.md`.
- Every Should story traces to one or more `S` requirements in `requirements.md`.
- Every Later story traces to one or more `L` requirements in `requirements.md`.
- No v1 user story depends on an AI feature or a non-goal.
- The release success metric covers the end-to-end value stream: landing → setup → content → export → account.

---

## How to add or update a story

Use this row template inside the correct group table:

```markdown
| **ID  Title** | As a [user], I want [action], so that [outcome]. | <ol><li>[criterion]</li><li>[criterion]</li><li>[criterion]</li></ol> | [Why this matters.] | [trace IDs] |
```

Rules:
- Keep the `User story` column to one sentence.
- Put each acceptance criterion in a separate `<li>`, so it renders as a numbered list inside the cell.
- Keep the `Description` column to one or two sentences.
- Add the ID to the Quick navigation table at the top.
