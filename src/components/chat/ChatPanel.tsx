// Right-hand chat sidebar: renders the message history and the input form
// used to describe diagrams to the AI agent. The submit handler is a stub
// for now — the backend wiring lands later.

import { useState } from "react";
import MessageList from "./MessageList";
import type { Message } from "./types";
import "./chat.css";

export default function ChatPanel() {
  // Message history is currently static (never populated) — this is the
  // seam where streamed responses from the worker will be appended later.
  const [messages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Non-functional — wired up later
  };

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
        />
        <button type="submit" className="chat-send-btn">
          Send
        </button>
      </form>
    </div>
  );
}
