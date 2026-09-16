# Slice 0  Foundation Fork and Team Setup

## Status: Implemented

- Fork created: `https://github.com/AHMED9937/headcv` (private).
- Baseline branch `chore/upstream-headcv-v5.1.6` pushed and protected (1 required review, enforce-admins, no force-push/delete).
- Archive branch `archive/upstream-ai-mcp-v5.1.6` pushed with `ARCHIVE.md` restore instructions, created before any AI/MCP deletion.
- AI/MCP removal committed (`a3c2c1b`): `packages/ai`, `packages/mcp`, `packages/api/src/features/{ai,ai-providers,agent}`, `apps/server/src/mcp`, `apps/web/src/routes/agent`, AI settings UI, AI-triggered resume-analysis sidebar section, AI-powered PDF/DOCX import options, agent/aiProvider DB schema and relations, `REDIS_URL`/`ENCRYPTION_SECRET`/`FLAG_ALLOW_UNSAFE_AI_BASE_URL`, and the `redis` compose service.
- Verified: `pnpm install`, `pnpm why @headcv/ai` / `@headcv/mcp` / `openai` / `anthropic` / `ollama-ai-provider-v2` (all empty), `pnpm typecheck` (16/16 packages), `pnpm exec turbo boundaries` (607 files, no issues), `pnpm test` (all pass except one confirmed-flaky, unrelated font-registration timing test), `pnpm build` (web + server, via bash to match Linux CI).
- Added `.github/workflows/baseline.yml` CI: no-AI dependency/source gate + typecheck/boundaries/test/build.
- Added `LOCAL-SETUP.md`, `THIRD-PARTY-NOTICES.md`, `BASELINE-FAILURES.md` at the repo root.
- `resume_analysis` DB table intentionally kept (Plan B) as inert until replaced by `ResumeReview` in a later slice; documented in `BASELINE-FAILURES.md`.
- Docs site (`docs/`) AI/MCP-only pages deleted and nav updated; broader docs-site rebrand deferred to a later slice (documented in `BASELINE-FAILURES.md`).

## One-sentence summary

Create a clean, AI/MCP-free, reproducible fork of `AHMED9937/headcv` v5.1.6 in the designated GitHub org, archive the original AI/MCP code for post-MVP reuse, harden the environment, and prove the monorepo builds, tests, and exports a PDF on the team's machines.

## Gates and prerequisites

- This is Slice 0 (`S0` in `slice-backlog.md`); it must complete before any feature slice (S1+) can start.
- Style freeze (G2) is **not** required for S0; S0 is a pure engineering/foundation slice.
- Output of S0 is the protected `chore/upstream-headcv-v5.1.6` branch and the archive `archive/upstream-ai-mcp-v5.1.6` branch.

## Scope and prompt hats

This slice follows these hats from `../../prompts-playbook.md`:

- `SHIP-02: Release`  DevOps releaser: fork, global setup, env matrix, build, smoke.
- `BUILD-02: Security`  security engineer: 7-rung security ladder for the no-AI gate, env cleanup, forbidden imports.
- `SHIP-01: Test`  QA tester: test pyramid, smoke, negatives, baseline failures.
- `CARE-03: Audit / drift`  auditor: license audit, drift check, dependency scan.

## Assumptions and open inputs

- `[GITHUB_ORG]` is the target GitHub organization for the fork. The repo will initially keep the upstream name `headcv` because product name/domain are still open (`Q9`).
- The starting source is the repository root checkout at tag `v5.1.6`.
- GitHub CLI (`gh`) is installed and authenticated to the target org.
- Docker, Node 24, and `corepack` are available on the developer machines.
- The team agrees to delete AI/MCP packages now while preserving them in an archive branch for later reuse.

## Goal

A clean, reproducible fork of `AHMED9937/headcv` v5.1.6 with all AI/MCP integrations removed (and archived) and every developer able to build, test, and export a PDF locally.

## Stories covered

None directly; enables all downstream slices.

## Depends on

None.

## Riskiest assumption

The upstream repo builds and exports a PDF on the team's environment without modifications.

## Best-practice rules that apply to every step

- Use `corepack enable` for pnpm; do not install a global `pnpm` separately unless documented.
- Use `dotenvx run -f .env.local --` for any command that needs environment at runtime or during migrations.
- Use `pnpm --filter <package> <command>` for focused checks before running the full repo command.
- Run `pnpm exec turbo boundaries` after any package or import change.
- Run `pnpm check` (Biome) before any commit; the `lefthook.yml` pre-commit hook also runs it.
- Never commit `.env.local`, `.env`, or any secret.
- Add every new environment variable to both `packages/env/src/server.ts` and `turbo.json` `globalEnv`.
- Keep the upstream `LICENSE` file and `AGENTS.md` intact unless they contain AI/MCP instructions; in that case, prune only the AI/MCP-specific sections and leave the rest.

## What we build / adapt

### Phase 0  Fork and baseline branch (`SHIP-02: Release`)

1. Confirm the repository root checkout is on the v5.1.6 release:
   - `git log --oneline -1` must show `19b412d chore(release): v5.1.6`.
   - If not, `git fetch --tags` and `git checkout 19b412d` (or `git checkout v5.1.6`).
2. Clean the worktree so the baseline branch contains only the upstream release:
   - `git status --short` should be empty except for untracked files that are safe to delete.
   - `git clean -fdx .` to remove any build artifacts, `node_modules`, or untracked files.
3. Create the remote destination under `[GITHUB_ORG]`:
   - Preferred: `gh repo fork AHMED9937/headcv --org [GITHUB_ORG] --remote=false`.
   - If that fails because the repo already exists: `gh repo create [GITHUB_ORG]/headcv --private --confirm`.
   - If `gh` is unavailable, create it manually on GitHub and record the SSH or HTTPS URL.
4. Re-initialize the local checkout as the baseline:
   - `git remote remove origin` (or `git remote set-url origin <new-url>`).
   - `git remote add origin https://github.com/[GITHUB_ORG]/headcv.git`.
   - `git branch -m chore/upstream-headcv-v5.1.6`.
   - `git push -u origin chore/upstream-headcv-v5.1.6`.
5. Set branch protection on `chore/upstream-headcv-v5.1.6`:
   - Require PRs, at least one reviewer, linear history, and required status checks.
   - If branch protection cannot be configured via `gh` yet, document it in the slice runbook and set it once CI is green.

### Phase 0.5  Pre-deletion archive (`SHIP-02: Release`)

Before any AI/MCP code is removed, preserve it in a recoverable archive branch:

1. From `chore/upstream-headcv-v5.1.6`:
   - `git checkout -b archive/upstream-ai-mcp-v5.1.6`
   - `git push -u origin archive/upstream-ai-mcp-v5.1.6`
2. Add a `README.md` (or `ARCHIVE.md`) in the branch root listing the directories archived: `packages/ai`, `packages/mcp`, `apps/server/src/mcp`, `apps/web/src/routes/agent`, `packages/api/src/features/ai`, `packages/api/src/features/ai-providers`, `packages/api/src/features/agent`.
3. Return to `chore/upstream-headcv-v5.1.6` and continue the deletion there.

This branch is the canonical source if the team wants to restore or reference these features after MVP. Do not delete the branch until the product explicitly abandons the AI direction.

### Phase 1  AI/MCP removal and no-AI gate (`BUILD-02: Security`)

**1.1 Delete AI/MCP directories**

- `packages/ai`
- `packages/mcp`
- `packages/api/src/features/ai`
- `packages/api/src/features/ai-providers`
- `packages/api/src/features/agent`
- `apps/server/src/mcp`
- `apps/web/src/routes/agent`
- `apps/web/src/features/settings/integrations/ai-section.tsx` and any related AI settings components
- `apps/web/src/features/settings/integrations/components/ai-section.tsx` if different from above

**1.2 Strip AI/MCP package references**

- Remove `@headcv/ai` and `@headcv/mcp` from:
  - `apps/web/package.json`
  - `apps/server/package.json`
  - `packages/api/package.json`
  - `pnpm-lock.yaml` (via `pnpm install`, not manual edit)
- Remove `packages/ai` COPY instructions from `Dockerfile` and `Dockerfile.dev`.
- Remove the `aiPromptsDir` copy from `apps/server/tsdown.config.ts`.
- Remove any `mcp`/`ai` mention from `apps/server/src/openapi/metadata.ts`.
- Remove the `/mcp` mount from `apps/server/src/http/app.ts`.
- Remove any `mcp`/`ai` plugin lines from `apps/web/vite.config.ts`.
- Remove `mcp` references from `apps/server/src/static/seo.ts`, `web.ts`, and their tests if they break.
- Update `packages/ai`/`packages/mcp` mentions in `AGENTS.md` and `CLAUDE.md` to state they are removed for v1 and archived.

**1.3 Remove AI environment variables**

From `turbo.json` `globalEnv`, remove:

- `REDIS_URL`
- `ENCRYPTION_SECRET`
- `FLAG_ALLOW_UNSAFE_AI_BASE_URL`

From `.env.example`, remove those same variables and the `# --- AI Agent Workspace ---` block, plus any AI-specific comments mentioning `agent` or `AI providers`.

**1.4 Remove AI-related database schema (optional in S0; must be resolved before S4)**

- Search `packages/db/src/schema` for `aiProvider`, `agentThread`, `agentMessage`, `agentAction`, `agentAttachment`.
- If found, choose:
  - **Plan A (preferred):** remove the tables/columns and regenerate the initial migration with `dotenvx run -f .env.local -- pnpm db:generate`.
  - **Plan B (fallback):** keep the tables but empty them and add a `BASELINE-FAILURES.md` note that they must be removed in S4.

**1.5 Regenerate the lockfile and verify nothing resolves**

- `pnpm install` from the repo root.
- `pnpm why @headcv/ai` → `No packages found`.
- `pnpm why @headcv/mcp` → `No packages found`.
- `pnpm why openai`, `pnpm why anthropic`, `pnpm why @ai-sdk`, `pnpm why ollama-ai-provider-v2` → all empty.

**1.6 Add CI scan for forbidden AI imports**

Add to CI (e.g. `.github/workflows/baseline.yml`):

```bash
grep -R "@headcv/ai\|@headcv/mcp" apps packages --include="*.ts" --include="*.tsx" --include="*.json"
grep -R "openai\|anthropic\|@ai-sdk\|ollama-ai-provider-v2" . --include="*.ts" --include="*.tsx" --include="*.json"
```

The workflow must fail if any match is found.

### Phase 2  Environment and local setup (`SHIP-02: Release`)

**2.1 Ensure `dotenvx` is available**

- `dotenvx --version` or `corepack pnpm exec dotenvx --version`.
- If unavailable, `pnpm add -g dotenvx` is acceptable; otherwise document `npx dotenvx`.

**2.2 Produce a cleaned `.env.example`**

- **Required:** `APP_URL`, `DATABASE_URL`, `AUTH_SECRET`.
- **Application:** `PORT`, `SERVER_PORT`.
- **Social Auth (optional):** `GOOGLE_*`, `GITHUB_*`, `LINKEDIN_*`, `OAUTH_*`.
- **Email (optional):** `SMTP_*`.
- **Storage (optional):** `S3_*`, `LOCAL_STORAGE_PATH`.
- **Feature flags:** `FLAG_DISABLE_SIGNUPS`, `FLAG_DISABLE_EMAIL_AUTH`, `FLAG_DISABLE_IMAGE_PROCESSING`, `FLAG_ALLOW_UNSAFE_OAUTH_REDIRECT_URI`.
- **Tooling (optional):** `GOOGLE_CLOUD_API_KEY`, `CROWDIN_*`.
- No `REDIS_URL`, `ENCRYPTION_SECRET`, `FLAG_ALLOW_UNSAFE_AI_BASE_URL`.

**2.3 Create `docs/LOCAL-SETUP.md`**

1. `corepack enable`
2. `pnpm install`
3. `cp .env.example .env.local` and set `AUTH_SECRET` (any 64-char hex).
4. `docker compose -f compose.dev.yml up -d postgres`
5. `dotenvx run -f .env.local -- pnpm db:migrate`
6. `dotenvx run -f .env.local -- pnpm dev`
7. Open `http://localhost:3000` and verify `http://localhost:3001/api/health` returns 200.

Also document focused validation commands:

- `pnpm --filter web typecheck`
- `pnpm --filter @headcv/pdf test`
- `pnpm --filter @headcv/server typecheck`
- `pnpm exec turbo boundaries`
- `pnpm check` (Biome; write-capable)

**2.4 Document the `turbo.json` `globalEnv` rule**

Any new variable added to `packages/env/src/server.ts` must also be added to `turbo.json` `globalEnv`, or it will be `undefined` at runtime. Add this rule to `AGENTS.md` or `docs/LOCAL-SETUP.md`.

### Phase 3  License audit and baseline docs (`CARE-03: Audit / drift`)

**3.1 License audit**

- `pnpm licenses list --json > .tmp-licenses.json`.
- Generate `THIRD-PARTY-NOTICES.md` with:
  - The upstream `AHMED9937/headcv` MIT license.
  - A table of all direct/transitive dependency names, versions, and licenses.
  - A note that `packages/ai` and `packages/mcp` (and transitive AI SDKs) are removed for v1 and archived in `archive/upstream-ai-mcp-v5.1.6`.
- Keep the upstream `LICENSE` file at the repo root.

**3.2 Baseline failures log**

- `pnpm test` and `pnpm test:ci`.
- Record any environment-specific or pre-existing failures in `docs/BASELINE-FAILURES.md`.
- If a package fails because it referenced `packages/ai` or `packages/mcp`, fix or document the fix.

**3.3 Drift check against no-AI boundary**

- `grep -R "openai\|anthropic\|@ai-sdk\|ollama-ai-provider-v2\|mcp\|@headcv/ai" . --include="*.ts" --include="*.tsx" --include="*.json"`.
- Any remaining hit must have a justification written in `docs/BASELINE-FAILURES.md`.

### Phase 4  Verification and smoke tests (`SHIP-01: Test`)

**4.1 Clean install smoke**

- Clone or clean the repo, `corepack enable && pnpm install`.
- `pnpm build`.
- `pnpm typecheck`.
- `pnpm exec turbo boundaries`.

**4.2 Runtime smoke**

- `dotenvx run -f .env.local -- pnpm db:migrate`.
- `dotenvx run -f .env.local -- pnpm dev`.
- `curl http://localhost:3001/api/health` returns `200`.
- Sign-up page loads without runtime errors.

**4.3 PDF export smoke**

- Create a sample CV using an existing upstream template in English.
- Export to PDF and verify it is text-selectable, paginated, and visually matches the preview.
- Switch to `ar` locale, create a sample Arabic CV, and verify:
  - RTL text direction
  - `Noto Sans Arabic` font fallback
  - No clipped or mirrored punctuation

**4.4 No-AI gate final check**

- `pnpm why @headcv/ai` = no packages.
- `pnpm why @headcv/mcp` = no packages.
- CI scan passes.
- `.env.example` contains no AI/agent variables.

## Acceptance criteria

- `pnpm install` and `docker compose up` succeed on a fresh clone.
- Upstream Vitest suite passes (`pnpm test`).
- At least one upstream template renders a PDF in English and Arabic sample data.
- No imports remain for `ai`, `@ai-sdk/*`, `ollama-ai-provider-v2`, `@headcv/ai`, or `@headcv/mcp`.
- No AI provider API keys are present in `.env.example` or committed code.
- `THIRD-PARTY-NOTICES.md` lists all licenses.
- `.env.example` documents `APP_URL`, `DATABASE_URL`, `AUTH_SECRET`, and optional categories.

## Deliverable

Runnable local fork with AI disabled and archived, license audit complete, baseline CI green.

## Verification

Any developer follows `docs/LOCAL-SETUP.md` and completes `docker compose up` plus a guest PDF export in English and Arabic.

## Files to create or modify

- Repository root → re-initialized as the baseline repo and pushed to `[GITHUB_ORG]/headcv`.
- `THIRD-PARTY-NOTICES.md` (new)
- `LOCAL-SETUP.md` (new)
- `BASELINE-FAILURES.md` (new)
- `.env.example` (pruned)
- `turbo.json` (pruned)
- `pnpm-lock.yaml` (regenerated)
- `packages/ai`, `packages/mcp`, `packages/api/src/features/ai*`, `packages/api/src/features/agent`, `apps/server/src/mcp`, `apps/web/src/routes/agent` (deleted)
- `apps/server/src/http/app.ts`, `apps/server/src/openapi/metadata.ts`, `apps/web/vite.config.ts`, `apps/server/tsdown.config.ts`, `Dockerfile.dev` (AI/MCP references removed)
- `AGENTS.md`, `CLAUDE.md` (AI/MCP sections updated)
- `.github/workflows` (forbidden-AI scan added)
- `archive/upstream-ai-mcp-v5.1.6` branch (new, pushed)

## Design/UX references

Not applicable.

## Technical references

- `../erd-mvp.md`  Better Auth baseline, `Resume`, `GuestSession` ownership.
- `../technical-research.md`  upstream foundation, monorepo architecture, AI/MCP removal, removed-for-v1 env vars.
- Upstream: `package.json`, `Dockerfile`, `compose.dev.yml`, `packages/db/src/schema/*`, `turbo.json`, `.env.example`, `AGENTS.md`.

## Open questions / notes

- `Q10`: feature branches pending requirements approval.
- `Q9`: product name and domain pending trademark/domain review; repo keeps the name `headcv` until resolved.

## Definition of done

- Remote fork exists at `https://github.com/[GITHUB_ORG]/headcv`.
- `chore/upstream-headcv-v5.1.6` is the working baseline branch; `archive/upstream-ai-mcp-v5.1.6` is the archive branch.
- `pnpm install`, `pnpm build`, `pnpm typecheck`, and `pnpm exec turbo boundaries` pass on the baseline branch.
- `dotenvx run -f .env.local -- pnpm db:migrate` and `/api/health` succeed.
- A guest/sample CV can be created and a PDF can be exported in English and Arabic.
- No imports or dependencies for `@headcv/ai`, `@headcv/mcp`, `openai`, `anthropic`, `@ai-sdk/*`, or `ollama-ai-provider-v2` remain.
- `THIRD-PARTY-NOTICES.md`, `docs/LOCAL-SETUP.md`, and `docs/BASELINE-FAILURES.md` are committed.
- CI has a failing check for any forbidden AI/MCP import.

## Risks and considerations

- **Lockfile churn:** removing `packages/ai` and `packages/mcp` will produce a large `pnpm-lock.yaml` diff. This is expected and should be committed as a single atomic change in the baseline branch.
- **Hidden AI schema:** if `packages/db/src/schema` contains agent/AI tables, removing them may break existing migrations. Plan A is to remove them and regenerate the first migration; Plan B is to keep the tables but empty them and document the removal for S4.
- **Archive branch:** if `archive/upstream-ai-mcp-v5.1.6` is not pushed before deletion, the original AI/MCP files remain recoverable only from the `.tmp` checkout or the upstream tag, not from the fork's own history.
- **Branding:** upstream `HeadCV` name and SMTP `noreply@headcv.com` remain for S0 because product name is still open (`Q9`). Rebranding is deferred to S1.
- **CI timing:** branch protection can only require status checks after the first CI run. Set the policy last or document it as a post-CI step.
- **Missing GitHub org:** the exact `[GITHUB_ORG]` is required before Phase 0 step 3 can run.

## Decisions to confirm before starting

1. Exact GitHub organization name `[GITHUB_ORG]` for the fork.
2. Confirm keeping the repo name `headcv` until product name/domain are decided, or provide a new repo name now.
3. Confirm the team is OK with deleting `packages/ai` and `packages/mcp` while preserving them in `archive/upstream-ai-mcp-v5.1.6`.
