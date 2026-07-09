// Durable Object agent that answers chat messages by streaming an LLM
// response, letting the model call the diagram tools to produce or edit
// Excalidraw elements on the connected client's canvas.

import { AIChatAgent } from "@cloudflare/ai-chat";
import {
  streamText,
  convertToModelMessages,
  stepCountIs,
} from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { tools } from "./tools";

interface Env {
  OPENAI_API_KEY: string;
}

// Instructions given to the model on every turn: establishes the diagram
// domain, the id/positioning/styling conventions elements should follow,
// and when to reach for the modify tool instead of generating fresh.
const SYSTEM_PROMPT = `You are a diagram design assistant. You help users create and modify diagrams on an Excalidraw canvas.

When the user asks you to create a diagram, use the generateDiagram tool to produce Excalidraw elements.

Guidelines for generating diagrams:
- Give each element a unique id (e.g. "rect-1", "text-1", "arrow-1")
- Position elements with reasonable spacing (at least 20px gap between elements)
- Use rectangles for boxes/containers, ellipses for circles, diamonds for decision points
- Add text labels inside or near shapes
- Connect related elements with arrows
- Use a clean layout: left to right or top to bottom
- Default to strokeColor "#1e1e1e" and backgroundColor "transparent"
- Set roughness to 1 for a hand-drawn look

When the user asks to modify an element, use the modifyDiagram tool with the element's id.`;

// AIChatAgent gives us `this.messages` (persisted conversation state) and
// wires onChatMessage into the WebSocket/HTTP chat protocol automatically.
export class DesignAgent extends AIChatAgent<Env> {
  async onChatMessage() {
    const openai = createOpenAI({ apiKey: this.env.OPENAI_API_KEY });

    // stopWhen caps the agent loop at 5 steps so a tool-call chain (e.g.
    // generate then self-correct) can't run away; response streams back
    // to the client as UI message chunks as soon as tokens are ready.
    const result = streamText({
      model: openai("gpt-5.4-mini"),
      system: SYSTEM_PROMPT,
      messages: await convertToModelMessages(this.messages),
      tools,
      stopWhen: stepCountIs(5),
    });

    return result.toUIMessageStreamResponse();
  }
}
