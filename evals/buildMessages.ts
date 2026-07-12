// Helpers for turning a golden test case into the ModelMessage[] history that
// gets fed to the agent. Create cases are trivial (one user turn). Modify
// cases need a fake prior conversation: the original user request, the
// agent's tool call producing seed elements, the matching tool result, the
// agent's confirmation, then the new user turn that asks for a modification.
//
// The whole point is the agent should not be able to tell the difference
// between this fake history and a real session it lived through.

import type { ModelMessage } from "ai";

// Shape of the "prior state" a modify-style golden case seeds the canvas
// with. Currently unused by buildMessages itself (canvasState carries the
// seed now) but kept as the type golden.json's `seed` field is checked against.
export interface SeedData {
  userPrompt: string;
  assistantConfirmation: string;
  elements: unknown[];
}

export type Difficulty = "simple" | "medium" | "hard" | "edge";
export type Category = "create" | "modify" | "domain" | "edge";

// One row of the golden dataset: an input prompt plus the criteria a human
// (or future auto-scorer) checks the agent's output against.
export interface GoldenTestCase {
  id: string;
  input: string;
  seed?: SeedData;
  expectedCharacteristics: string[];
  expectedKeywords?: string[];
  preservedIds?: string[];
  difficulty: Difficulty;
  category: Category;
}

// Always returns a single user turn. The seed elements (if any) are passed
// separately as `canvasState` to runAgent — that's how the agent learns
// what's already on the canvas. We used to mock a fake tool
// history here, but that workaround is gone now that canvas state is a
// first class arg to the agent core.
export function buildMessages(tc: GoldenTestCase): ModelMessage[] {
  return [{ role: "user", content: tc.input }];
}
