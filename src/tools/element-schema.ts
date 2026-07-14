import { z } from "zod";

// Element schema for the agent's canvas tools.
//
// IMPORTANT: this schema describes the INPUT format that
// `convertToExcalidrawElements` (the Excalidraw skeleton helper) consumes,
// NOT the runtime element shape that lives on the canvas afterwards. The
// helper has its own vocabulary:
//
//   - To label a shape (rectangle, ellipse, diamond), set `label: { text }`
//     directly on the shape. Do NOT create a separate text element. The
//     helper will produce the child text element and wire up `containerId`
//     and `boundElements` for you.
//   - To bind an arrow between two shapes, set `start: { id }` and
//     `end: { id }` on the arrow. Do NOT use `startBinding` / `endBinding`,
//     those are runtime field names that the helper does not consume.
//
// Encoding the labeling and binding rules in the schema (rather than in
// prose in the system prompt) means the model literally cannot construct an
// element that drops its label or floats its arrow. The structural
// invariants are enforced by the type system.
//
// Nullable rather than optional throughout so OpenAI strict mode stays on.
// Null means "leave at the Excalidraw default" and is stripped client side
// before being handed to the helper.

// Shared style fields spread into every element schema below. Kept as a
// plain object (not a z.object) so it can be spread inline rather than
// nested under a `styling` key on the wire format.
const styling = {
  strokeColor: z.string().nullable().describe("Hex stroke color. Null for default '#1e1e1e'."),
  backgroundColor: z.string().nullable().describe("Hex fill color. Null for transparent."),
  fillStyle: z.enum(["solid", "hachure", "cross-hatch"]).nullable(),
  strokeWidth: z.number().nullable(),
  roughness: z.number().nullable().describe("0 for clean, 1 for sketchy. Null for default."),
  opacity: z.number().nullable(),
};

// Shape/arrow label payload. See the file header — this is the ONLY
// supported way to attach text to a shape or arrow.
const labelSchema = z
  .object({
    text: z.string().describe("The label text rendered inside the shape or on the arrow."),
    fontSize: z.number().nullable(),
    textAlign: z.enum(["left", "center", "right"]).nullable(),
  })
  .describe(
    "Label rendered inside this shape (or on this arrow). Excalidraw centers the text inside the container automatically and creates the bound text element for you. This is the ONLY way to put text inside a box. Null for unlabeled shapes."
  );

// Fields common to every element type (position, size, id). Spread into
// each concrete schema below alongside its type literal and type-specific
// fields.
const baseFields = {
  id: z
    .string()
    .describe(
      "Unique, concise, meaningful id like 'rect_login' or 'arrow_user_api'. Other elements reference this id, so it must be unique within the canvas and stable across calls."
    ),
  x: z.number().describe("X position in pixels"),
  y: z.number().describe("Y position in pixels"),
  width: z.number().describe("Width in pixels. At least 20."),
  height: z.number().describe("Height in pixels. At least 20."),
};

// Container shapes share an identical structure, only the type literal
// differs. Generating them from a helper would be DRYer but obscures the
// schema for readers of the file, so we spell each one out.

const rectangleSchema = z.object({
  type: z.literal("rectangle"),
  ...baseFields,
  label: labelSchema.nullable(),
  ...styling,
});

const ellipseSchema = z.object({
  type: z.literal("ellipse"),
  ...baseFields,
  label: labelSchema.nullable(),
  ...styling,
});

const diamondSchema = z.object({
  type: z.literal("diamond"),
  ...baseFields,
  label: labelSchema.nullable(),
  ...styling,
});

// Arrow/line endpoint binding, referencing another element's id.
const endpointSchema = z
  .object({
    id: z
      .string()
      .describe(
        "Id of the shape this end of the arrow attaches to. The shape must exist in the same call or already on the canvas."
      ),
  })
  .describe("Arrow endpoint binding. Set both start AND end for any arrow that connects two shapes.");

// Arrows carry optional start/end bindings plus an optional label rendered
// along the path (e.g. "yes"/"no" branches on a decision diamond).
const arrowSchema = z.object({
  type: z.literal("arrow"),
  ...baseFields,
  start: endpointSchema.nullable(),
  end: endpointSchema.nullable(),
  label: labelSchema
    .nullable()
    .describe(
      "Optional label rendered on the arrow itself, e.g. 'yes', 'no', '1. login'. Null for unlabeled arrows."
    ),
  ...styling,
});

// Same shape as arrowSchema minus the label — lines are unlabeled
// connectors/dividers.
const lineSchema = z.object({
  type: z.literal("line"),
  ...baseFields,
  start: endpointSchema.nullable(),
  end: endpointSchema.nullable(),
  ...styling,
});

// Standalone text. Use this ONLY for floating annotations that are not
// attached to a shape. To label a shape, set `label` on the shape itself.
const textSchema = z.object({
  type: z.literal("text"),
  ...baseFields,
  text: z.string().describe("The text content. Required."),
  fontSize: z.number().nullable(),
  textAlign: z.enum(["left", "center", "right"]).nullable(),
  ...styling,
});

// NOTE: we use z.union, not z.discriminatedUnion. They look interchangeable
// but compile to different JSON Schema: discriminatedUnion produces `oneOf`,
// which OpenAI's strict mode rejects with "'oneOf' is not permitted."
// z.union produces `anyOf`, which strict mode accepts. The model still
// picks the right branch by the `type` literal either way.
export const elementSchema = z.union([
  rectangleSchema,
  ellipseSchema,
  diamondSchema,
  arrowSchema,
  lineSchema,
  textSchema,
]);

// Inferred TS type for the validated input shape, used wherever tool
// handlers need to reference an element's input type by name.
export type ElementInput = z.infer<typeof elementSchema>;
