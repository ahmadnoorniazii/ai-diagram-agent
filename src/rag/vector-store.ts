import { Index } from "@upstash/vector";

// Thin wrapper around the Upstash Vector client. Both the Worker (per
// request, via buildTools) and the Node embed script call this. Centralizing
// it means there's exactly one place that knows the env var names.
//
// The Upstash index is created on their dashboard with a hosted embedding
// model selected — that's what lets us pass `data: "...text..."` instead of
// generating embeddings ourselves on either side of the wire.

// Optional fields because callers (Worker env, Node process.env) may not
// have these set — getIndex is what turns "missing" into a hard failure.
export interface VectorEnv {
  UPSTASH_VECTOR_REST_URL?: string;
  UPSTASH_VECTOR_REST_TOKEN?: string;
}

export function getIndex(env: VectorEnv): Index {
  // Fail loudly and early rather than letting the Upstash client throw an
  // opaque error deeper in a query/upsert call.
  if (!env.UPSTASH_VECTOR_REST_URL || !env.UPSTASH_VECTOR_REST_TOKEN) {
    throw new Error(
      "Upstash Vector is not configured: set UPSTASH_VECTOR_REST_URL and UPSTASH_VECTOR_REST_TOKEN"
    );
  }
  return new Index({
    url: env.UPSTASH_VECTOR_REST_URL,
    token: env.UPSTASH_VECTOR_REST_TOKEN,
  });
}
