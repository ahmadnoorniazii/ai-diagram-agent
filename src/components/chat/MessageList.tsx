// Scrollable message history. Auto-scrolls to the newest message, but only
// when the user was already at the bottom, so scrolling up to read earlier
// messages isn't interrupted by incoming assistant tokens.

import { useEffect, useRef } from "react";
import type { UIMessage } from "ai";
import MessageBubble from "./MessageBubble";

interface MessageListProps {
  messages: UIMessage[];
}

export default function MessageList({ messages }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Track whether the user was at (or near) the bottom before the last update
  // so we only auto scroll when they were already following along.
  const wasAtBottomRef = useRef(true);

  // Recompute "near bottom" on every scroll event; 50px gives some slack
  // so minor rendering jitter doesn't flip the flag off.
  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    wasAtBottomRef.current = distanceFromBottom < 50;
  };

  // Runs after each message list update (new message, streaming token, etc.)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (wasAtBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  // Empty state before the first prompt is sent
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
    <div className="message-list" ref={containerRef} onScroll={handleScroll}>
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
    </div>
  );
}
