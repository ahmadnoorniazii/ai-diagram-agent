// Test cases live in evals/datasets/golden.json. Each one describes a single
// prompt the agent should handle, plus what a good response looks like.

// Closed sets of labels used to slice eval results in the summary output.
export type Difficulty = "simple" | "medium" | "hard" | "edge";
export type Category = "create" | "modify" | "domain" | "edge";

// The dataset has more fields than this (seed, expectedKeywords, preservedIds)
// but this harness only needs id, input, and the bookkeeping fields.
// We'll use the rest later when we add real scorers.
export interface TestCase {
  id: string;
  input: string;
  expectedCharacteristics: string[];
  difficulty: Difficulty;
  category: Category;
}

// What we collect from running a test case through the agent.
export interface EvalResult {
  testCaseId: string;
  input: string;
  response: string;
  elements: unknown[];
  durationMs: number;
  error?: string;
}

// Same as EvalResult but with a manual score and notes the human added.
export interface ScoredResult extends EvalResult {
  score: 1 | 2 | 3 | 4 | 5;
  notes?: string;
}
