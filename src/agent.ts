// Worker entry point for the live chat experience. This is the thin
// Cloudflare Agents SDK wrapper that wires request-scoped env (API keys,
// Upstash credentials) and the incoming chat history into the shared
// streamAgent logic in agent-core.ts, then hands back a UI message stream.

import { AIChatAgent } from "@cloudflare/ai-chat";
import { convertToModelMessages } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { streamAgent } from "./agent-core";

// Extends the platform's base Env with the secrets/bindings this agent needs:
// the OpenAI key for the model itself, plus Tavily and Upstash credentials
// that get threaded down into the searchWeb/searchKnowledge tools.
interface Env extends Cloudflare.Env {
  OPENAI_API_KEY: string;
  TAVILY_API_KEY: string;
  UPSTASH_VECTOR_REST_URL: string;
  UPSTASH_VECTOR_REST_TOKEN: string;
}

// Durable Object-backed chat agent class provided by @cloudflare/ai-chat.
// Persistence, message history, and the WebSocket/HTTP chat protocol are all
// handled by the base class; we only need to implement how a new message
// gets turned into a model response.
export class DesignAgent extends AIChatAgent<Env> {
  async onChatMessage() {
    // Model is constructed per request from the bound API key rather than
    // module scope, since Workers env bindings aren't available at import time.
    const openai = createOpenAI({ apiKey: this.env.OPENAI_API_KEY });
    const model = openai("gpt-5.4");
    // AIChatAgent stores UI-shaped messages (this.messages); the AI SDK's
    // generate/stream functions expect ModelMessage shape, hence the convert.
    const messages = await convertToModelMessages(this.messages);

    // Delegate to the shared streaming agent, passing through only the env
    // values the tools actually need (keeps agent-core decoupled from the
    // full Worker Env type).
    const result = streamAgent({
      model,
      messages,
      env: {
        TAVILY_API_KEY: this.env.TAVILY_API_KEY,
        UPSTASH_VECTOR_REST_URL: this.env.UPSTASH_VECTOR_REST_URL,
        UPSTASH_VECTOR_REST_TOKEN: this.env.UPSTASH_VECTOR_REST_TOKEN,
      },
    });

    // Adapts the AI SDK stream result into the response shape the chat
    // client/useAgentChat hook expects.
    return result.toUIMessageStreamResponse();
  }
}
