import { tool } from "ai";
import { z } from "zod";
import { elementSchema } from "./element-schema";

// Client side tool: no execute. The browser fulfills it via onToolCall in
// App.tsx, which appends the new elements to the live Excalidraw scene and
// returns the result back to the agent.

// Tool definition consumed by the agent SDK. The description below is sent
// verbatim to the model as part of the tool spec, so it doubles as the
// primary usage documentation the model sees (labeling shapes, binding
// arrows, etc).
export const addElements = tool({
  description: `Add new elements to the canvas. Use this for creating diagrams or adding to an existing one. Each element needs an id, type, position, and size.

To label a shape, set the shape's \`label\` field. Excalidraw centers the text inside the box automatically. Do NOT create a separate text element to label a shape. Standalone text elements are for floating annotations only.

To connect two shapes with an arrow, set \`start: { id: ... }\` and \`end: { id: ... }\` on the arrow. The shapes must exist in the same call or already be on the canvas.

Example: addElements({ elements: [
  { type: "rectangle", id: "rect_start", x: 100, y: 100, width: 200, height: 80, label: { text: "Start" } },
  { type: "rectangle", id: "rect_end",   x: 380, y: 100, width: 200, height: 80, label: { text: "End" } },
  { type: "arrow",     id: "arrow_start_end", x: 300, y: 140, width: 80, height: 0, start: { id: "rect_start" }, end: { id: "rect_end" } }
]})`,
  // Validated against elementSchema (the skeleton-shaped input format) —
  // see element-schema.ts for the full field-level contract.
  inputSchema: z.object({
    elements: z.array(elementSchema).describe("Array of new elements to add to the canvas"),
  }),
  // Strict mode constrains OpenAI to schemas that validate exactly. Combined
  // with nullable (not optional) fields, the model can never produce a
  // malformed call. Required for the canvas tools.
  strict: true,
});
