// Root application shell. Wires the Excalidraw canvas and the chat panel
// together and owns the app-wide theme so both halves of the UI stay in sync.

import { useState, useCallback } from "react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import Canvas from "./components/Canvas";
import ChatPanel from "./components/chat/ChatPanel";
import "./App.css";

export default function App() {
  // Handle to the Excalidraw imperative API, exposed once the canvas mounts.
  // Not yet consumed here; used later to drive the canvas
  // programmatically (e.g. inserting AI-generated diagram elements).
  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);
  // Tracks Excalidraw's own light/dark theme so the rest of the app
  // (chat panel styling) can mirror it via the `app.dark` class below.
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const handleApiReady = useCallback((api: ExcalidrawImperativeAPI) => {
    setExcalidrawAPI(api);
  }, []);

  return (
    <div className={`app ${theme}`}>
      <div className="canvas-container">
        <Canvas onApiReady={handleApiReady} onThemeChange={setTheme} />
      </div>
      <ChatPanel />
    </div>
  );
}
