# Requirements  HeadCV (Universal CV Builder)

| Document | Value |
|---|---|
| Owner | **requirements-analyst** |
| Pack step | **1** |
| Status | `draft` |
| Version | `1.0` |
| Updated | `2026-08-17` |
| Product job | Help a user create and download a professional CV |
| MVP intelligence | Rules and curated content only; **no AI** |
| Later | Add optional AI inside the existing CV flow |
| Research scope | Live competitor creation flows only |

## Problem / ICP

| Area | Requirement insight |
|---|---|
| Primary user | A non-technical job seeker who does not know how to structure, write, or format a CV. |
| Secondary user | A technical or experienced user who wants a fast, polished CV without manually formatting a document. |
| Main problem | Blank-page anxiety, confusing template choices, uncertainty about what to write, inconsistent formatting, and export friction. |
| Current behavior | User starts from Word/Google Docs, copies an online example, or enters a competitor builder and follows its wizard. |
| Desired outcome | User answers simple questions, sees the CV build in real time, fixes clear issues, and downloads a professional file. |
| MVP boundary | Create, edit, save, and export CVs only. No job tracker, auto-apply, cover-letter product, or AI writing. |
| Founder direction | Copy the best competitor **flow patterns**, not their visual identity, wording, or proprietary content. |

| User job to be done | Success condition |
|---|---|
| “I do not know where to start.” | One clear `Create my CV` action begins a guided flow. |
| “I do not know which template fits me.” | Product recommends up to three templates after three simple questions. |
| “I do not know what to write.” | Each section provides short tips and curated, editable phrase patterns filtered by job title. |
| “I am worried about formatting.” | Layout, spacing, page breaks, and typography are automatic. |
| “I want to see the result.” | Desktop shows a live preview; mobile provides an obvious Editor/Preview switch. |
| “I want my file now.” | Export requirements and any account/payment requirement are disclosed before the user begins. |

## Sources researched (live SaaS)

| # | Product | Official URL | Observed creation flow | Access/pricing observed | What we adopt | Gap we avoid |
|---:|---|---|---|---|---|---|
| 1 | Resume.io | [Official creation guide](https://help.resume.io/en/articles/3785152) | Choose template/color → personal details → summary → links → employment → education → skills → special sections → edit → download/share | No account required before entering the builder; free export is TXT; PDF/Word and sharing are premium | No-account start, ordered section wizard, live preview, switch template anytime, special/custom sections, duplicate versions | Do not hide useful PDF export conditions until the last step; do not use AI-generated sentences in MVP |
| 2 | Zety | [Official mobile builder guide](https://zety.com/blog/free-resume-on-phone) | Choose template → guided section-by-section entry → expert tips/ready-made content → final draft → reorder/style → checker → export | Official guide lists a 14-day trial and free TXT only; offer can vary by market | Mobile-first wizard, job/experience-aware tips, ready-made content pattern, final review/checker | Template switching must never unexpectedly reorder sections; no AI or opaque ATS score in MVP |
| 3 | Enhancv | [Official How It Works](https://enhancv.com/uk/cv-builder/) | Select template → upload/import/start fresh → add content → customize colors/fonts/layout/sections → download PDF | Seven-day free access/trial is advertised; PDF is the main export | Clear four-stage mental model, full-document live editor, duplicate a CV to tailor it | MVP has one manual start path, not import/AI choices; design controls stay constrained |
| 4 | Kickresume | [Official editor guide](https://www.kickresume.com/en/help-center/resume/) | Sign in/dashboard → choose new/import/example/AI path → choose template → fill sections → section analysis → add sections → reorder/design → download/share | Freemium with premium templates/features and paid plans | Section analysis, profession-filtered phrase library, optional/custom sections, autosave, A4/Letter, design switching | Avoid dashboard/login before first value, four competing start paths, and AI inside manual MVP flow |
| 5 | Canva | [Official resume builder](https://www.canva.com/create/resumes/) | Search Resume → choose template → drag/drop text/design customization → download or share | Free builder/templates with optional paid assets/features; PDF/JPG/PNG export | Strong template preview, simple visual customization, automatic saving, multiple versions | Avoid unrestricted drag/drop, graphics-first CVs, and asking users to design instead of guiding content |

### Competitor flow comparison

| Flow stage | Resume.io | Zety | Enhancv | Kickresume | Canva | Product decision |
|---|---|---|---|---|---|---|
| Entry | Template page; builder before account | Template-first guided builder | Template or import/start path | Login/dashboard and four start methods | Search for Resume | One landing CTA; guest starts immediately |
| Context | Job title/industry influences template and suggestions | Job title and experience influence content | User selects profession/style and may import | Current position/profession filters templates/phrases | User chooses an industry/style template | Ask target job, experience level, and CV language first |
| Template | Chosen before content; switch anytime | Chosen before guided fields | Chosen first | Chosen early; switch later | Chosen first from a large gallery | Show three recommended templates, plus `See all` |
| Content entry | Ordered forms for standard sections | Step-by-step forms with tips/content | Add/import content in live editor | Section forms with many optional sections | Directly edit template text boxes | Guided forms are primary; direct preview editing is secondary |
| Writing help | Skills, examples, word-count hints, AI sentences | Ready-made job/experience content and tips | Suggestions and tailoring, much of it AI | Phrase library, examples, section analysis, AI | Mostly design help; AI optional | Curated phrase patterns, tips, and deterministic section checks only |
| Preview | Live preview beside forms | Final draft and mobile-friendly editing | Live full-document editor | Preview/design area with autosave | Canvas is the document | Live preview desktop; Editor/Preview tabs mobile |
| Structure | Reorder, rename, delete, custom sections | Reorder in final draft; template switch may affect order | Customize sections/layout | Reorder, rename labels, add sections | Free placement of all elements | Reorder/add/hide sections with safe non-drag controls; no free placement |
| Design | Template, color, line spacing | Font, color, size, margins, spacing, order | Color, font, layout, sections | Template, color, font, size, spacing, paper size | Extensive drag/drop graphics and layout | Template, accent, font set, density, A4/Letter within tested limits |
| Review | Spellcheck and edit step | Resume checker/score | Tailoring and content checks | Section Analysis | Visual review only | Transparent checklist: missing fields, dates, placeholders, clarity, layout, privacy |
| Export | TXT free; PDF/Word premium; share link premium | TXT free; paid trial for richer export | PDF | PDF, text-to-Word, email/drive/share | PDF, JPG, PNG | PDF in MVP; DOCX in Should; disclose access before start |

### Adopted end-to-end product flow

| Step | Screen | Primary user action | Product behavior | Competitor basis |
|---:|---|---|---|---|
| 1 | Landing | Select `Create my CV` | Start a guest draft immediately; show `Sign in` as secondary | Resume.io no-account start; Canva direct start |
| 2 | Quick setup | Choose CV language, target job, and experience level | Recommend a section order and up to three suitable templates | Zety job/experience guidance; Resume.io industry categories; Kickresume profession filters |
| 3 | Template choice | Choose recommended template or continue with default | Open builder; template can be changed later without losing/reordering content | Resume.io, Enhancv, Kickresume, Canva template-first flows |
| 4 | Personal details | Enter name and preferred contact details | Update live preview; optional details remain collapsed | Resume.io ordered personal-details step |
| 5 | Work experience | Add jobs one at a time | Show job-title-filtered tips and curated phrase patterns; keep all text editable | Zety ready-made content; Kickresume phrase library; Resume.io examples |
| 6 | Education | Add education or skip | Reorder education before work for low-experience users after confirmation | Resume.io/Zety guided sections |
| 7 | Skills | Search or enter relevant skills | Offer curated job-title suggestions, unchecked by default | Resume.io/Zety skill suggestions |
| 8 | Summary | Fill a short guided summary or skip | Assemble only selected user facts through fixed patterns; user reviews result | Competitor guided summaries, implemented without AI |
| 9 | Additional sections | Add languages, certificates, courses, projects, volunteering, awards, publications, references, hobbies, or custom | Show relevant suggestions; never require every section | Resume.io special sections; Kickresume additional/custom sections |
| 10 | Review | Open `Improve CV` checklist | Display section completeness, date, placeholder, spelling, duplicate, privacy, and layout findings with direct fix links | Zety checker; Kickresume Section Analysis; Resume.io edit step |
| 11 | Design | Optionally change template, accent, font set, density, or paper size | Update preview without changing content or section order | All five competitors; constrained instead of Canva free placement |
| 12 | Export | Choose PDF and filename | Show page preview and exact free/account/payment rule, then download | Resume.io/Zety export lesson; PDF use across competitors |
| 13 | Save account | Create account or sign in | Migrate guest CV once; show dashboard with rename, duplicate, edit, archive, and export | Resume.io delayed account plus competitor document dashboards |

### Flow UX rules

| Rule | Requirement | Evidence |
|---|---|---|
| One primary action | Each step has one dominant `Continue` action; Back and Skip are secondary | Guided flows from Resume.io and Zety |
| Visible progress | Show named steps and completion state; progress reflects required fields only | Zety wizard and Kickresume analysis |
| Save automatically | Persist after meaningful field changes and show Saving/Saved/Error | Canva and Kickresume autosave behavior |
| Preserve content | Template/design changes never delete, rewrite, or reorder content | Improve on Resume.io/Kickresume switch-anytime pattern and Zety-reported gap |
| Preview without distraction | Desktop preview is live; mobile defaults to form with a persistent preview switch | Resume.io live preview and Zety mobile flow |
| Keep optional optional | Every nonessential section has Skip/Not applicable | Resume.io special sections and Kickresume extras |
| Plain language | Use `What did you do?` rather than resume jargon | Founder decision for non-technical users |
| Safe customization | No free-position text boxes; users customize tested tokens and section order | Adopt competitor customization while avoiding Canva complexity |
| Honest assistance | Curated examples never enter the CV until selected and edited | Founder no-AI/no-fabrication decision |
| Early commercial disclosure | Before Step 2, show what is free, what requires an account, and what may be paid | Avoid Resume.io/Zety export surprise risk |

## Must

_Product fails without these. Each row cites a competitor source or founder decision._

### M1 - Entry and setup

| ID | Requirement | Acceptance result | Source |
|---|---|---|---|
| M1.1 | One landing CTA | `Create my CV` starts the flow; no product/dashboard choice is required | Resume.io, Canva |
| M1.2 | Guest-first draft | User reaches the builder and preview without signup | Resume.io |
| M1.3 | Early disclosure | Free/account/payment/export rules appear before setup starts | Founder decision from Resume.io/Zety gap |
| M1.4 | Three setup questions | Ask CV language, target job, and experience level only | Zety, Resume.io, Kickresume |
| M1.5 | Recommended path | Recommend section order and at most three templates with a default selected | Zety, Resume.io, Enhancv |
| M1.6 | Manual fallback | Any job title can be typed when suggestions do not match | Founder decision |

### M2 - Template selection

| ID | Requirement | Acceptance result | Source |
|---|---|---|---|
| M2.1 | Template gallery | Cards show full-page preview, name, style, ATS-safe label, page behavior, and Free/Paid state | Resume.io, Kickresume, Canva |
| M2.2 | Launch categories | `Simple`, `Professional`, `Modern`, and `Creative` filters work; the launch set covers Simple, Professional, and Modern (3 LTR + 3 RTL) and Creative is reserved for paid/later templates; safe template is recommended first | Resume.io categories; Canva styles |
| M2.3 | MVP templates | Six original templates total (three LTR for English, three matching RTL for Arabic); no competitor visual assets are copied | Founder decision |
| M2.4 | Switch anytime | Template changes update preview without losing or reordering any content | Resume.io, Kickresume; improve Zety gap |
| M2.5 | Safe default | User may skip the gallery and use the recommended template | Founder UX decision |

### M3 - Guided content builder

| ID | Requirement | Acceptance result | Source |
|---|---|---|---|
| M3.1 | Ordered wizard | Personal → Experience → Education → Skills → Summary → Additional → Review → Design → Export | Resume.io and Zety |
| M3.2 | Personal details | Name, title, email, phone, location, photo optional, and links are supported; optional fields stay collapsed | Resume.io |
| M3.3 | Experience | Repeatable role with job title, employer, location, dates/current, and bullet points | Resume.io, Zety, Kickresume |
| M3.4 | Education | Repeatable institution, qualification, field, location, dates, and optional details | Resume.io, Zety, Kickresume |
| M3.5 | Skills | Manual entry, search, categories, reorder, and optional user-selected level | Resume.io, Zety |
| M3.6 | Summary | Guided fields produce an editable fixed-pattern summary using only user-selected facts | Resume.io/Zety summary step; founder no-AI rule |
| M3.7 | Additional sections | Languages, certificates, courses, projects, volunteering, awards, publications, references, hobbies, internships, activities, and custom section | Resume.io and Kickresume |
| M3.8 | Section controls | Add, edit, duplicate, hide, delete, rename where safe, and reorder with drag and keyboard buttons | Resume.io, Kickresume |
| M3.9 | Skip/resume | Optional steps can be skipped; leaving and returning opens the last incomplete step | Zety/Resume.io guided flow |

### M4 - Smart assistance without AI

| ID | Requirement | Acceptance result | Source |
|---|---|---|---|
| M4.1 | Curated phrase library | Job-title-filtered Arabic/English phrase patterns are searchable and editable | Zety ready-made content; Kickresume phrases |
| M4.2 | Fact placeholders | A phrase cannot be accepted while named placeholders such as quantity/result remain unresolved | Founder no-fabrication decision |
| M4.3 | Section tips | Each section shows one short tip and examples appropriate to experience level | Zety, Resume.io |
| M4.4 | Skill suggestions | Job-title-filtered skills appear unchecked; user must select each skill | Resume.io, Zety |
| M4.5 | Section analysis | Deterministic checks identify empty required data, impossible dates, placeholders, duplicates, long bullets, spelling, and missing contact | Kickresume Section Analysis; Zety checker |
| M4.6 | Improve CV panel | Findings are grouped by section, explain the rule, and link to the exact field | Zety checker; Resume.io recommendations panel |
| M4.7 | No opaque score | MVP shows Passed/Improve/Review checks, not an ATS score or job probability | Founder decision |
| M4.8 | Strict no-AI gate | MVP makes no model/LLM/embedding/generative service calls and has no model SDK/key dependency | Founder decision |

### M5 - Editor and preview

| ID | Requirement | Acceptance result | Source |
|---|---|---|---|
| M5.1 | Desktop live preview | Form and document preview are visible together; changes appear within 300 ms for a typical CV | Resume.io, Enhancv |
| M5.2 | Mobile mode | Editor and Preview are separate persistent tabs and all steps work at 360 px | Zety mobile builder |
| M5.3 | Autosave | Saving, Saved, Offline, and Error states are visible and retry safely | Canva, Kickresume |
| M5.4 | Undo/redo | Current-session content, order, and design changes are reversible | Founder usability decision |
| M5.5 | Page preview | A4/Letter page boundaries, page count, overflow, and page navigation are visible | Resume.io preview; Kickresume A4/Letter |
| M5.6 | Plain-text preview | User can inspect logical reading order before export | Founder parser-safety decision |
| M5.7 | Accessible controls | Every drag, icon, color, and preview action has a keyboard/text alternative | Founder quality decision |

### M6 - Design customization

| ID | Requirement | Acceptance result | Source |
|---|---|---|---|
| M6.1 | Controlled settings | User can change template, accent, tested font set, text scale, density, divider style, and A4/Letter | Resume.io, Zety, Enhancv, Kickresume |
| M6.2 | No free placement | CV content stays in semantic sections; users cannot freely position text/graphics | Avoid Canva gap |
| M6.3 | Readable limits | Product prevents clipped text, unreadable font size, unsafe contrast, and content outside margins | Founder decision |
| M6.4 | Original templates | Layouts are built from the product's own design system and do not copy competitor templates | Founder/legal decision |
| M6.5 | RTL parity | Arabic preview, controls, order, punctuation, dates, and export render correctly | Founder decision |

### M7 - Review and export

| ID | Requirement | Acceptance result | Source |
|---|---|---|---|
| M7.1 | Final review | Review shows incomplete sections, content findings, privacy warnings, page overflow, and selected template | Resume.io edit step; Zety/Kickresume analysis |
| M7.2 | Direct fixes | Selecting a finding focuses the exact field and returning preserves review position | Zety checker flow |
| M7.3 | PDF export | Downloaded PDF is text-selectable, searchable, correctly paginated, and visually matches preview | PDF export across all competitors |
| M7.4 | Safe filename | Editable default uses candidate name plus `CV`; invalid filename characters are handled | Founder decision |
| M7.5 | Export privacy | Hidden sections, examples, placeholders, target-job notes, internal IDs, and analytics data never enter the file | Founder decision |
| M7.6 | Reliable export | Progress, retry, duplicate-click protection, and clear error recovery work | Founder quality decision |

### M8 - Account and document dashboard

| ID | Requirement | Acceptance result | Source |
|---|---|---|---|
| M8.1 | Delayed account | Account prompt occurs after first value; guest data migrates once without loss | Resume.io no-account start |
| M8.2 | Authentication | Signup, verification, login, logout, reset, expiry, and secure sessions work | Founder SaaS requirement |
| M8.3 | CV dashboard | Create, rename, edit, duplicate, archive, restore, and delete CVs | Resume.io and Kickresume dashboards |
| M8.4 | Multiple versions | Duplicating creates an independent CV for another job | Resume.io, Canva, Enhancv |
| M8.5 | Private workspace | One user cannot access another user's CV, preview, or export | Founder security decision |
| M8.6 | Data controls | User can export stored data and delete the account without contacting support | Founder trust decision |

### M9 - Quality baseline

| ID | Requirement | Acceptance result | Source |
|---|---|---|---|
| M9.1 | Arabic and English | The full core flow, templates, validation, email, help, and export work in both languages | Founder decision |
| M9.2 | Accessibility | Core flow meets WCAG 2.2 AA, including keyboard, screen reader, zoom, and error recovery | Founder quality decision |
| M9.3 | Performance | Landing p75 LCP <= 2.5 s; common save p95 <= 500 ms; typical PDF export p95 <= 10 s | Founder quality decision |
| M9.4 | Browser support | Current and previous Chrome, Edge, Firefox, and Safari work | Founder quality decision |
| M9.5 | Security | Server authorization, validation, CSRF/XSS defenses, encryption, rate limits, and private logs pass | Founder security decision |
| M9.6 | Analytics privacy | Track steps, completion, template, findings, and export success without storing CV text in analytics | Founder product decision |

## Should

| ID | Requirement | Acceptance result | Source |
|---|---|---|---|
| S1 | DOCX export | Editable Word file preserves headings, lists, links, and logical order | Resume.io premium; Kickresume text-to-Word |
| S2 | Existing CV import | User uploads an existing CV, reviews mapped fields, and confirms before save | Enhancv, Kickresume, Zety |
| S3 | LinkedIn import | User imports supported public/profile data and reviews everything | Kickresume, Enhancv |
| S4 | More templates | Add templates only after passing the same content, RTL, PDF, and accessibility contract | All competitors |
| S5 | Share link | Private by default, revocable, optional expiry, and no indexing | Resume.io, Kickresume |
| S6 | Exact job-ad terms | Paste job text and show exact present/missing terms without a fit score | Resume.io/Enhancv tailoring flow, implemented without AI |
| S7 | Version history | Preview and restore past content/design versions | Competitor multiple-version pattern plus founder decision |
| S8 | Billing and entitlements | Pricing, free limits, checkout, invoices, cancellation, and downgrade are explicit | Resume.io, Zety, Enhancv, Kickresume access models |

## Later

| ID | Requirement | Acceptance result | Competitor basis |
|---|---|---|---|
| L1 | AI first draft | Generate a proposed draft from selected verified facts; nothing saves without review | Kickresume AI start; Resume.io questionnaire |
| L2 | AI rewrite | Rewrite selected summary/bullet as a visible diff grounded in current facts | Kickresume and competitor AI editors |
| L3 | AI job tailoring | Compare CV and job description semantically, explain evidence, and propose changes | Resume.io, Zety, Enhancv tailoring/checkers |
| L4 | AI translation | Draft a linked language version while preserving source text and requiring review | Competitor multilingual/AI patterns |
| L5 | AI import assistance | Improve parsing of difficult uploaded CVs with field-by-field confirmation | Enhancv/Kickresume import flows |

| Later AI gate | Requirement |
|---|---|
| Optional | Manual MVP flow remains fully usable when AI is disabled. |
| Grounded | AI receives only user-selected CV/profile facts and current task input. |
| Review | Every AI change is a proposed diff with Accept/Edit/Reject. |
| No fabrication | Unsupported facts are blocked or highlighted before acceptance/export. |
| Transparent | Show provider, data used, retention, cost/credit impact, and deletion behavior. |
| Evaluated | Fabrication, privacy, prompt injection, bias, Arabic quality, and failure tests pass. |

## Non-goals (explicit)

_Things we will NOT build, so scope arguments end here._

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

## Open questions for the founder

| ID | Decision | Recommended default | Why it matters | Status |
|---|---|---|---|---|
| Q1 | Is first PDF export free without an account? | Yes; offer account after download | Strongest low-friction version of Resume.io's entry flow | Open |
| Q2 | What exactly is paid in MVP? | Nothing until flow conversion and rendering cost are measured | Prevents paywall work from delaying CV quality | Open |
| Q3 | Are Arabic and English both launch requirements? | Yes | Changes templates, editor, content library, and QA | Open |
| Q4 | How many launch templates? | Six: three LTR and three RTL using shared design tokens | Enough choice without Canva-style overload | Open |
| Q5 | PDF only or PDF plus DOCX at launch? | PDF Must; DOCX Should | DOCX materially increases renderer work | Open |
| Q6 | Should target job be required? | No; recommend it but allow `General CV` (default template, standard section order, and broadest curated phrase/skill catalogue) | Supports undecided and broad-search users | Open |
| Q7 | When should account creation occur? | After first preview or export, never before builder | Main activation tradeoff | Open |
| Q8 | Which competitor flow is the closest benchmark? | Resume.io structure + Zety guidance + Kickresume analysis, without AI | Aligns UX review and acceptance testing | Open |
| Q9 | Product name/domain | Decide after trademark/domain review | Branding and repository naming | Open |
| Q10 | Physical feature branches | Initialize Git only after this requirements document is approved | Directory is not currently a repository | Open |

## Approval

| Approval item | Status |
|---|---|
| Problem and ICP approved | [ ] |
| Five competitor flows accepted as evidence | [ ] |
| Adopted 13-step flow approved | [ ] |
| Strict no-AI MVP approved | [ ] |
| Must scope approved | [ ] |
| Should and Later scope approved | [ ] |
| Non-goals approved | [ ] |
| Founder questions resolved or assigned | [ ] |
| Approved for UX wireframes and user stories | [ ] |

| Sign-off | Value |
|---|---|
| Approved by | `[name]` |
| Approval date | `YYYY-MM-DD` |
| Next artifact | UX wireframes for the adopted 13-step flow |
