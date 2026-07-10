// Cloudflare Agents SDK entry point for the diagramming assistant. This class
// is instantiated as a Durable Object per session (one per browser tab, keyed
// by the sessionId App.tsx generates) and handles the actual LLM turn.

import { AIChatAgent } from "@cloudflare/ai-chat";
import {
  streamText,
  convertToModelMessages,
  stepCountIs,
} from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { tools } from "./tools";
import { SYSTEM_PROMPT } from "./system-prompt";

// Worker bindings this agent needs, layered on top of the generated
// Cloudflare.Env type (wrangler types) for the OpenAI key from .dev.vars/secrets.
interface Env extends Cloudflare.Env {
  OPENAI_API_KEY: string;
}

// AIChatAgent gives us message persistence + the chat wire protocol for free;
// we only need to fill in what a single incoming message does.
export class DesignAgent extends AIChatAgent<Env> {
  // Called by the SDK whenever the client sends a new chat message. Runs the
  // model with the diagram tools available and streams the response back
  // over the same connection useAgentChat is listening on.
  async onChatMessage() {
    const openai = createOpenAI({ apiKey: this.env.OPENAI_API_KEY });

    const result = streamText({
      model: openai("gpt-5.4-mini"),
      system: SYSTEM_PROMPT,
      // this.messages is the full persisted history for this agent instance;
      // convertToModelMessages adapts the UI message shape to what the model expects.
      messages: await convertToModelMessages(this.messages),
      tools,
      // Cap tool-call loops at 5 steps so a confused model can't spin forever.
      stopWhen: stepCountIs(5),
    });

    return result.toUIMessageStreamResponse();
  }
}
