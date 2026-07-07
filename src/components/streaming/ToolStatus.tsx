// Compact status indicator for an in-progress or finished agent tool
// call, shown inline in the chat stream (running / complete / error).

interface ToolStatusProps {
  name: string;
  status: "running" | "complete" | "error";
}

export default function ToolStatus({ name, status }: ToolStatusProps) {
  // CSS class hook for the icon; the actual glyph is chosen below per status.
  const icon =
    status === "running" ? "spinner" : status === "complete" ? "check" : "error";

  return (
    <div className={`tool-status ${status}`}>
      <span className={`tool-icon ${icon}`}>
        {status === "running" && "⏳"}
        {status === "complete" && "✓"}
        {status === "error" && "✗"}
      </span>
      <span className="tool-name">{name}</span>
      {status === "running" && <span className="tool-dots">...</span>}
    </div>
  );
}
