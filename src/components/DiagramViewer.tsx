// Standalone viewer used for human scoring during evals. Paste in element
// JSON copied from Braintrust (or anywhere else) and see the actual diagram
// instead of squinting at coordinates.
//
// Accepts any of:
//   - a raw element array:        [{ id, type, x, y, ... }, ...]
//   - a wrapper object:           { elements: [...] }
//   - a Braintrust task output:   { text, elements: [...] }
//
// Reachable at /#viewer or via the "viewer" button in the main app corner.

import { useState } from "react";
import {
  Excalidraw,
  convertToExcalidrawElements,
} from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

// Normalizes the three accepted pasted-JSON shapes down to a plain element
// array, or returns null if none of them match.
function extractElements(raw: unknown): unknown[] | null {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object" && "elements" in raw) {
    const els = (raw as { elements: unknown }).elements;
    if (Array.isArray(els)) return els;
  }
  return null;
}

export default function DiagramViewer() {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);

  // Parses whatever is in the textarea and paints it onto the canvas,
  // surfacing a human-readable error at each stage that can fail: bad JSON,
  // no recognizable elements array, an empty array, or a bad element shape.
  function render() {
    setError(null);
    if (!api) {
      setError("Canvas not ready");
      return;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      setError(`Invalid JSON: ${e instanceof Error ? e.message : String(e)}`);
      return;
    }
    const skeleton = extractElements(parsed);
    if (!skeleton) {
      setError("Could not find an elements array in the pasted JSON");
      return;
    }
    if (skeleton.length === 0) {
      setError("elements array is empty");
      api.updateScene({ elements: [] });
      return;
    }
    try {
      // Same skeleton-to-full-element expansion App.tsx uses when applying
      // live tool output, so pasted JSON renders identically to a live run.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const elements = convertToExcalidrawElements(skeleton as any);
      api.updateScene({ elements });
      api.scrollToContent(elements, { fitToContent: true });
    } catch (e) {
      setError(`Render failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // Left column: paste box + controls. Right column: read-only Excalidraw
  // canvas in view mode so scorers can't accidentally edit the diagram.
  return (
    <div className="viewer">
      <div className="viewer-input">
        <div className="viewer-header">
          <strong>Diagram Viewer</strong>
          <span className="viewer-hint">
            Paste element JSON from Braintrust or the eval output
          </span>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='[{ "id": "rect1", "type": "rectangle", "x": 100, "y": 100, "width": 200, "height": 80, "text": "hello" }]'
          spellCheck={false}
        />
        <div className="viewer-actions">
          <button onClick={render} type="button">
            Render
          </button>
          <button
            onClick={() => {
              setText("");
              setError(null);
              api?.updateScene({ elements: [] });
            }}
            type="button"
            className="viewer-secondary"
          >
            Clear
          </button>
          <a href="/" className="viewer-back">
            ← back to chat
          </a>
        </div>
        {error && <div className="viewer-error">{error}</div>}
      </div>
      <div className="viewer-canvas">
        <Excalidraw
          excalidrawAPI={setApi}
          initialData={{ appState: { openSidebar: null, viewModeEnabled: true } }}
        />
      </div>
    </div>
  );
}
