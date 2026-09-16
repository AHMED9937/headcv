# Slice 03  HeadCV AI Resume Import Engine (Comprehensive Implementation Plan)

## Status

Planned

## One-sentence summary

Build a layout-aware, schema-constrained, multi-provider resume-to-JSON extraction engine that ingests any Arabic/English PDF, DOCX, TXT or scanned image, falls back to deterministic parsing when AI is unavailable, and guarantees 100% schema-valid `ResumeData` output with every supported field populated when it exists in the source.

---

## 1. Why this plan is different

The previous slice addressed only the local LLM plumbing. This slice focuses on the **extraction quality** and **field coverage** that actually matters to users. A user does not care that a request reached Gemini; they care that their name, 10 years of experience, three languages, and GitHub profile all end up in the right `ResumeData` fields.

The root cause of the current `undefined company / position` failures is not the model. It is three gaps:

1. **No structured-output contract**  the model receives an example, not a JSON Schema, so it can omit required keys.
2. **No defensive item-level defaulting**  `mergeWithDefaults` is shallow, so any missing nested field (e.g., `experience[0].company`) breaks the canonical Zod validation.
3. **No layout-aware extraction**  the LLM is fed the page text in raw order, which is catastrophic for two-column, sidebar, and table-based resumes.

This plan closes all three gaps and adds the production extras that expert parsers use: PII redaction, deterministic pre-extraction, section decomposition, confidence scores, OCR, and a golden-test evaluation harness.

---

## 2. Goals and non-goals

### Goals
- Extract **every supported `ResumeData` field** when it appears in the source.
- Handle **single-column, multi-column, sidebar, table, image/scanned, and rich-text** CVs.
- Support **Arabic, English, and mixed-language** resumes without translation.
- Support **Gemini 2.5, OpenAI 4o/4o-mini, and Ollama** with a single generic fetch client.
- Force the LLM to emit **strict JSON** matching a derived schema.
- **Deep-fill missing keys and item fields** so `resumeDataSchema.parse` never fails on a missing `id`.
- Preserve the existing **deterministic fallback** path (`TextResumeImporter`) for offline / no-AI setups.
- Add **golden tests** and **per-section confidence scoring** to measure and compare quality.
- Keep all API keys and resume text server-side and out of logs.

### Non-goals
- We do not clone `open-resume` / `SmartResume` / `Resume-Matcher` wholesale.
- We do not train or fine-tune a model.
- We do not implement full ATS scoring or JD matching.
- We do not add Python to the monorepo unless a `marker` microservice is explicitly chosen in Phase 2.

---

## 3. Competitor analysis (what to copy)

| Repo | Stars | Key insight for us |
|---|---|---|
| `Edwinfom00/resume-intel` | growing | PII redaction with placeholder reinjection; `streamResume` progressive UI; parallel task decomposition; resilient JSON validation; 15-section output. |
| `alibaba/SmartResume` | ~390 | Layout-aware parsing (OCR + PDF metadata) + instruction-tuned 0.6B model + parallel task decomposition with index pointers. |
| `RAGFlow` `rag/app/resume.py` | enterprise | PDF/OCR fusion; YOLOv10 layout segmentation; 4-way parallel extraction (basic/work/education/project); 4-stage post-processing. |
| `Tushar-9802/Resume-parser` | small | Model extracts evidence spans; all business rules live in Python after extraction. |
| `resumix` | npm | Schema-driven extraction: declare which fields you want and the parser returns exactly those. |
| `jsonresume.org` | standard | The JSON Resume v1 schema is the de-facto interchange format; our `ResumeData` already covers it. |

### Common expert pipeline
```
File → Layout-aware extraction → PII redaction (optional) →
  Deterministic pre-extraction (contacts) →
  Section decomposition (or one-shot with strict schema) →
  LLM with JSON schema → Resilient JSON parsing →
  Deep normalization/defaults → Zod validation →
  Skill/job-title normalization → Review UI
```

---

## 4. Full `ResumeData` field map  what we must extract

The canonical schema lives in `packages/schema/src/resume/data.ts`. This is how each top-level field must be sourced from a CV.

### `basics`
| Field | CV source | Notes |
|---|---|---|
| `name` | First non-contact line at the top, or first 10 lines. | Preserve Arabic/English script. |
| `headline` | Subtitle directly under the name ("Software Engineer", "Full Stack Developer"). | Optional; can be empty. |
| `email` | Regex on first 30 lines. | RFC-ish regex. |
| `phone` | Regex on first 30 lines. | Keep original formatting. |
| `location` | City, country, or "City, Country" near the contact block. | Do not over-normalize. |
| `website` | Any personal website/URL in the header. | `url` and `label` fields. |
| `customFields` | Extra contact/role fields such as "Security Clearance", "Nationality", "Visa Status". | Generate `id` for each. |

### `summary`
| Field | CV source |
|---|---|
| `title` | Usually "Summary", "Professional Summary", "Objective" heading. |
| `content` | The paragraph(s) after the heading, wrapped in `<p>`. |

### `sections` (all items share `id` + `hidden` + section fields)

#### `experience`
| Field | CV source |
|---|---|
| `company` | Employer / organization name. |
| `position` | Job title at that company. |
| `location` | City / country of the role. |
| `period` | Raw date/tenure string ("Jan 2020 - Present"). Do not normalize dates. |
| `website` | Company URL, if present. |
| `description` | HTML description: achievements and bullet list. |
| `roles` | Internal career progression at the same company (promotions). |

#### `education`
| Field | CV source |
|---|---|
| `school` | Institution name. |
| `degree` | Degree title (Bachelor's, Master's, PhD, etc.). |
| `area` | Major / field of study. |
| `grade` | GPA, percentage, or grade. |
| `location` | Location of the institution. |
| `period` | Raw study dates. |
| `website` | Institution URL, if present. |
| `description` | Additional notes. |

#### `skills`
| Field | CV source |
|---|---|
| `name` | Skill name. Normalize against `packages/content` skill catalog. |
| `proficiency` | Text level if found ("Advanced", "Expert"). |
| `level` | Number 0-5, derived from proficiency text if possible. |
| `keywords` | Sub-skills/technologies under this skill. |

#### `languages`
| Field | CV source |
|---|---|
| `language` | Language name (English, Arabic, French, etc.). |
| `fluency` | Fluency string ("Native", "Fluent", "Conversational"). |
| `level` | Number 0-5, optional. |

#### `profiles`
| Field | CV source |
|---|---|
| `network` | Platform name (LinkedIn, GitHub, X/Twitter). |
| `username` | Handle or username. |
| `website` | Full profile URL. |

#### `projects`
| Field | CV source |
|---|---|
| `name` | Project name. |
| `period` | Raw period. |
| `website` | Project URL. |
| `description` | HTML description. |

#### `awards`, `certifications`, `publications`, `volunteer`, `references`
All follow the same pattern: title/organization/issuer, date, description, website. Extract when the heading is detected.

#### `interests`
| Field | CV source |
|---|---|
| `name` | Interest/hobby. |
| `keywords` | Related sub-tags. |

### `customSections`
If the CV has a section not in the 12 standard sections (e.g., "Military Service", "Patents"), map it to `customSections` with `type` set to the closest standard item schema, or `summary` if none fits.

### `picture` and `metadata`
- `picture` is **not extracted** from the CV file. Use `defaultResumeData.picture`.
- `metadata` is **not extracted** from the CV. Use `defaultResumeData.metadata` and let the builder control it.

---

## 5. Proposed architecture

```
apps/web/src/routes/import/index.tsx
    │
    ▼
apps/web/src/features/resume/import/extract-text.ts   ← Phase A
    │
    ▼
packages/api/src/features/resume/crud.ts
    │
    ▼
packages/api/src/features/resume/llm-parser.ts
    │
    ├─ packages/api/src/features/resume/prompts/parse-resume.ts   ← Phase C
    ├─ packages/api/src/lib/llm-client.ts                       ← Phase B
    ├─ packages/api/src/features/resume/section-detector.ts       ← Phase D (optional)
    └─ packages/api/src/features/resume/normalize.ts              ← Phase E
    │
    ▼
resumeDataSchema.parse()
    │
    ▼
packages/api/src/features/resume/crud.ts
    │
    ▼
apps/web/src/routes/import/index.tsx → toasts → builder
```

---

## 6. Implementation phases (revised and expanded)

### Phase A  Layout-aware text extraction

**Why it matters**
Two-column and sidebar layouts are the #1 cause of LLM hallucination. Expert systems (`SmartResume`, `RAGFlow`, `resume-intel`) do not just concatenate text; they reconstruct reading order.

**Plan**
1. Replace the current `extractTextFromFile` in `apps/web/src/features/resume/import/extract-text.ts` with a tiered pipeline:
   - **PDF native text layer**: Use `unpdf`/`pdfexcavator` to get `extractTextItems` with `(x, y, fontSize, width, height, hasEOL)`.
   - **Reading-order reconstruction**: Implement an XY-cut/column detection pass:
     - Project characters onto the X axis to detect vertical column gutters.
     - Sort blocks top-to-bottom within each column.
     - Re-assemble as clean markdown with inferred headings (`##` when a line has a larger font or bold).
   - **DOCX/DOC**: Use `mammoth` or `@xmldom/xmldom` to extract paragraphs in reading order.
   - **TXT**: pass through.
   - **Images / scanned PDF**: Add an OCR gate. In Phase 1, return a clear `UNSUPPORTED`/`OCR_DISABLED` error. In Phase 2, add `tesseract.js` or call an external `marker` service.
2. Add extraction metadata: page count, blocks, columns, character count, and duration. No content logging.
3. If extraction yields <50 non-whitespace chars, return `BAD_REQUEST` with message "No readable text found.".

**Files to touch**
- `apps/web/src/features/resume/import/extract-text.ts`
- `apps/web/src/features/resume/import/extract-text.test.ts` (new)
- `packages/import/src/text-resume.tsx` (keep as fallback)

**Tests**
- Single-column, two-column, table, and Arabic PDF/DOCX fixtures.
- Assert correct reading order and that company names stay with their descriptions.

### Phase B  LLM client with strict structured outputs

**Plan**
1. Create `packages/schema/src/resume/extraction.ts`.
   - Define `resumeExtractionSchema` as a strict-but-resilient Zod schema that is a **copy of `resumeDataSchema`** but with:
     - All `z.string().min(1)` relaxed to `z.string().catch("")`.
     - All arrays with `.catch([])`.
     - All objects with `.catch(defaultValue)`.
     - `customSectionItemSchema` simplified to avoid heavy union in JSON schema if it hurts provider limits; otherwise keep it.
2. Generate `resumeDataJsonSchema` with `zod-to-json-schema`:
   - `const resumeDataJsonSchema = zodToJsonSchema(resumeExtractionSchema, { name: "ResumeData", target: "jsonSchema7" })`.
   - For OpenAI: also pass `openaiStrictMode: true` if using `openai-zod-to-json-schema`.
   - Strip `metadata` and `picture` from the extraction schema before generating JSON  they are not extracted.
3. Update `packages/api/src/features/resume/llm-parser.ts` to call `complete({ ..., format: resumeDataJsonSchema })`.
4. Verify `packages/api/src/lib/llm-client.ts`:
   - Gemini native: `generationConfig.responseJsonSchema`.
   - OpenAI: `response_format: { type: "json_schema", json_schema: { name: "resume", strict: true, schema } }`.
   - Ollama: `format: <json-schema>`.
5. Add a `MAX_LLM_CHARS` limit (8,000 for Flash-Lite, 20,000 for Flash) with a clear truncation marker in the prompt.

**Files to touch**
- `packages/schema/src/resume/extraction.ts` (new)
- `packages/schema/package.json` (add `zod-to-json-schema`)
- `packages/api/src/lib/llm-client.ts` (verify schema wiring)
- `packages/api/src/features/resume/llm-parser.ts`
- `packages/api/src/lib/llm-client.test.ts`

**Tests**
- Mock fetch for each provider and assert the correct `responseJsonSchema` / `json_schema` payload.
- Golden test: a known CV text and mocked response → valid `ResumeData`.

### Phase C  Prompt engineering (the single most important file)

**Why the current prompt fails**
It dumps the entire `defaultResumeData` as an example. LLMs copy examples too literally, omit keys, and cannot see the forest for the trees.

**New prompt design (`packages/api/src/features/resume/prompts/parse-resume.ts`)**

System:
```
You are a resume parser. Extract only information that is explicitly in the resume.
Return a single JSON object that matches the JSON Schema below exactly.
Do not include markdown, comments, or explanations.
Do not add, remove, or rename any keys.
Use empty strings for missing text fields, empty arrays for missing lists, and false for missing booleans.
Do not invent, infer, or translate. Preserve Arabic and English text in its original script.
Use simple HTML only when the original is already structured: wrap paragraphs in <p> and lists in <ul>/<li>.
If a date is missing, use "". Keep the original period text exactly as written.
```

User:
```
JSON Schema:
<resumeDataJsonSchema compact>

Annotated example (only 2 items, do not copy values literally):
{
  "basics": { "name": "...", "email": "..." },
  "experience": [{ "company": "...", "position": "...", "period": "...", "description": "..." }]
}

Resume text:
<extractedText>

The previous attempt failed with this error:
<previousError or "None">
```

**Plan**
1. Rewrite `buildParseResumePrompt` to include the compact JSON Schema, one tiny annotated example, the resume text, and the previous schema error.
2. Make the function pure; keep a 12,000-char text limit with a `[... truncated ...]` marker.
3. Add `locale` detection: if `locale.startsWith("ar")`, append an Arabic instruction to preserve script.

**Tests**
- Verify the JSON schema is present.
- Verify PII (emails, phone) is **not** logged; only the prompt structure is.
- Verify `previousError` is appended only when it fits under the model's context window.

### Phase D  Section decomposition (optional performance/accuracy boost)

**Why**
`resume-intel` and `SmartResume` show that processing sections in parallel, or with index pointers, improves accuracy and reduces cost.

**Plan (Phase 2)**
1. Add `packages/api/src/features/resume/section-detector.ts`.
2. Detect likely section boundaries from the text using a combination of:
   - Heading heuristics (all-caps, larger font from extraction metadata, blank lines).
   - The 20+ regex patterns from expert rule-based parsers.
3. Run one or more smaller LLM calls per section, or pass the section offsets to the one-shot prompt.
4. Merge results with the main schema.

**For Phase 1**, keep one-shot with the full schema but add **section boundary markers** in the extracted text to help the model (e.g., `## Experience`, `## Education`).

### Phase E  Defensive normalization and deep merge

**Why it is non-negotiable**
Even with a schema, cheap models can return `undefined` or omit `id`/`hidden`. The final `resumeDataSchema.parse` must not fail.

**Plan**
1. Create `packages/api/src/features/resume/normalize.ts` with `normalizeResumeData(input: unknown): { data: ResumeData; warnings: string[] }`.
2. `normalizeResumeData` does:
   - Deep-fill every scalar with safe defaults (`""`, `0`, `false`, `[]`).
   - For each section array (`experience`, `education`, `skills`, etc.), map each item and:
     - Generate `id` if missing using `generateId`.
     - Fill `hidden: false` if missing.
     - Fill every field from the canonical default item template.
   - Filter out items that are completely empty (e.g., `company`, `position`, `description` all empty for `experience`).
   - Keep an item if any meaningful field is present.
   - Normalize dates: do **not** change string values, but optionally flag `period` strings that look malformed.
   - Return `warnings` such as `experience[0].company was missing; defaulted to ""`.
3. Replace `mergeWithDefaults` in `llm-parser.ts` with `normalizeResumeData`.
4. Final `resumeDataSchema.parse` should now pass for any well-formed input.

**Tests**
- Partial LLM output with missing `company`, `id`, `hidden` → fully valid `ResumeData`.
- Extra fields are removed.
- Empty items are filtered.
- Arabic text preserved.
- Warnings returned for missing data.

### Phase F  Deterministic pre-extraction for contacts

**Plan**
1. Before calling the LLM, run deterministic regex for:
   - Email
   - Phone
   - LinkedIn, GitHub, portfolio URLs
   - Date ranges (capture all period strings)
   - Section headers
2. Pass the extracted contact list as part of the user prompt or as `basics` hints.
3. Use this to seed the `basics` and `profiles` so the LLM does not have to find them again.
4. Redact PII? **Optional** for Phase 2. If needed, replace emails/phones with `__PII_EMAIL_0__` placeholders, send redacted text to the LLM, and reinject real values after parsing.

### Phase G  Content catalogue normalization

**Plan**
1. After `normalizeResumeData`, run the existing `normalizeSkillsAndJobTitles`.
2. Expand it to also normalize `interests`, `languages`, and `profiles`:
   - `skills.name` → `packages/content` skill catalog (`getSkills`).
   - `experience.position` → `packages/content` job titles (`searchJobTitles`).
   - `languages.language` → canonical name if a match exists.
   - `profiles.network` → canonical network name for icon lookup.
3. Add missing skill `icon` and `iconColor` defaults.

### Phase H  Web UX and import review

**Plan**
1. Keep the step toasts (`Extracting...`, `Parsing with AI...`, `Importing...`).
2. Add a **post-import summary** in the builder:
   - "Found 3 jobs, 1 degree, 12 skills, 2 languages."
   - "Some items were missing fields. Please review the Experience section."
3. Return the `warnings` array from the parser to the web client so the UI can show a non-blocking alert.
4. If the LLM is unavailable or fails, surface the fallback toast.

### Phase I  Observability, metrics, and golden tests

**Plan**
1. Create `packages/api/src/features/resume/__fixtures__/` with at least these fixtures:
   - `en-single-column.txt`  full English CV, all sections.
   - `en-two-column.txt`  sidebar layout.
   - `ar-single-column.txt`  Arabic CV.
   - `en-minimal.txt`  only name, email, skills.
   - `en-partial.txt`  missing `company` in one job (tests filtering).
   - `en-noisy.txt`  tables, extra whitespace, creative headings.
2. For each fixture, create `expected-output.json` with the expected `ResumeData`.
3. Add `parseResumeWithLlm` integration tests using mocked LLM responses.
4. Add quality metrics tracked in `evals/results.json`:
   - field-level accuracy vs fixtures
   - schema failure rate
   - fallback rate
   - avg latency per provider
5. Keep `console.info` / `console.warn` logs (no PII content).

---

## 7. Provider strategy and model selection

### Gemini (recommended)
- **Models**:
  - `gemini-2.5-flash-lite`  cheapest, good once the schema is in place.
  - `gemini-2.5-flash`  better for complex/mixed-language.
  - `gemini-2.5-pro`  use only if Flash misses fields.
- **Endpoints**:
  - OpenAI-compatible: `https://generativelanguage.googleapis.com/v1beta/openai/v1/chat/completions`.
  - Native: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`.
- **Auth**: `Authorization: Bearer <key>` (OpenAI-compatible) or `x-goog-api-key` (native).
- **Structured output**: `responseMimeType: "application/json"` + `responseJsonSchema`.

### OpenAI / OpenAI-compatible
- **Models**: `gpt-4o-mini`, `gpt-4o`.
- **Structured output**: `response_format: { type: "json_schema", json_schema: { strict: true, ... } }`.

### Ollama (local)
- **Models**: `llama3.1:8b`, `qwen2.5-coder`, `qwen2.5`.
- **Structured output**: `format: <json-schema>`.

### Recommendation
- **Dev**: Ollama or Gemini Flash-Lite.
- **Production**: Gemini 2.5 Flash for cost/quality, OpenAI 4o-mini as fallback.

---

## 8. Dependencies to add

- `zod-to-json-schema` in `packages/schema` (or upgrade to Zod v4 and use `z.toJSONSchema` if available).
- `unpdf` or `pdfexcavator` in `apps/web` for Phase-2 layout extraction.
- `mammoth` in `apps/web` if choosing it for DOCX.
- `tesseract.js` in `apps/web` only if Phase-2 OCR is approved.

### Do not add
- OpenAI SDK, Google SDK, Vercel AI SDK.
- Python packages unless the `marker` microservice is approved.

---

## 9. Security and PII

- API keys are server-only (`LLM_API_KEY` in `packages/env/src/server.ts` and `turbo.json`).
- Do not log resume text, prompts, or model responses.
- Logs allowed: file type/size, page/line counts, model, status, duration, extracted item counts, schema error summaries.
- Optional PII redaction in Phase 2: replace `email`, `phone`, `URL`, `location` with deterministic placeholders before sending to the LLM, then reinject after extraction.
- Rate limit `parseFromText` with `resumeMutationRateLimit` (already in place).

---

## 10. Testing strategy

### Unit tests
- `llm-client.test.ts`  all providers, headers, schema, retries, timeout.
- `normalize.test.ts`  partial input → valid `ResumeData`.
- `buildParseResumePrompt.test.ts`  schema present, no markdown, retry context.
- `extract-text.test.ts`  PDF/DOCX/TXT fixtures.

### Integration tests
- `llm-parser.test.ts`  mock `complete` for each fixture and assert `ResumeData` and warnings.

### Golden tests
- `__fixtures__/` with 6+ real-world resume texts.
- `expected-output.json` for each.
- CI runs golden tests after every prompt/model change.

### Manual smoke tests
- 5 real PDFs, 5 real DOCXs, 2 Arabic resumes.
- Track: success rate, schema failures, fallback rate, avg latency.

---

## 11. Rollout plan

### Step 1  Immediate (highest ROI)
1. Add `packages/schema/src/resume/extraction.ts` and `resumeDataJsonSchema`.
2. Rewrite the prompt to be schema-first.
3. Add `packages/api/src/features/resume/normalize.ts` and call it from `llm-parser.ts`.

### Step 2  Quality
4. Improve `extractTextFromFile` reading order for two-column PDFs.
5. Add contact pre-extraction regex.
6. Add golden fixtures.

### Step 3  Scale
7. Add section decomposition (parallel prompting) if one-shot is still weak.
8. Add OCR for scanned PDFs.
9. Add PII redaction option.

### Verification
```sh
pnpm --filter @headcv/api test
pnpm --filter web typecheck
pnpm --filter @headcv/schema typecheck
pnpm exec turbo boundaries
```

---

## 12. Risks and mitigations

| Risk | Mitigation |
|---|---|
| JSON schema too large for provider limits | Strip `metadata` and `picture`; simplify `customSections` union if needed; measure token size before sending. |
| Flash-Lite still misses required fields | Retry with schema error; fallback to Flash; use stronger model on retry. |
| Two-column layouts still confuse the model | Add XY-cut/column detection in extraction; pass `## Section` markers. |
| Arabic/English mixed lines | Do not force translation; keep both scripts; use `locale` from the upload. |
| Empty arrays in output | Normalize step filters/defaults; optional: omit empty non-essential arrays before validation. |
| PII in prompts | Pre-extract and redact (Phase 2); never log PII. |
| License issues if copying `open-resume` | Do not copy files; only use for architecture reference. |

---

## 13. Recommended `.env.local`

```env
# Gemini via OpenAI-compatible endpoint
LLM_BASE_URL="https://generativelanguage.googleapis.com/v1beta/openai"
LLM_MODEL="gemini-2.5-flash-lite"
LLM_API_KEY="your-gemini-api-key"
LLM_TIMEOUT="120"
LLM_MAX_TOKENS="4000"
LLM_TEMPERATURE="0"
```

For better quality:
```env
LLM_MODEL="gemini-2.5-flash"
```

---

## 14. First golden fixtures

1. `en-full.txt`  full single-column English resume with all 12 sections.
2. `en-two-column.txt`  left sidebar with contact and skills; main column with experience and education.
3. `ar-full.txt`  Arabic resume with mixed bilingual skills.
4. `en-minimal.txt`  only name, email, phone, 3 skills.
5. `en-partial.txt`  one job missing company (tests filtering).
6. `en-noisy.txt`  tables, creative headings, extra whitespace.

---

## 15. Appendices

### A. Reference repositories
- `https://github.com/Edwinfom00/resume-intel`
- `https://github.com/alibaba/SmartResume`
- `https://github.com/infiniflow/ragflow`
- `https://github.com/Tushar-9802/Resume-parser`
- `https://github.com/jsonresume/resume-schema`

### B. Key internal files
- `packages/schema/src/resume/data.ts`  canonical `ResumeData` schema.
- `packages/schema/src/resume/default.ts`  default values.
- `packages/api/src/lib/llm-client.ts`  provider abstraction.
- `packages/api/src/features/resume/llm-parser.ts`  parser orchestration.
- `packages/api/src/features/resume/prompts/parse-resume.ts`  prompt builder.
- `apps/web/src/features/resume/import/extract-text.ts`  text extraction.
- `packages/import/src/text-resume.tsx`  deterministic fallback.
