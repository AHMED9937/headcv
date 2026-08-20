# Baseline Failures and Known Deviations (S0)

Recorded during the S0 foundation-fork slice: fork of `amruthpillai/reactive-resume` v5.1.6, with AI/MCP removal and no-AI gate verification.

## Test results

`pnpm test` (full monorepo, Vitest via Turborepo): **all test suites pass** except one flaky timing test, confirmed unrelated to AI/MCP removal:

- `@reactive-resume/pdf` → `src/hooks/use-register-fonts.test.ts` → `registers CJK PDF fallbacks for normal and italic text styles` timed out at the default 5000ms when run under full parallel `turbo run test` load. Re-running the file in isolation (`pnpm --filter @reactive-resume/pdf test -- src/hooks/use-register-fonts.test.ts`) passes in ~1.5s. This is a pre-existing environment-speed sensitivity, not a regression from this slice. No code change was made to this test or the font registration hook.

## Build

- `pnpm build` (root) fails under native Windows PowerShell because `apps/web`'s `build` script uses the POSIX command `rm -rf dist`. This is a pre-existing cross-platform gap in the upstream script, not introduced by this slice. Verified independently:
  - `apps/server` build (`tsdown`) succeeds standalone.
  - `apps/web` build succeeds standalone via `pnpm exec vite build` after manually clearing `dist/`.
  - See `LOCAL-SETUP.md` for the Windows workaround. Recommend replacing `rm -rf dist` with `rimraf dist` or `shx rm -rf dist` in a later slice so `pnpm build` works cross-platform without a workaround.

## No-AI gate — verified

- `pnpm why @reactive-resume/ai` → no packages found.
- `pnpm why @reactive-resume/mcp` → no packages found.
- `pnpm why openai` / `anthropic` / `@ai-sdk/*` / `ollama-ai-provider-v2` / `@modelcontextprotocol/sdk` → no packages found.
- `pnpm typecheck`, `pnpm exec turbo boundaries`, and `pnpm test` all pass after removal.
- `.env.example` and `turbo.json` `globalEnv` no longer contain `REDIS_URL`, `ENCRYPTION_SECRET`, or `FLAG_ALLOW_UNSAFE_AI_BASE_URL`.

## Database schema — Plan B applied to `resume_analysis`

The upstream `resume_analysis` table (`packages/db/src/schema/resume.ts`, Drizzle table `resumeAnalysis`) is **not removed** in S0. Its only writer was the deleted `ai.analyzeResume` mutation; the read-only `resumeService.analysis` accessor and `analysisRouter` route have been removed from the API surface, and the AI-triggered builder sidebar section (`resume-analysis.tsx`) has been deleted. The table itself remains in the schema, inert, until a later slice (per `technical-research.md`) replaces it with the deterministic `ResumeReview` table described in `Doc/pack/erd-mvp.md`. No migration was generated to drop the table in S0; this is intentional to avoid a destructive schema change before `ResumeReview` is designed and ready to take its place.

The upstream `agent.ts` schema (`aiProvider`, `agentThread`, `agentMessage`, `agentAttachment`, `agentAction` tables) **was removed** (Plan A) along with its relations in `packages/db/src/relations.ts`, since these tables existed solely to support the removed AI agent workspace and had no other consumer. No data migration was required because this is a fresh fork with no production data.

## Documentation — partially updated, not exhaustively rewritten

The public docs site under `docs/` (Mintlify-style `.mdx` content, `docs/docs.json` nav) is upstream's open-source project documentation, not yet replaced with NexaCV-specific content (that is planned for later slices). For S0:

- Deleted docs pages that describe removed features entirely: `docs/guides/using-ai.mdx`, `docs/guides/using-ai-in-the-builder.mdx`, `docs/guides/using-ai-agent.mdx`, `docs/guides/ai-agent-tools.mdx`, `docs/guides/using-the-mcp-server.mdx`, `docs/use-cases/ai-resume-builder.mdx`, `docs/use-cases/api-mcp-resume-automation.mdx`, and the internal implementation log `docs/superpowers/specs/2026-05-19-agent-snapshot-rollback-design.md`.
- Removed the corresponding entries from `docs/docs.json` navigation.
- Fixed now-broken cross-references in `docs/use-cases/self-hosted-resume-builder.mdx`, `docs/use-cases/privacy-focused-resume-builder.mdx`, and `docs/guides/using-the-builder-dock.mdx`.
- Updated `AGENTS.md` and `docs/contributing/architecture.mdx` to remove `packages/ai`/`packages/mcp` from the codebase map, workspace map, boundary rules, and feature-placement tables.
- **Not updated in S0** (deferred, lower risk, non-blocking for build/test/typecheck): `docs/changelog/index.mdx` (historical release notes — left as an accurate historical record of what upstream shipped, not current-state documentation), `docs/self-hosting/docker.mdx`, `docs/self-hosting/migration.mdx`, `docs/getting-started/quickstart.mdx`, `docs/legal/terms-of-service.mdx`, `docs/legal/privacy-policy.mdx`, and the `docs/superpowers/worklogs/` and `docs/superpowers/plans/` implementation logs for the original AI/MCP monorepo reorg (kept as historical engineering record). These should be revisited when the public docs site is rebranded for NexaCV.

## Docker Compose — Redis removed

`compose.yml` and `compose.dev.yml`: removed the `redis` service, its `REDIS_URL` wiring, `redis_data` volume, and the `reactive_resume` service's dependency on `redis`. Redis was used only by the removed AI agent's resumable-stream feature.

## Dependency removals not explicitly listed in the original S0 task but required for a working build

Removing `@reactive-resume/ai` and `@reactive-resume/mcp` required also removing their direct consumers, which were not separate top-level "AI packages" but were wired into otherwise-generic modules:

- `packages/api/src/routers/index.ts` — removed `ai`, `aiProviders`, `agent` router registrations.
- `packages/api/src/features/resume/router.ts`, `service.ts` — removed the `analysis` sub-router/service (see "Database schema" above).
- `apps/web/src/libs/resume/section.tsx`, `apps/web/src/routes/builder/$resumeId/-sidebar/right/index.tsx`, and the deleted `.../sections/resume-analysis.tsx` — removed the builder sidebar's AI resume-analysis section.
- `apps/web/src/dialogs/resume/import.tsx` — removed the AI-powered PDF/DOCX resume-import options (`client.ai.parsePdf`, `client.ai.parseDocx`, `orpc.aiProviders.list`); the non-AI JSON import formats (Reactive Resume JSON, Reactive Resume v4 JSON, JSON Resume) are unaffected.
- `apps/web/src/features/settings/integrations/index.tsx`, `apps/web/src/routes/dashboard/settings/integrations/route.tsx` — replaced the AI-provider settings section with a neutral "no integrations available yet" placeholder; the route itself is kept (not deleted) to avoid a TanStack Router route-tree regeneration pass in S0.
- `apps/web/src/features/command-palette/pages/navigation.tsx` — replaced the `OpenAiLogoIcon`/"Artificial Intelligence" keyword on the Integrations command-palette entry with a neutral `PuzzlePieceIcon`.
- `apps/server/src/http/app.ts`, `apps/server/src/openapi/metadata.ts`, `apps/server/src/static/{seo,web}.ts` (+ their tests), `apps/web/vite.config.ts`, `apps/server/tsdown.config.ts` — removed `/mcp` route mounts, the MCP server-card endpoint, MCP dev-proxy path, and the AI-prompts asset-copy build plugin.
- `packages/db/src/schema/index.ts`, `packages/db/src/relations.ts` — removed the `agent` schema export and all `aiProvider`/`agentThread`/`agentMessage`/`agentAttachment`/`agentAction` relations.

All of the above were verified via `pnpm typecheck`, `pnpm exec turbo boundaries`, `pnpm test`, and a full `pnpm build` (web + server) after the changes.
