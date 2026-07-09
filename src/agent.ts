// Cloudflare Durable Object agent that backs the chat panel. Streams
// responses from an OpenAI model and exposes the diagram tools it can
// call to drive the Excalidraw canvas on the client.

// Base class that wires a Durable Object up to the chat message protocol
// the frontend's useAgentChat hook expects.
import { AIChatAgent } from "@cloudflare/ai-chat";
// Vercel AI SDK: streaming text generation, UI<->model message conversion,
// and a stop condition so multi-step tool use doesn't run forever.
import {
  streamText,
  convertToModelMessages,
  stepCountIs,
} from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { tools } from "./tools";

// Worker env bindings, extended with the OpenAI key used to talk to the model.
interface Env extends Cloudflare.Env {
  OPENAI_API_KEY: string;
}

// Instructs the model on the two available tools and the conventions
// (ids, spacing, colors, roughness) it should follow when emitting
// Excalidraw elements so the generated diagrams look consistent.
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

// Durable Object entry point: one instance per chat session (see
// sessionId in App.tsx). AIChatAgent persists this.messages across turns.
export class DesignAgent extends AIChatAgent<Env> {
  // Called by the base class whenever the client sends a new chat message.
  async onChatMessage() {
    const openai = createOpenAI({ apiKey: this.env.OPENAI_API_KEY });

    // Stream the model's reply, letting it call the diagram tools mid-stream.
    // stepCountIs(5) caps tool-call/response round trips so a confused model
    // can't loop indefinitely on one request.
    const result = streamText({
      model: openai("gpt-5.4-mini"),
      system: SYSTEM_PROMPT,
      messages: await convertToModelMessages(this.messages),
      tools,
      stopWhen: stepCountIs(5),
    });

    // Adapts the AI SDK stream into the response shape useAgentChat expects.
    return result.toUIMessageStreamResponse();
  }
}
