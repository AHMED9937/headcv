# Third-Party Notices

This project is a fork of [`amruthpillai/reactive-resume`](https://github.com/amruthpillai/reactive-resume), forked at tag `v5.1.6`.

## Upstream project

`amruthpillai/reactive-resume` is licensed under the MIT License. The full upstream license text is preserved at the repository root in `LICENSE`. Copyright and license notices from the upstream project are retained.

## AI/MCP features removed for v1

This fork intentionally removes all AI provider integrations and Model Context Protocol (MCP) features present in upstream v5.1.6, including:

- `@reactive-resume/ai` and `@reactive-resume/mcp` (internal workspace packages)
- `@ai-sdk/anthropic`, `@ai-sdk/google`, `@ai-sdk/openai`, `@ai-sdk/openai-compatible`, `@ai-sdk/react`
- `ai` (Vercel AI SDK)
- `ollama-ai-provider-v2`
- `@modelcontextprotocol/sdk`
- `ioredis` (only used by the removed AI agent streaming feature)

The original code for these features is preserved, unmodified, in the `archive/upstream-ai-mcp-v5.1.6` branch of this repository for potential reuse after MVP. See `ARCHIVE.md` on that branch for restoration instructions.

## Dependency license summary

License data was generated with `pnpm licenses list --json` against the full dependency tree (`.tmp-licenses.json`, not committed). All resolved licenses are OSI-approved permissive licenses compatible with a closed-source/commercial product:

| License | Approx. package count |
|---|---|
| MIT | 888 |
| Apache-2.0 | 60 |
| ISC | 43 |
| BSD-3-Clause | 14 |
| BSD-2-Clause | 11 |
| BlueOak-1.0.0 | 7 |
| MPL-2.0 | 2 |
| MIT OR Apache-2.0 | 2 |
| OFL-1.1 (font: `@fontsource-variable/ibm-plex-sans`) | 1 |
| Apache-2.0 AND LGPL-3.0-or-later (`@img/sharp-win32-x64`) | 1 |
| CC-BY-4.0 (`caniuse-lite` data) | 1 |
| (MPL-2.0 OR Apache-2.0) (`dompurify`) | 1 |
| (MIT OR GPL-3.0-or-later) (`jszip`, dual-licensed, MIT terms used) | 1 |
| (BSD-3-Clause OR GPL-2.0) (`node-forge`, dual-licensed, BSD terms used) | 1 |
| MIT-0 (`nodemailer`) | 1 |
| (MIT AND Zlib) (`pako`) | 1 |
| (MIT OR CC0-1.0) (`type-fest`) | 1 |
| MIT License (`xml-escape`) | 1 |
| Python-2.0 | 1 |
| CC0-1.0 | 1 |
| Unlicense | 1 |

No copyleft-only (GPL/AGPL-only) dependency was found; every dual-licensed package offers a permissive option (MIT/BSD/Apache-2.0) which this project uses.

## Regenerating the full license report

```sh
pnpm licenses list --json > .tmp-licenses.json
```

This file is intentionally not committed (it is large and regenerable); re-run before each release to catch newly introduced dependencies with incompatible licenses.
