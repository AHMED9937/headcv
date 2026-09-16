# Technical Research  Universal CV Builder (HeadCV) v1

## Summary
HeadCV v1 is a forked, guest-first, Arabic/English CV SaaS built on top of `AHMED9937/headcv` v5.1.6. The upstream stack is a pnpm/Turborepo monorepo with a TanStack Start/React 19 web app, a Hono/oRPC server, PostgreSQL + Drizzle ORM, Better Auth, React PDF, Lingui i18n, Base UI + Tailwind v4, and a strict Biome/lefthook toolchain. The v1 adaptation removes AI and MCP packages, extends the `Resume` table for guest sessions, adds deterministic review and curated content catalogue tables, and keeps the upstream rendering and auth engines. This document records the technologies, package versions, architectural boundaries, and working conventions the team must follow.

## Upstream foundation

| Item | Value |
|---|---|
| Repository | `AHMED9937/headcv` |
| Version | `5.1.6` |
| License | MIT |
| Package manager | pnpm `11.3.0` |
| Workspaces | `apps/*`, `packages/*`, `tooling` |
| Main apps | `apps/web`, `apps/server` |

Sources: `package.json`, `Dockerfile`.

Why it was chosen:

- Mature, MIT-licensed baseline with reproducible `v5.1.6` tag.
- Already includes React 19, TypeScript, PostgreSQL, Drizzle ORM, Better Auth, multiple PDF templates, Docker, i18n, and RTL support.
- Two deployable apps and a clean internal-package boundary model.
- Product work is therefore UX adaptation and data-model extension, not a ground-up build.

## Monorepo architecture

### Turborepo and pnpm

| Tool | Version |
|---|---|
| `turbo` | `^2.9.14` |
| pnpm | `11.3.0` via `packageManager` |
| Workspaces | `apps/*`, `packages/*`, `tooling` |

Source: `package.json`.

### `turbo.json` boundaries and tags

`turbo.json` declares a `boundaries` block with tags that control which packages may depend on which:

- `app:web` for the TanStack Start web app.
- `app:server` and `runtime:server` for the Hono/Node server and server-only packages.
- `runtime:browser` for browser-only shared UI.
- `runtime:universal` for environment-neutral domain packages.
- `role:domain`, `role:ui`, `role:api`, `role:adapter`, `role:infra`, `role:rendering`, `role:tooling` for package intent.

`turbo exec turbo boundaries` is the boundary validator. Any new environment variable must also be added to `turbo.json` `globalEnv`, or Turborepo's strict env mode will filter it out at runtime.

Source: `turbo.json`, `AGENTS.md`.

## Runtime and toolchain

| Tool / runtime | Version / usage |
|---|---|
| Node.js | `24` (`ARG NODE_VERSION=24` in `Dockerfile`) |
| pnpm | `11.3.0` via `corepack enable` |
| TypeScript | `^6.0.3` and `@typescript/native-preview` `7.0.0-dev.20260526.1` |
| `tsgo` | Typecheck binary used as `tsgo --noEmit` |
| Vite | `^8.0.14` (web build) |
| tsx | `^4.22.3` (server dev) |
| tsdown | `^0.22.0` (server bundle) |
| dotenvx | `1.68.1` resolved in `pnpm-lock.yaml`; used as CLI for dev/migration commands |

Corepack is enabled in the Docker build. `dotenvx` is used because `drizzle-kit` does not auto-load `.env` files.

Sources: `package.json`, `apps/server/package.json`, `Dockerfile`, `pnpm-lock.yaml`, `AGENTS.md`.

## Apps

### Web app (`apps/web`)

| Layer | Technology | Version |
|---|---|---|
| Framework | TanStack Start / TanStack Router (file-based) | `^1.170.8` |
| Data fetching | TanStack Query | `^5.100.14` |
| Forms | TanStack Form | `^1.32.0` |
| React | React 19 | `^19.2.6` |
| Build | Vite | `^8.0.14` |
| RPC client | oRPC client + TanStack Query adapter | `^1.14.3` |
| PWA | PWA setup from upstream |  |

Key conventions:

- Routes are file-based under `apps/web/src/routes`; do not hand-edit `routeTree.gen.ts`.
- `apps/web/src/router.tsx` initializes `queryClient`, `orpc`, `theme`, `locale`, `session`, and `flags`.
- The builder shell is `apps/web/src/routes/builder/$resumeId`.
- Nested preview is client-only (`ssr: false`); public resume uses `ssr: "data-only"`.
- Browser-only PDF preview code lives under `apps/web/src/features/resume/preview` and `apps/web/src/features/resume/public`.

Source: `apps/web/package.json`, `AGENTS.md`.

### Server app (`apps/server`)

| Layer | Technology | Version |
|---|---|---|
| Framework | Hono | `^4.12.23` |
| Node adapter | `@hono/node-server` | `^2.0.4` |
| Dev/build | tsx / tsdown | `^4.22.3` / `^0.22.0` |
| RPC | oRPC server | `^1.14.3` |
| OpenAPI | `@orpc/openapi`, `@orpc/json-schema` | `^1.14.3` |
| Auth | Better Auth + plugins | `1.6.11` |
| Rate limiting | `@orpc/experimental-ratelimit` | `^1.14.3` |
| Image processing | sharp | `^0.34.5` |

The server owns HTTP route composition in `apps/server/src/{http,rpc,mcp,openapi,static,startup}`, runs migrations on startup, serves the built web `dist`, and exposes `/api/health`.

Source: `apps/server/package.json`, `AGENTS.md`, `Dockerfile`, `compose.dev.yml`.

## Internal packages summary

| Package | Exports / purpose |
|---|---|
| `@headcv/db` | Drizzle client and schema (`/client`, `/schema`) |
| `@headcv/auth` | Better Auth config, functions, types (`/config`, `/functions`, `/types`) |
| `@headcv/api` | oRPC routers, DTOs, feature modules (`/routers`, `/features/*`) |
| `@headcv/schema` | Zod schemas and typed resume/page/template models (`packages/schema/src/resume/*`) |
| `@headcv/pdf` | React PDF document, font registration, templates, browser/server adapters |
| `@headcv/resume` | Pure resume-domain helpers (JSON Patch, social icon mapping) |
| `@headcv/docx` | DOCX export generation |
| `@headcv/fonts` | Font loading and registration |
| `@headcv/email` | Email rendering and sending helpers |
| `@headcv/import` | Resume/CV import helpers |
| `@headcv/utils` | Narrow cross-cutting helpers with explicit exports |
| `@headcv/env` | Server environment validation and `.env` loading (`packages/env/src/server.ts`) |
| `@headcv/ui` | Shared Base UI/shadcn-style components and hooks |
| `@headcv/config` | Shared tooling config (Biome, TypeScript, etc.) |
| `@headcv/ai` | **Remove from v1 build** |
| `@headcv/mcp` | **Remove from v1 build** |

Internal packages are source-consumed through `package.json` export maps. Do not import another workspace's `src` files. New v1 packages such as `@headcv/content` must follow the same export-map convention.

Sources: `packages/*/package.json`, `AGENTS.md`.

## Data layer

### PostgreSQL and Drizzle

| Tool | Version |
|---|---|
| `pg` | `^8.21.0` |
| `drizzle-orm` | `1.0.0-rc.3` |
| `drizzle-kit` | `1.0.0-rc.3` |
| `drizzle-zod` | `1.0.0-beta.14-a36c63d` |

Migrations are generated with `drizzle-kit generate` and applied with `drizzle-kit migrate`. They live at the repo root in `migrations/`. The production server runs migrations on startup.

### Resume JSONB document shape

`packages/db/src/schema/resume.ts` defines `resume.data` as `jsonb` typed as `ResumeData`. The `ResumeData` schema in `packages/schema/src/resume/data.ts` contains:

- `picture`  profile photo settings.
- `basics`  name, headline, email, phone, location, website, custom fields.
- `summary`  title, columns, hidden, content.
- `sections`  profiles, experience, education, projects, skills, languages, interests, awards, certifications, publications, volunteer, references.
- `customSections`  user-created sections.
- `metadata`  `template`, `layout`, `page` (format, locale, margins, `hideIcons`), `design`, `typography`, `notes`.

The upstream `resume_statistics` and `resume_analysis` tables are in `packages/db/src/schema/resume.ts`; for v1 `resume_analysis` is replaced by the deterministic `ResumeReview` table (see `erd-mvp.md` for the `ResumeReview` schema and ownership rules).

### v1 guest-session extensions

Per `erd-mvp.md`:

- `Resume.userId` becomes nullable.
- A nullable `Resume.guestSessionId` references a new `guest_session` table.
- Exactly one of `userId` or `guestSessionId` is non-null at any time.
- New v1 tables: `guest_session`, `resume_review`, `export_record`, `job_title`, `phrase`, `skill`, `audit_log`.

Sources: `packages/db/package.json`, `packages/db/src/schema/resume.ts`, `packages/schema/src/resume/data.ts`, `erd-mvp.md`.

## Auth and security

### Better Auth and Drizzle adapter

| Package | Version |
|---|---|
| `better-auth` | `1.6.11` |
| `@better-auth/drizzle-adapter` | `^1.6.11` |
| `@better-auth/api-key` | `^1.6.11` |
| `@better-auth/oauth-provider` | `^1.6.11` |
| `@better-auth/passkey` | `^1.6.11` |
| `@better-auth/infra` | `^0.2.8` |

`packages/db/src/schema/auth.ts` defines the full Better Auth table set: `user`, `session`, `account`, `verification`, `twoFactor`, `passkey`, `apikey`, `jwks`, `oauthClient`, `oauthRefreshToken`, `oauthAccessToken`, `oauthConsent`. For v1 the primary flow is email/password through `user`, `session`, and `verification`.

### Secrets and environment

- `AUTH_SECRET` is required.
- `BETTER_AUTH_API_KEY` is optional and enables the Better Auth Dashboard.
- `ENCRYPTION_SECRET` is for the agent workspace, which is not part of v1.

### Rate limiting and storage security

- `@orpc/experimental-ratelimit` is wired into the oRPC server.
- Uploaded and exported files are stored under paths keyed by `resumeId` or `guestSessionId` and accessed through signed, short-lived URLs.
- `AuditLog` is append-only and must never contain CV text, raw PII, or export file content.

Sources: `packages/auth/package.json`, `packages/db/src/schema/auth.ts`, `packages/env/src/server.ts`, `packages/api/package.json`, `erd-mvp.md`.

## Storage

Storage is optional and falls back to local filesystem if S3 keys are absent.

| Variable | Purpose |
|---|---|
| `LOCAL_STORAGE_PATH` | Absolute path for local uploads/cache |
| `S3_*` | S3/SeaweedFS credentials and bucket |

If `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, and `S3_BUCKET` are all set, the app uses S3/SeaweedFS. `compose.dev.yml` runs a `seaweedfs` service and a bucket-creation job. Local files are written under `LOCAL_STORAGE_PATH`; S3 objects are prefixed by `resumeId` or `guestSessionId`. Signed URLs are required for access.

Sources: `.env.example`, `packages/env/src/server.ts`, `compose.dev.yml`.

## PDF and export

| Package | Version |
|---|---|
| `@react-pdf/renderer` | `^4.5.1` |
| `react-pdf-html` | `^2.1.5` |
| `@react-pdf/types` | `^2.11.1` |

`packages/pdf` exposes `/browser`, `/server`, `/document`, `/context`, `/section-title`, and `/templates` subpaths. Font registration, CJK fallbacks, and hyphenation live in the package. Templates are defined in `packages/schema/src/templates.ts`, implemented under `packages/pdf/src/templates/<name>/`, and registered in `packages/pdf/src/templates/index.ts`. Static preview images live under `apps/web/public/templates/{jpg,pdf}`. DOCX export belongs to `@headcv/docx`.

The upstream default template is `onyx`. v1 adds six original launch templates (three LTR, three RTL) that follow the same rendering contract.

Sources: `packages/pdf/package.json`, `packages/schema/src/resume/data.ts`, `AGENTS.md`.

## i18n and RTL

| Package | Version |
|---|---|
| `@lingui/core` | `^6.1.0` |
| `@lingui/react` | `^6.1.0` |
| `@lingui/cli` | `^6.1.0` |
| `@lingui/vite-plugin` | `^6.1.0` |
| `@lingui/format-po` | `^6.1.0` |

Arabic/English are v1 launch languages. The locale is stored in `ResumeData.metadata.page.locale` and rendered through the template system. The brand doc requires `Noto Sans Arabic` for Arabic and bidirectional icon handling.

Sources: `apps/web/package.json`, `packages/schema/src/resume/data.ts`, `brand-and-style.md`, `../../implementation-plan.md`.

## UI and forms

| Layer | Technology | Version |
|---|---|---|
| Design system | Tailwind CSS v4 | `^4.3.0` |
| Base UI / shadcn | `@base-ui/react`, `shadcn`, `class-variance-authority`, `tw-animate-css` | `^1.5.0`, `^4.8.0`, etc. |
| Forms | TanStack Form | `^1.32.0` |
| Rich text | TipTap React + extensions | `^3.23.6` |
| Drag and drop | `@dnd-kit/core`, `sortable`, `utilities` | `^6.3.1`, `^10.0.0`, `^3.2.2` |
| Panels | `react-resizable-panels` | `^4.11.2` |
| Toasts | `sonner` | `^2.0.7` |
| Icons | `@phosphor-icons/react` | `^2.1.10` |
| State | `zustand`, `immer` | `^5.0.13`, `^11.1.8` |
| Search | `fuse.js` | `^7.3.0` |

`packages/ui` exports `globals.css`, `components/*`, `hooks/*`, and `postcss.config`. Key UX rules: one primary action per screen, collapsed optional fields, drag actions with keyboard alternatives, mobile Editor/Preview tabs.

Sources: `apps/web/package.json`, `packages/ui/package.json`, `requirements.md`, `brand-and-style.md`.

## Testing

| Tool | Version |
|---|---|
| `vitest` | `^4.1.7` |
| `happy-dom` | `^20.9.0` |
| `@vitest/coverage-v8` | `^4.1.7` |
| `@testing-library/dom` | `^10.4.1` |
| `@testing-library/jest-dom` | `^6.9.1` |
| `@testing-library/react` | `^16.3.2` |
| `@testing-library/user-event` | `^14.6.1` |

Every package uses `vitest run --passWithNoTests`. CI uses `--coverage` plus `github-actions`, `json`, and `junit` reporters. Playwright is not present in the inspected upstream dependency manifests; the v1 test strategy is Vitest + `happy-dom`. If E2E is added later, it must be introduced as a new tooling concern.

Sources: `package.json`, `apps/*/package.json`.

## Linting and formatting

| Tool | Version |
|---|---|
| `@biomejs/biome` | `^2.4.15` |
| `lefthook` | `^2.1.8` |
| `@commitlint/cli` | `^21.0.1` |
| `@commitlint/config-conventional` | `^21.0.1` |
| `knip` | `^6.14.2` |

Biome rules: tabs, line width `120`, double quotes, organized import groups, sorted Tailwind classes for `clsx`, `cva`, `cn`, `noExplicitAny`, and no importing another workspace's `src`. `pnpm check` runs `biome check --write --unsafe .`. `lefthook.yml` runs Biome on staged files and `commitlint` on commit messages. `pnpm exec turbo boundaries` validates package boundaries; `pnpm knip` detects unused code.

Sources: `package.json`, `biome.json`, `lefthook.yml`.

## DevOps and deployment

### Dockerfile

The production `Dockerfile` is multi-stage:

- `base`  `node:24-slim` with `corepack` and `pnpm`.
- `pruner`  `turbo prune web server --docker`.
- `builder`  installs and builds web + server.
- `runtime-pruner` / `runtime-deps`  installs production server-only dependencies.
- `runtime`  final image on port `3000`, sets `LOCAL_STORAGE_PATH=/app/data`, runs `apps/server/dist/index.mjs`, and exposes a `/api/health` healthcheck.

### Docker Compose dev

`compose.dev.yml` provides the app, `postgres`, `redis`, `seaweedfs`, and a `seaweedfs_create_bucket` job. Profiles allow starting only the database or database + storage as needed.

### Migrations and healthchecks

- Production starts by running Drizzle migrations before serving traffic.
- `/api/health` is the server health endpoint.
- All services have Docker healthchecks.

Sources: `Dockerfile`, `compose.dev.yml`, `AGENTS.md`, `../../implementation-plan.md`.

## Environment variables

### Required variables

The three required variables for local dev are:

- `APP_URL`
- `DATABASE_URL`
- `AUTH_SECRET`

### Optional categories

- Application: `PORT`, `SERVER_PORT`, `APP_URL`.
- Social auth: `GOOGLE_*`, `GITHUB_*`, `LINKEDIN_*`.
- Custom OAuth: `OAUTH_PROVIDER_NAME`, `OAUTH_CLIENT_ID`, etc.
- SMTP: `SMTP_HOST`, `SMTP_PORT`, etc.
- Storage: `LOCAL_STORAGE_PATH`, `S3_*`.
- AI/agent (not v1): `REDIS_URL`, `ENCRYPTION_SECRET`.
- Feature flags: `FLAG_DISABLE_SIGNUPS`, `FLAG_DISABLE_EMAIL_AUTH`, etc.
- Tooling: `GOOGLE_CLOUD_API_KEY`, `CROWDIN_*`.

### Removed for v1 (AI/MCP)

The following variables are not allowed in the v1 build and must not appear in `.env.example` or committed code:

- `REDIS_URL`
- `ENCRYPTION_SECRET`
- `FLAG_ALLOW_UNSAFE_AI_BASE_URL`
- Any provider-specific key for `openai`, `anthropic`, `@ai-sdk/*`, or `ollama-ai-provider-v2`

These were inherited from upstream AI/MCP features and are removed in the v1 fork per S0.

### Critical rule

Any new variable in `packages/env/src/server.ts` must also be added to `turbo.json` `globalEnv`. Turborepo 2.x strict env mode filters out unlisted variables, making them `undefined` at runtime even when set in the shell or container.

Sources: `packages/env/src/server.ts`, `.env.example`, `turbo.json`, `AGENTS.md`.

## Project-specific adaptations

1. **No AI in MVP.** Requirement M4.8 forbids any model/LLM/embedding/generative service call. All `@ai-sdk/*`, `ai`, `ollama-ai-provider-v2`, `@headcv/ai`, and `@headcv/mcp` packages are removed from the v1 build.
2. **Guest-first flow.** A visitor clicks `Create my CV` and reaches the builder without signing in. Account prompt comes after the first preview or export. The `Resume` table is extended with a nullable `userId` and a `guestSessionId`.
3. **Arabic/English at launch.** Full UI, templates, validation, tips, phrases, and PDF export in both languages. The locale is stored in `ResumeData.metadata.page.locale`.
4. **Deterministic review.** The `Improve CV` panel uses rule-based checks, not an opaque score and not an LLM. Findings are stored in `ResumeReview`.
5. **Curated content catalogue.** `JobTitle`, `Phrase`, and `Skill` tables feed job-title-filtered suggestions and editable phrase patterns with unresolved placeholder validation.
6. **Original templates.** Six launch templates (three LTR, three RTL) built from the HeadCV design system.
7. **Honest commercial disclosure.** Free/account/payment rules are shown before setup starts.

Sources: `requirements.md`, `user-stories.md`, `erd-mvp.md`, `../../implementation-plan.md`.

## Best-practice rules

### Placement decision tree

When changing code, use this order:

1. Web route / loader / workflow  `apps/web/src/routes` or `apps/web/src/features`.
2. Server HTTP route, adapter, startup check, static handler  `apps/server/src`.
3. Authenticated API behavior  `packages/api/src/features/*`.
4. Pure resume data behavior with no DB/HTTP/DOM/PDF dependency  `packages/resume`.
5. PDF rendering  `packages/pdf`; PDF.js/canvas UI  `apps/web/src/features/resume`.
6. DOCX export  `packages/docx`.
7. Generic UI  `packages/ui`; workflow UI  owning web feature.
8. Cross-cutting helper  explicit `packages/utils` export only if no domain package is better.

### Workspace import rules

- Do not import another workspace's `src` tree.
- Do not import `apps/**` or `packages/**` by repository path.
- Use package names and `package.json` export maps.
- Use explicit subpaths for browser/server code (e.g., `@headcv/pdf/browser`, `@headcv/env/server`).

### Data and schema discipline

- No frontend data mocks.
- Add schema changes in `packages/schema/src/resume/*` first, then `packages/db`, `packages/api`, and finally web/PDF/DOCX.
- Add DB columns/tables in `packages/db/src/schema/*`, then run `dotenvx run -f .env.local -- pnpm db:generate`.
- JSON Patch belongs in `@headcv/resume/patch`.
- DOCX belongs in `@headcv/docx`.
- New templates require updates in `packages/schema/src/templates.ts`, `packages/pdf/src/templates/index.ts`, the template source directory, and `apps/web/public/templates/{jpg,pdf}`.

### Commands and validation

- Run dev/migration commands through `dotenvx`.
- Use `pnpm --filter <package>` for focused validation.
- Run `pnpm exec turbo boundaries` to catch cross-package violations.
- Keep `@headcv/ai` and `@headcv/mcp` packages and tables out of the v1 build.

Sources: `AGENTS.md`, `biome.json`, `turbo.json`.

## Common commands

| Task | Command |
|---|---|
| Install dependencies | `pnpm install` |
| Start Postgres only | `sudo docker compose -f compose.dev.yml up -d postgres` |
| Start Postgres + SeaweedFS | `sudo docker compose -f compose.dev.yml up -d postgres seaweedfs seaweedfs_create_bucket` |
| Generate migrations | `dotenvx run -f .env.local -- pnpm db:generate` |
| Run migrations | `dotenvx run -f .env.local -- pnpm db:migrate` |
| Dev server (web + server) | `dotenvx run -f .env.local -- pnpm dev` |
| Web dev server only | `dotenvx run -f .env.local -- pnpm dev:web` |
| Lint and format | `pnpm check` |
| Boundary check | `pnpm exec turbo boundaries` |
| Tests | `pnpm test` |
| Build | `pnpm build` |
| Typecheck | `pnpm typecheck` |
| Focused package check | `pnpm --filter web typecheck` or `pnpm --filter @headcv/pdf test` |

Source: `AGENTS.md`, `package.json`.

## Risks and notes

1. **Drizzle release candidates.** `drizzle-orm` and `drizzle-kit` are `1.0.0-rc.3`; `drizzle-zod` is a pinned beta. Watch for breaking changes before upgrading.
2. **Tailwind CSS v4.** CSS-first configuration differs from v3. The team must use the new `@theme` and `@import` patterns.
3. **Better Auth plugin surface.** `api-key`, `oauth-provider`, `passkey`, and `infra` plugins are present but not v1 features. Remove imports cleanly.
4. **AI and MCP removal.** The web app, server, and API package depend on `@headcv/ai` and `@headcv/mcp`. Strip these imports and related DB tables for v1.
5. **dotenvx requirement.** Drizzle Kit does not read `.env` files. Forgetting `dotenvx` before `db:*` commands is the most common local failure.
6. **Strict Turborepo env mode.** New variables fail silently unless added to `turbo.json` `globalEnv`.
7. **TypeScript `6.x` preview.** The project pins `typescript` `^6.0.3` and a native preview compiler. Confirm availability on every machine before onboarding.
8. **RTL PDF and fonts.** Arabic rendering depends on `Noto Sans Arabic` and correct CJK/RTL font stacks. Test every template with Arabic sample data.

Sources: `package.json`, `packages/*/package.json`, `AGENTS.md`, `erd-mvp.md`.

## References

- `../../package.json`
- `../../apps/web/package.json`
- `../../apps/server/package.json`
- `../../turbo.json`
- `../../biome.json`
- `../../lefthook.yml`
- `../../.env.example`
- `../../Dockerfile`
- `../../compose.dev.yml`
- `../../packages/db/package.json`
- `../../packages/db/src/schema/resume.ts`
- `../../packages/db/src/schema/auth.ts`
- `../../packages/auth/package.json`
- `../../packages/api/package.json`
- `../../packages/schema/src/resume/data.ts`
- `../../packages/pdf/package.json`
- `../../packages/ui/package.json`
- `../../packages/env/src/server.ts`
- `../../AGENTS.md`
- `requirements.md`
- `user-stories.md`
- `user-flows.md`
- `../../implementation-plan.md`
- `erd-mvp.md`
- `brand-and-style.md`
