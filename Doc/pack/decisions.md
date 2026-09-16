# Decision: CV SaaS Architecture & Stack

| Field | Value |
|---|---|
| Decision ID | DEC-001 |
| Topic | Best-practice architecture and tech stack for the CV SaaS MVP |
| Status | Approved |
| Date | 2026-08-17 |
| Owner | senior-technical-researcher |

## Decision

**Use Option C: fork/adapt `AHMED9937/headcv` v5.1.6 as the MVP foundation.**

## Options compared

| | A. Nx + Next.js + NestJS | B. Nx + Next.js (no NestJS) | **C. HeadCV fork** |
|---|---|---|---|
| Lock-in | Medium | Low-Medium | **Medium** |
| Pricing | Higher (two hosts) | Lower | **Lowest** |
| Ops overhead | High | Low | **Lowest** |
| Security | Strong, complex auth boundary | Strong | **Strong baseline** |
| Fit with listed stack | Perfect | Good | Different stack, but fits requirements |
| Time to MVP | Slowest | Medium | **Fastest** |

## Why Option C

- Matches the existing `../../implementation-plan.md`.
- Already provides guest-first flow, live preview, RTL, PDF export, templates, dashboard.
- Lowest risk: 40.6k stars, MIT license, proven SaaS.
- Proposed stack (Nx/Next/Nest/Prisma/Neon/Clerk) is deferred to v2 after validation.

## Scaling notes

Main bottlenecks are PDF export, DB connections, and file storage  not the framework.

| Bottleneck | Mitigation |
|---|---|
| PDF export CPU | Async worker queue + cache by content hash |
| DB connections | PgBouncer now; Neon later |
| Query latency | Indexes, then read replicas |
| Auth sessions | Stateless JWT or Redis if needed |
| File storage | S3-compatible store (MinIO local, S3/R2 prod) |

## Scaling roadmap

1. **Launch:** Docker Compose + PostgreSQL + MinIO.
2. **1k–10k users:** PgBouncer, async PDF queue, S3/R2.
3. **10k+ users:** Neon, read replicas, dedicated PDF workers.
4. **Post-PMF:** Re-evaluate Nx/Next/Prisma/Neon/Clerk migration.

## Sources

- https://github.com/AHMED9937/headcv
- https://nextjs.org/docs/app
- https://clerk.com/pricing, https://clerk.com/docs
- https://neon.tech/docs
- https://docs.nestjs.com
