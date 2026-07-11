// Helpers for turning a golden test case into the ModelMessage[] history that
// gets fed to the agent. Create cases are trivial (one user turn). Modify
// cases need a fake prior conversation: the original user request, the
// agent's tool call producing seed elements, the matching tool result, the
// agent's confirmation, then the new user turn that asks for a modification.
//
// The whole point is the agent should not be able to tell the difference
// between this fake history and a real session it lived through.

// Only need the message shape the AI SDK expects; no runtime import from "ai".
import type { ModelMessage } from "ai";

// Optional fake prior turn used to simulate a canvas that already has
// elements on it before the "modify" prompt comes in.
export interface SeedData {
  userPrompt: string;
  assistantConfirmation: string;
  elements: unknown[];
}

export type Difficulty = "simple" | "medium" | "hard" | "edge";
export type Category = "create" | "modify" | "domain" | "edge";

// Shape of a single row in the golden dataset (evals/datasets/golden.json).
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

export function buildMessages(tc: GoldenTestCase): ModelMessage[] {
  // Create cases: just the single user turn, nothing to fake.
  if (!tc.seed) {
    return [{ role: "user", content: tc.input }];
  }

  // Modify cases: reconstruct a full round trip (user ask -> tool call ->
  // tool result -> assistant confirmation) so the model sees a believable
  // prior turn before the actual modify request.
  const callId = `seed_${tc.id}`;
  return [
    { role: "user", content: tc.seed.userPrompt },
    {
      role: "assistant",
      content: [
        {
          type: "tool-call",
          toolCallId: callId,
          toolName: "generateDiagram",
          input: { elements: tc.seed.elements },
        },
      ],
    },
    {
      role: "tool",
      content: [
        {
          type: "tool-result",
          toolCallId: callId,
          toolName: "generateDiagram",
          output: {
            type: "json",
            value: { elements: tc.seed.elements as never },
          },
        },
      ],
    },
    { role: "assistant", content: tc.seed.assistantConfirmation },
    { role: "user", content: tc.input },
  ];
}
