// Eval harness. Runs every test case in evals/datasets/golden.json through
// the agent's core logic and writes raw results to evals/results/<timestamp>.json.
//
// Usage:
//   npm run eval
//
// You then open the results file and score each entry by hand. The scored
// results become the baseline that later work improves against.

// Node built-ins for reading the dataset and writing results, plus the AI SDK
// pieces for driving the model directly (no Cloudflare Worker involved here).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { generateText, stepCountIs } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

// Reuse the exact same tool definitions and system prompt the production
// agent uses, so eval results reflect what actually ships.
import { tools } from "../src/tools";
import { SYSTEM_PROMPT } from "../src/system-prompt";
import type { TestCase, EvalResult } from "./types";

// ESM has no __dirname, so derive it from import.meta.url to locate files
// relative to this script regardless of the caller's cwd.
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// Load OPENAI_API_KEY from .dev.vars (the same file wrangler uses for local dev).
function loadDevVars(): Record<string, string> {
  try {
    const content = readFileSync(join(ROOT, ".dev.vars"), "utf-8");
    const vars: Record<string, string> = {};
    // Minimal KEY=VALUE parser: skip blanks/comments, split on the first "=".
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const [key, ...rest] = trimmed.split("=");
      if (key) vars[key.trim()] = rest.join("=").trim();
    }
    return vars;
  } catch {
    // No .dev.vars file (e.g. CI) — fall back to process.env only.
    return {};
  }
}

// .dev.vars first, then real env vars override so CI/production secrets win.
const env = { ...loadDevVars(), ...process.env };
const apiKey = env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("OPENAI_API_KEY is not set in .dev.vars or environment");
  process.exit(1);
}

const openai = createOpenAI({ apiKey });

// Runs a single golden test case through the agent's model + tools and
// captures what came back, timing included. Never throws — failures are
// captured on the result so one bad case doesn't kill the whole run.
async function runTestCase(testCase: TestCase): Promise<EvalResult> {
  const start = Date.now();
  try {
    const result = await generateText({
      model: openai("gpt-5.4-mini"),
      system: SYSTEM_PROMPT,
      prompt: testCase.input,
      tools,
      stopWhen: stepCountIs(5),
    });

    // Find any generateDiagram tool calls and pull out the elements they produced.
    const elements: unknown[] = [];
    for (const step of result.steps) {
      for (const toolResult of step.toolResults ?? []) {
        if (toolResult.toolName === "generateDiagram") {
          const output = toolResult.output as { elements?: unknown[] };
          if (Array.isArray(output?.elements)) {
            elements.push(...output.elements);
          }
        }
      }
    }

    return {
      testCaseId: testCase.id,
      input: testCase.input,
      response: result.text,
      elements,
      durationMs: Date.now() - start,
    };
  } catch (error) {
    return {
      testCaseId: testCase.id,
      input: testCase.input,
      response: "",
      elements: [],
      durationMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  const datasetPath = join(ROOT, "evals/datasets/golden.json");
  const testCases: TestCase[] = JSON.parse(readFileSync(datasetPath, "utf-8"));

  console.log(`Running ${testCases.length} test cases...\n`);

  // Sequential on purpose — keeps console output ordered and avoids hammering
  // the API with concurrent requests during local eval runs.
  const results: EvalResult[] = [];
  for (const testCase of testCases) {
    process.stdout.write(`[${testCase.id}] ${testCase.difficulty.padEnd(6)} `);
    const result = await runTestCase(testCase);
    results.push(result);
    if (result.error) {
      console.log(`ERROR: ${result.error}`);
    } else {
      console.log(
        `${result.elements.length} elements, ${result.durationMs}ms`
      );
    }
  }

  // Write the raw results to a timestamped file for manual scoring.
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const resultsDir = join(ROOT, "evals/results");
  mkdirSync(resultsDir, { recursive: true });
  const outPath = join(resultsDir, `${timestamp}.json`);
  writeFileSync(outPath, JSON.stringify(results, null, 2));

  console.log(`\nResults written to ${outPath}`);
  console.log(`\nNext: open the file, review each result, and add score (1-5) and notes.`);

  // Quick summary
  console.log("\n=== Summary ===");
  console.log(`Total: ${results.length}`);
  console.log(`Errors: ${results.filter((r) => r.error).length}`);
  console.log(
    `Empty results (no elements): ${results.filter((r) => !r.error && r.elements.length === 0).length}`
  );
  const avgDuration = Math.round(
    results.reduce((sum, r) => sum + r.durationMs, 0) / results.length
  );
  console.log(`Average duration: ${avgDuration}ms`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
