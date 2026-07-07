// Thin wrapper around the Excalidraw drawing surface. Exposes the
// Excalidraw imperative API to the parent (for programmatic diagram
// updates) and reports theme changes so the rest of the UI can follow.

import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { AppState } from "@excalidraw/excalidraw/types";
import { useRef, useCallback } from "react";

interface CanvasProps {
  onApiReady?: (api: ExcalidrawImperativeAPI) => void;
  onThemeChange?: (theme: "light" | "dark") => void;
}

export default function Canvas({ onApiReady, onThemeChange }: CanvasProps) {
  // Cached reference to the Excalidraw API, kept locally in case the
  // component needs to call it internally beyond the initial callback.
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  // Last-seen theme, used to avoid firing onThemeChange on every render.
  const lastTheme = useRef<string>("light");

  // Called once by Excalidraw when it mounts and hands over its API.
  const handleMount = useCallback(
    (api: ExcalidrawImperativeAPI) => {
      apiRef.current = api;
      onApiReady?.(api);
    },
    [onApiReady]
  );

  // Fires on every canvas change; only propagates upward when the
  // Excalidraw-managed theme actually flips between light and dark.
  const handleChange = useCallback(
    (_elements: readonly any[], appState: AppState) => {
      if (appState.theme !== lastTheme.current) {
        lastTheme.current = appState.theme;
        onThemeChange?.(appState.theme as "light" | "dark");
      }
    },
    [onThemeChange]
  );

  return (
    <div className="canvas-wrapper">
      <Excalidraw
        excalidrawAPI={handleMount}
        initialData={{ appState: { openSidebar: null } }}
        onChange={handleChange}
      />
    </div>
  );
}
