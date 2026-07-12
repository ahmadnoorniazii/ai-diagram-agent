// Serializes the current Excalidraw canvas into a TOON encoded summary
// the agent can read in its system prompt. TOON is far cheaper in tokens
// than JSON for tabular data and models handle it well.

import { encode } from "@toon-format/toon";
import type { ExcalidrawElement } from "../schemas";

export function serializeCanvasState(elements: ExcalidrawElement[]): string {
  // Empty canvas gets a short literal instead of an empty TOON table, so the
  // prompt reads naturally rather than showing a zero-row table.
  if (!elements.length) return "canvas: empty";

  // Flatten each element down to just the fields the model needs to reason
  // about layout and bindings: position/size, its text label (if it's a text
  // element), and arrow endpoints (if it's an arrow). Everything else
  // (styling, seed, version, etc.) is noise for this purpose.
  const rows = elements.map((el) => ({
    id: el.id,
    type: el.type,
    x: Math.round(el.x),
    y: Math.round(el.y),
    w: Math.round(el.width),
    h: Math.round(el.height),
    label: el.type === "text" ? el.text : "",
    from: el.type === "arrow" ? el.startBinding?.elementId ?? "" : "",
    to: el.type === "arrow" ? el.endBinding?.elementId ?? "" : "",
  }));

  // TOON's tabular encoding is much more token-efficient than JSON for this
  // kind of uniform row data, which matters since this gets re-sent on every turn.
  return encode(
    { elements: rows },
    { indent: 2, delimiter: ",", keyFolding: "off", flattenDepth: Infinity }
  );
}
