# otel-genai-fleet-summary-action

[![CI](https://github.com/mizcausevic-dev/otel-genai-fleet-summary-action/actions/workflows/ci.yml/badge.svg)](https://github.com/mizcausevic-dev/otel-genai-fleet-summary-action/actions/workflows/ci.yml)
[![License: AGPL-3.0-or-later](https://img.shields.io/badge/License-AGPL--3.0--or--later-blue.svg)](LICENSE)

GitHub Action wrapping [`otel-genai-fleet-summary`](https://github.com/mizcausevic-dev/otel-genai-fleet-summary). Walks a directory of [OTel GenAI](https://opentelemetry.io/docs/specs/semconv/gen-ai/) OTLP span exports, surfaces governance findings, posts a Markdown summary as a PR comment, and fails the build on high-severity findings.

**Completes the fleet-summary Action quintet across all 5 governance surfaces:**

- [`agent-card-fleet-summary-action`](https://github.com/mizcausevic-dev/agent-card-fleet-summary-action) — A2A AgentCards
- [`mcp-tool-card-fleet-summary-action`](https://github.com/mizcausevic-dev/mcp-tool-card-fleet-summary-action) — MCP Tool Cards
- [`prompt-provenance-fleet-summary-action`](https://github.com/mizcausevic-dev/prompt-provenance-fleet-summary-action) — prompt-provenance docs
- [`evidence-bundle-fleet-summary-action`](https://github.com/mizcausevic-dev/evidence-bundle-fleet-summary-action) — evidence bundles
- **`otel-genai-fleet-summary-action`** — OTel GenAI OTLP traces

Part of the [Kinetic Gain Suite](https://suite.kineticgain.com/).

---

## Usage

```yaml
name: OTel GenAI fleet governance
on:
  pull_request:
    paths: ["traces/**"]

jobs:
  fleet-summary:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: mizcausevic-dev/otel-genai-fleet-summary-action@v0.1-shipped
        with:
          traces-dir: traces/
          allowed-models: claude-sonnet-4,gpt-4o,claude-opus-4
          error-rate-threshold: "0.05"
          fail-on-high: true
```

## Inputs

| input                    | required | default       | description |
|---|---|---|---|
| `traces-dir`             | ✓        | —             | Directory containing `*.json` OTLP exports. |
| `allowed-models`         |          | —             | Comma-separated whitelist of approved model identifiers. |
| `error-rate-threshold`   |          | `0.05`        | Fraction of errored spans above which `high-error-rate` fires per file. |
| `comment-on-pr`          |          | `auto`        | `auto` posts only on `pull_request` events. |
| `fail-on-high`           |          | `true`        | Fail the run on any high-severity finding. |
| `github-token`           |          | `${{ github.token }}` | Token used to post the PR comment. |

## Outputs

| output           | description |
|---|---|
| `total-files`    | Number of OTLP files analyzed. |
| `total-spans`    | Total GenAI spans across the fleet. |
| `high-findings`  | Count of high-severity findings. |
| `unique-models`  | Number of distinct models in use. |

## What it flags

See [`otel-genai-fleet-summary`](https://github.com/mizcausevic-dev/otel-genai-fleet-summary) for the full 7-code finding list. **High-severity codes that trip the gate:** `missing-model-attribute`, `unauthorized-model`, `high-error-rate`.

## Composes with

- [**`otel-genai-fleet-summary`**](https://github.com/mizcausevic-dev/otel-genai-fleet-summary) — the library this wraps.
- [**`llm-cost-rollup-action`**](https://github.com/mizcausevic-dev/llm-cost-rollup-action) — companion FinOps gate.
- Sibling fleet-summary actions: [`agent-card`](https://github.com/mizcausevic-dev/agent-card-fleet-summary-action) · [`mcp-tool-card`](https://github.com/mizcausevic-dev/mcp-tool-card-fleet-summary-action) · [`prompt-provenance`](https://github.com/mizcausevic-dev/prompt-provenance-fleet-summary-action) · [`evidence-bundle`](https://github.com/mizcausevic-dev/evidence-bundle-fleet-summary-action).

## License

[AGPL-3.0-or-later](LICENSE)
