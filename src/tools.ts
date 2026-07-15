// Aggregator. The agent gets one record of all available tools, but each
// tool lives in its own file under src/tools/ for clarity.
//
// queryCanvas is a CLIENT side tool — its definition has no execute function
// and is fulfilled by App.tsx via useAgentChat's onToolCall handler.
//
// searchWeb and searchKnowledge both need request scoped env (Tavily key,
// Upstash credentials), so they're built per request via factory functions
// instead of being static exports.

import { addElements } from "./tools/add-elements";
import { removeElements } from "./tools/remove-elements";
import { updateElements } from "./tools/update-elements";
import { queryCanvas } from "./tools/query-canvas";
import { makeSearchWeb } from "./tools/search-web";
import { makeSearchKnowledge } from "./tools/search-knowledge";

// Subset of Env this module cares about — just the keys the two
// request-scoped tool factories need.
export interface ToolEnv {
  TAVILY_API_KEY?: string;
  UPSTASH_VECTOR_REST_URL?: string;
  UPSTASH_VECTOR_REST_TOKEN?: string;
}

// Assembles the full tool set for one request. addElements/removeElements/
// updateElements/queryCanvas are static imports (no per-request state);
// searchWeb and searchKnowledge are built fresh each call so they close over
// this request's credentials instead of a module-level singleton.
export function buildTools(env: ToolEnv) {
  return {
    addElements,
    removeElements,
    updateElements,
    queryCanvas,
    searchWeb: makeSearchWeb(env.TAVILY_API_KEY),
    searchKnowledge: makeSearchKnowledge({
      UPSTASH_VECTOR_REST_URL: env.UPSTASH_VECTOR_REST_URL,
      UPSTASH_VECTOR_REST_TOKEN: env.UPSTASH_VECTOR_REST_TOKEN,
    }),
  };
}

