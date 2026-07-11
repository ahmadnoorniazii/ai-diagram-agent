// The Diagram Agent eval. One eval definition (dataset + task + scorers)
// that we run many times as we improve the agent. Every run becomes a new
// experiment in Braintrust, automatically tagged with the current git
// branch, commit, dirty flag, and commit message — no manual naming needed.
// You compare experiments in the dashboard via the auto collected metadata.
//
// Run with:
//   npm run eval

// Node/env plumbing to read the dataset file and load OPENAI_API_KEY.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";
import { Eval } from "braintrust";
import { createOpenAI } from "@ai-sdk/openai";

// Reuse the exact same agent code path the worker uses, so the eval measures
// the real thing rather than a reimplementation.
import { runAgent } from "../src/agent-core";
import { buildMessages, type GoldenTestCase } from "./buildMessages";
import { schemaScorer, type AgentOutput } from "./scorers/schema";
import { structureScorer } from "./scorers/structure";
import { preservationScorer } from "./scorers/preservation";
import { labelKeywordScorer } from "./scorers/labelKeyword";

// Local secrets (OPENAI_API_KEY) live in .dev.vars, same file wrangler uses.
config({ path: ".dev.vars" });

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Golden dataset: hand-written prompts + expected characteristics, checked
// into evals/datasets/golden.json and grown over time as we find gaps.
const testCases: GoldenTestCase[] = JSON.parse(
  readFileSync(join("evals", "datasets", "golden.json"), "utf-8")
);

Eval<GoldenTestCase, AgentOutput, GoldenTestCase>("Diagram Agent", {
  // Map each golden case to Braintrust's {input, expected, metadata} shape.
  // input and expected are the same object here since the scorers need
  // fields (seed, preservedIds, etc.) that live on the test case itself.
  data: () =>
    testCases.map((tc) => ({
      input: tc,
      expected: tc,
      metadata: {
        id: tc.id,
        difficulty: tc.difficulty,
        category: tc.category,
      },
    })),

  // The unit under test: build the fake message history for this case, run
  // it through the real agent, and hand back only what the scorers need.
  task: async (testCase) => {
    const result = await runAgent({
      model: openai("gpt-5.4-mini"),
      messages: buildMessages(testCase),
      canvasState: testCase.seed?.elements ?? [],
    });
    return { text: result.text, elements: result.elements };
  },

  // Deterministic, code-based scorers only — no LLM-as-judge here.
  scores: [schemaScorer, structureScorer, preservationScorer, labelKeywordScorer],
});
