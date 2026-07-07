// Cloudflare Worker entry point backing the app's server-side API.
// Currently a stub that answers every request with 404 — this is the
// seam where the agent's chat/tool endpoints will be added.

export default {
  // Request handler invoked by the Workers runtime for every incoming
  // request. Both params are unused for now since there are no routes yet.
  fetch(_request: Request, _env: Env) {
    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;

// Worker environment bindings (KV, D1, secrets, etc.), empty until routes
// and integrations that need them are introduced.
interface Env {}
