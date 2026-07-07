// Shared chat data model used across the chat panel components.

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
}

// Represents a single agent tool invocation surfaced in a message, e.g.
// a diagram-generation call, along with its live status and output.
export interface ToolCall {
  id: string;
  name: string;
  status: "running" | "complete" | "error";
  args?: Record<string, unknown>;
  result?: unknown;
}
