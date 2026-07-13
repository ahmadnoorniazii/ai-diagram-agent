// Cloudflare Agents worker entrypoint. AIChatAgent gives each session a
// durable object instance that persists chat history (`this.messages`) and
// exposes it over the agents/react client hook used in App.tsx; the actual
// model call and tool wiring live in agent-core.ts so the eval harness can
// reuse them without a Worker runtime.

import { AIChatAgent } from "@cloudflare/ai-chat";
import { convertToModelMessages } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { streamAgent } from "./agent-core";

// Worker bindings/secrets this agent needs, layered on top of the platform
// defaults from Cloudflare.Env.
interface Env extends Cloudflare.Env {
  OPENAI_API_KEY: string;
  TAVILY_API_KEY: string;
}

export class DesignAgent extends AIChatAgent<Env> {
  // Fires whenever the client sends a new chat message. Rebuilds the model
  // client per call (cheap) and hands the full conversation to the shared
  // streaming agent, then pipes its stream straight back as the HTTP response.
  async onChatMessage() {
    const openai = createOpenAI({ apiKey: this.env.OPENAI_API_KEY });
    const model = openai("gpt-5.4");
    // AIChatAgent stores UI-shaped messages; the AI SDK's model calls need
    // the plain ModelMessage shape, hence the conversion.
    const messages = await convertToModelMessages(this.messages);

    const result = streamAgent({
      model,
      messages,
      env: { TAVILY_API_KEY: this.env.TAVILY_API_KEY },
    });

    return result.toUIMessageStreamResponse();
  }
}
