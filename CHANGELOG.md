# Changelog

## v0.1.0 — 2026-05-27

- Initial release: GitHub Action wrapping `otel-genai-fleet-summary`.
- Inputs: `traces-dir` (required), `allowed-models` (comma-separated whitelist), `error-rate-threshold` (0..1), `comment-on-pr` (auto/true/false), `fail-on-high` (default true), `github-token`.
- Outputs: `total-files`, `total-spans`, `high-findings`, `unique-models`.
- Vendored 7-code finding logic — same severity tiers as the standalone library.
- Posts per-PR Markdown comment when run on `pull_request` events with a valid token.
- Fails the run (exit 1) on any high-severity finding by default.
- Composite Node 20 action with `dist/index.js` committed for SHA/tag pinning.
- 4-trace fixture corpus from the standalone library.
- **Completes the fleet-summary Action quintet** across all 5 governance surfaces (A2A / MCP / prompts / evidence / OTel).
- Node 20/22 CI (lint, typecheck, coverage, build, `npm audit`), AGPL-3.0-or-later, Dependabot.
