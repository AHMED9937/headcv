# Local Setup

This is the HeadCV fork of `AHMED9937/headcv` (baseline branch `chore/upstream-headcv-v5.1.6`). AI/MCP features have been restored on `feat/restore-ai-mcp`. See `AGENTS.md` for the codebase map and conventions.

## Prerequisites

- Node.js 24 (`corepack enable` manages pnpm automatically)
- Docker (for PostgreSQL, and optionally SeaweedFS for S3-compatible storage)
- [`dotenvx`](https://dotenvx.com/) CLI  `drizzle-kit` (used by `pnpm db:migrate` / `pnpm db:generate`) reads `DATABASE_URL` from `process.env` directly and does not auto-load `.env` files

## First-time setup

```sh
corepack enable
pnpm install

cp .env.example .env.local
# Edit .env.local and set at minimum:
#   APP_URL, DATABASE_URL, AUTH_SECRET

docker compose -f compose.dev.yml up -d postgres
# Optional (adds S3-compatible storage instead of local filesystem):
# docker compose -f compose.dev.yml up -d postgres seaweedfs seaweedfs_create_bucket

dotenvx run -f .env.local -- pnpm db:migrate

dotenvx run -f .env.local -- pnpm dev
```

Then open `http://localhost:3000` and verify `http://localhost:3001/api/health` returns `200`.

## Required environment variables

- `APP_URL`  default `http://localhost:3000`
- `DATABASE_URL`  default `postgresql://postgres:postgres@localhost:5432/postgres`
- `AUTH_SECRET`  any non-empty string (generate with `openssl rand -hex 32`)

## Optional environment variable categories

See `.env.example` for the full list:

- Application: `PORT`, `SERVER_PORT`
- Social auth: `GOOGLE_*`, `GITHUB_*`, `LINKEDIN_*`
- Custom OAuth: `OAUTH_*`
- Email (SMTP): `SMTP_*`  without SMTP config, emails are logged to the console in dev
- Storage: `S3_*`, `LOCAL_STORAGE_PATH`
- Feature flags: `FLAG_DISABLE_SIGNUPS`, `FLAG_DISABLE_EMAIL_AUTH`, `FLAG_DISABLE_IMAGE_PROCESSING`, `FLAG_ALLOW_UNSAFE_OAUTH_REDIRECT_URI`
- Tooling: `GOOGLE_CLOUD_API_KEY`, `CROWDIN_*`
- Local/remote LLM (dev-only): `LLM_BASE_URL`, `LLM_MODEL`, `LLM_API_KEY`, `LLM_TIMEOUT`, `LLM_MAX_TOKENS`, `LLM_TEMPERATURE`

AI chat requires `REDIS_URL` and `ENCRYPTION_SECRET` in `.env.local`, plus an enabled AI provider. Keep the encryption secret stable so saved provider credentials remain readable. `FLAG_ALLOW_UNSAFE_AI_BASE_URL` is only needed for explicitly trusted private provider endpoints.

For host-based development, use `REDIS_URL=redis://localhost:6379`. If the existing `redis` container is stopped:

```sh
docker update --restart unless-stopped redis
docker start redis
docker exec redis redis-cli ping
```

The last command must return `PONG`. If no Redis container exists, create one with `docker run -d --name redis --restart unless-stopped -p 127.0.0.1:6379:6379 redis:7-alpine`. Do not start a second container on the same port. Docker itself must be running. For an app running inside Docker, use a Redis address reachable from that container, not `localhost`.

A successful AI provider test does not verify Redis. If chat reports that its streaming service cannot connect, verify Redis before retrying. The chat checks the connection before saving a new message or starting generation. Existing saved conversations remain in PostgreSQL.

> New environment variables must be added to `packages/env/src/server.ts` **and** the `globalEnv` array in `turbo.json`, or Turborepo's strict env mode will filter them out at runtime.

## Common commands

| Task | Command |
|------|---------|
| Install deps | `pnpm install` |
| Start Postgres only | `docker compose -f compose.dev.yml up -d postgres` |
| Start Postgres + SeaweedFS | `docker compose -f compose.dev.yml up -d postgres seaweedfs seaweedfs_create_bucket` |
| Generate migrations | `dotenvx run -f .env.local -- pnpm db:generate` |
| Run migrations | `dotenvx run -f .env.local -- pnpm db:migrate` |
| Dev server (web + server) | `dotenvx run -f .env.local -- pnpm dev` |
| Web dev server only | `dotenvx run -f .env.local -- pnpm dev:web` |
| Lint/format | `pnpm check` (Biome; write-capable) |
| Boundary check | `pnpm exec turbo boundaries` |
| Tests | `pnpm test` |
| Build | `pnpm build` |
| Typecheck | `pnpm typecheck` |

Focused checks (faster than repo-wide commands):

```sh
pnpm --filter web typecheck
pnpm --filter @headcv/pdf test
pnpm --filter @headcv/api test
pnpm exec turbo boundaries
```

## Windows notes

- `pnpm build` at the repo root now works under PowerShell. The `apps/web` `build` script was changed from `rm -rf dist && vite build` (POSIX-only) to `vite build --emptyOutDir`, which is cross-platform and produces the same clean `dist/` output.
- `corepack enable` may fail with an `EPERM` error on `C:\Program Files\nodejs\pnpx` if the shell lacks admin rights. This does not block `pnpm install`/`pnpm <script>` if a compatible pnpm (`11.3.0`, matching `packageManager` in `package.json`) is already installed and on `PATH`.
