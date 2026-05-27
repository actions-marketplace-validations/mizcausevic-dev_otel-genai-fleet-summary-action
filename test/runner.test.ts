import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { run, type RunnerEnv } from "../src/runner.js";
import { summarize } from "../src/summarize.js";
import { toMarkdown, toSummary } from "../src/format.js";
import type { OtlpExport } from "../src/types.js";

const here = fileURLToPath(new URL(".", import.meta.url));
const FIXTURES = `${here}/../fixtures/traces`;

function envWithInputs(inputs: Record<string, string>): RunnerEnv {
  return {
    inputs,
    readFile: (p) => readFileSync(p, "utf8"),
    readDir: (p) => readdirSync(p),
    isFile: (p) => statSync(p).isFile(),
    write: () => undefined
  };
}

describe("runner.run", () => {
  it("exits 1 when fail-on-high set and high findings exist", async () => {
    const r = await run(envWithInputs({ traces_dir: FIXTURES, fail_on_high: "true", comment_on_pr: "false" }));
    expect(r.exitCode).toBe(1);
    expect(r.commentPosted).toBe(false);
  });

  it("exits 0 when fail-on-high is false", async () => {
    const r = await run(envWithInputs({ traces_dir: FIXTURES, fail_on_high: "false", comment_on_pr: "false" }));
    expect(r.exitCode).toBe(0);
  });

  it("rejects when traces-dir input is missing", async () => {
    await expect(run({ inputs: {} })).rejects.toThrow(/traces_dir/);
  });

  it("rejects invalid error-rate-threshold", async () => {
    await expect(run(envWithInputs({ traces_dir: FIXTURES, error_rate_threshold: "2.0" }))).rejects.toThrow(/error-rate-threshold/);
  });

  it("respects allowed-models whitelist", async () => {
    const r = await run(envWithInputs({
      traces_dir: FIXTURES,
      fail_on_high: "false",
      comment_on_pr: "false",
      allowed_models: "claude-sonnet-4,gpt-4o"
    }));
    expect(r.report.findings.some((f) => f.code === "unauthorized-model")).toBe(true);
  });

  it("posts a PR comment in pull_request context", async () => {
    const calls: Array<{ body: string }> = [];
    const env: RunnerEnv = {
      inputs: { traces_dir: FIXTURES, comment_on_pr: "auto", github_token: "ghs", fail_on_high: "false" },
      GITHUB_EVENT_NAME: "pull_request",
      GITHUB_REPOSITORY: "x/y",
      GITHUB_EVENT_PATH: `${here}/event.json`,
      readFile: (p) => (p.endsWith("event.json") ? JSON.stringify({ number: 42 }) : readFileSync(p, "utf8")),
      readDir: (p) => readdirSync(p),
      isFile: (p) => statSync(p).isFile(),
      postComment: async (args) => { calls.push({ body: args.body }); },
      write: () => undefined
    };
    const r = await run(env);
    expect(r.commentPosted).toBe(true);
    expect(calls[0].body).toContain("OTel GenAI fleet summary");
  });

  it("skips PR comment when token missing", async () => {
    const env: RunnerEnv = {
      inputs: { traces_dir: FIXTURES, comment_on_pr: "true", fail_on_high: "false" },
      GITHUB_REPOSITORY: "x/y",
      GITHUB_EVENT_PATH: "/event.json",
      readFile: (p) => (p.endsWith("event.json") ? "{}" : readFileSync(p, "utf8")),
      readDir: (p) => readdirSync(p),
      isFile: (p) => statSync(p).isFile(),
      write: () => undefined
    };
    const r = await run(env);
    expect(r.commentPosted).toBe(false);
    expect(r.reason).toBe("no github-token provided");
  });

  it("skips PR comment when GITHUB_EVENT_PATH missing", async () => {
    const env: RunnerEnv = {
      inputs: { traces_dir: FIXTURES, comment_on_pr: "true", github_token: "ghs", fail_on_high: "false" },
      GITHUB_REPOSITORY: "x/y",
      readFile: (p) => readFileSync(p, "utf8"),
      readDir: (p) => readdirSync(p),
      isFile: (p) => statSync(p).isFile(),
      write: () => undefined
    };
    const r = await run(env);
    expect(r.commentPosted).toBe(false);
    expect(r.reason).toBe("no GITHUB_EVENT_PATH");
  });

  it("skips PR comment when event has no PR number", async () => {
    const env: RunnerEnv = {
      inputs: { traces_dir: FIXTURES, comment_on_pr: "true", github_token: "ghs", fail_on_high: "false" },
      GITHUB_REPOSITORY: "x/y",
      GITHUB_EVENT_PATH: "/event.json",
      readFile: (p) => (p.endsWith("event.json") ? "{}" : readFileSync(p, "utf8")),
      readDir: (p) => readdirSync(p),
      isFile: (p) => statSync(p).isFile(),
      write: () => undefined
    };
    const r = await run(env);
    expect(r.commentPosted).toBe(false);
    expect(r.reason).toBe("no PR number in event payload");
  });

  it("does not comment on non-PR events with comment_on_pr=auto", async () => {
    const env: RunnerEnv = {
      inputs: { traces_dir: FIXTURES, comment_on_pr: "auto", github_token: "ghs", fail_on_high: "false" },
      GITHUB_EVENT_NAME: "push",
      readFile: (p) => readFileSync(p, "utf8"),
      readDir: (p) => readdirSync(p),
      isFile: (p) => statSync(p).isFile(),
      write: () => undefined
    };
    const r = await run(env);
    expect(r.commentPosted).toBe(false);
  });
});

describe("vendored library unit coverage", () => {
  const files = readdirSync(FIXTURES).filter((e) => e.endsWith(".json")).map((e) => ({
    path: e,
    doc: JSON.parse(readFileSync(`${FIXTURES}/${e}`, "utf8")) as OtlpExport
  }));

  it("summarize returns counts + findings", () => {
    const r = summarize(files, { now: "2026-05-27T00:00:00Z" });
    expect(r.totalSpans).toBe(6);
    expect(r.findings.length).toBeGreaterThan(0);
  });

  it("toMarkdown + toSummary render", () => {
    const r = summarize(files, { now: "2026-05-27T00:00:00Z" });
    expect(toMarkdown(r)).toContain("OTel GenAI fleet summary");
    expect(toSummary(r)).toContain("spans");
  });
});
