// Chat sidebar: renders the message history and the text input used to
// send new prompts to the design agent. Owns only the input field's
// local state; message state and sending live in the parent via props.

import { useState } from "react";
import type { UIMessage } from "ai";
import MessageList from "./MessageList";
import "./chat.css";

interface ChatPanelProps {
  messages: UIMessage[];
  sendMessage: (message: { role: "user"; parts: { type: "text"; text: string }[] }) => void;
  status: string;
}

export default function ChatPanel({
  messages,
  sendMessage,
  status,
}: ChatPanelProps) {
  const [input, setInput] = useState("");

  // Wraps the raw text input into the UIMessage part shape sendMessage
  // expects, then clears the field. Ignores empty/whitespace-only input.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({
      role: "user",
      parts: [{ type: "text", text: input }],
    });
    setInput("");
  };

  // Disable the input/button while a response is in flight so the user
  // can't fire off a second message before the first one resolves.
  const isStreaming = status === "submitted" || status === "streaming";

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h2>Chat</h2>
      </div>
      <MessageList messages={messages} />
      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="chat-input"
          placeholder="Describe a diagram..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isStreaming}
        />
        <button
          type="submit"
          className="chat-send-btn"
          disabled={isStreaming || !input.trim()}
        >
          {isStreaming ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
}
