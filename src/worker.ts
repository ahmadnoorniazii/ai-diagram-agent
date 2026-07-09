// Worker entrypoint: wires the DesignAgent Durable Object into Cloudflare's
// Workers runtime and delegates all agent routing (WebSocket upgrades,
// per-conversation instance lookup) to the `agents` framework.

import { DesignAgent } from "./agent";
import { routeAgentRequest } from "agents";

// Re-export so wrangler can bind the class as a Durable Object namespace
// (see the DesignAgent binding in wrangler config).
export { DesignAgent };

interface Env {
  DesignAgent: DurableObjectNamespace;
  OPENAI_API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env) {
    // routeAgentRequest matches /agents/:agent/:name style paths and
    // forwards to the right Durable Object instance; anything else 404s.
    return (
      (await routeAgentRequest(request, env)) ||
      new Response("Not found", { status: 404 })
    );
  },
} satisfies ExportedHandler<Env>;
