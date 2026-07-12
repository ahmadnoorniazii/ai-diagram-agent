// Cloudflare Worker-side agent class. Handles the live chat connection from
// the browser, pulls the canvas snapshot the client attached to the latest
// message, and delegates the actual model call to agent-core's streamAgent.
import { AIChatAgent } from "@cloudflare/ai-chat";
import { convertToModelMessages, type UIMessage } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { streamAgent } from "./agent-core";
import type { ExcalidrawElement } from "./schemas";

interface Env extends Cloudflare.Env {
  OPENAI_API_KEY: string;
}

// Pull canvas state out of the user's just-arrived message. The client
// attaches it as a `data-canvas-state` part on every outgoing message via
// App.tsx — that's the only way to send extra payload alongside a message
// in the Cloudflare AI Chat protocol, since useAgentChat / AIChatAgent only
// understand UIMessage on the wire. onChatMessage runs because the user
// sent a message, so the last message in the array is always theirs.
type CanvasStatePart = {
  type: "data-canvas-state";
  data: { elements: ExcalidrawElement[] };
};

function extractCanvasState(messages: UIMessage[]): ExcalidrawElement[] {
  const last = messages.at(-1);
  const part = last?.parts.find(
    (p): p is CanvasStatePart => (p as { type?: string }).type === "data-canvas-state"
  );
  return part?.data.elements ?? [];
}

// Durable-Object-backed agent instance (one per browser session via the
// `sessionId` name used in App.tsx). AIChatAgent handles message persistence
// and the chat wire protocol; we only need to implement onChatMessage.
export class DesignAgent extends AIChatAgent<Env> {
  async onChatMessage() {
    const openai = createOpenAI({ apiKey: this.env.OPENAI_API_KEY });
    const model = openai("gpt-5.4-mini");

    // Canvas snapshot rides along on the message; conversation history comes
    // from AIChatAgent's own stored `this.messages`.
    const canvasState = extractCanvasState(this.messages);
    const messages = await convertToModelMessages(this.messages);

    const result = streamAgent({
      model,
      messages,
      canvasState,
    });

    // Streams tool calls/results back to the client as they happen so the
    // UI can apply diagram updates incrementally rather than waiting for
    // the full response.
    return result.toUIMessageStreamResponse();
  }
}
