// Cloudflare Worker entry point for the live chat experience: a Durable
// Object-backed chat agent that streams responses back to the client.
// The actual model/tool/prompt logic all lives in agent-core so this file
// stays a thin adapter between the Cloudflare runtime and shared agent code.

import { AIChatAgent } from "@cloudflare/ai-chat";
import { convertToModelMessages } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { streamAgent } from "./agent-core";

// Worker bindings/secrets, layered on top of the Cloudflare defaults.
interface Env extends Cloudflare.Env {
  OPENAI_API_KEY: string;
}

// One Durable Object instance per chat session; AIChatAgent persists
// message history for us and hands it back via this.messages.
export class DesignAgent extends AIChatAgent<Env> {
  // Invoked on every new chat message. No seed canvasState is passed here
  // since the browser owns the real canvas mutation client-side.
  async onChatMessage() {
    const openai = createOpenAI({ apiKey: this.env.OPENAI_API_KEY });

    const result = streamAgent({
      model: openai("gpt-5.4-mini"),
      messages: await convertToModelMessages(this.messages),
    });

    // Stream tokens/tool calls back to the client as they arrive.
    return result.toUIMessageStreamResponse();
  }
}
