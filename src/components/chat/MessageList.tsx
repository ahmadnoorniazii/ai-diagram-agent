// Scrollable list of chat messages. Shows an empty-state prompt until the
// conversation has at least one message.

import MessageBubble from "./MessageBubble";
import type { Message } from "./types";

interface MessageListProps {
  messages: Message[];
}

export default function MessageList({ messages }: MessageListProps) {
  // Empty state: nudge the user toward the intended interaction before
  // any messages exist.
  if (messages.length === 0) {
    return (
      <div className="message-list empty">
        <p className="placeholder-text">
          Describe a diagram and the AI will create it for you.
        </p>
      </div>
    );
  }

  return (
    <div className="message-list">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
    </div>
  );
}
