# AI Diagram Agent

An agentic diagramming tool. You describe a diagram in natural language
("draw a sequence diagram of an OAuth login") and an AI agent builds it on an
Excalidraw canvas by calling structured tools to add, update, and remove
elements — then reads the live canvas back to refine its work.

Built on Cloudflare Workers (Agents SDK) with a React front end, and hardened
with an eval suite: golden datasets plus automated scorers that catch
regressions as the agent evolves.

## Stack

- **Runtime:** Cloudflare Workers + Agents SDK
- **Model layer:** Vercel AI SDK (`ai`, `@ai-sdk/openai`)
- **UI:** React 19 + Vite, Excalidraw canvas
- **Retrieval:** vector store for RAG over a local knowledge corpus
- **Evals:** Braintrust + custom code scorers

## Getting started

```bash
npm install
cp .dev.vars.example .dev.vars   # add your API keys
npm run dev                      # start the app
npm run eval                     # run the eval suite
```

## Layout

- `src/` — worker entry, agent core, tools, React UI, RAG, context helpers
- `evals/` — golden datasets and scorers
- `data/corpus/` — knowledge base used by the search tool

## Progress

This repo is built up incrementally, one focused step per day — from the bare
canvas scaffold to a full agent with tools, evals, context engineering, and RAG.
