// Lightweight markdown-to-HTML converter used to render assistant chat
// messages. Handles a small, fixed set of patterns via regex rather than
// pulling in a full markdown parser dependency.

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Simple markdown rendering — converts basic patterns to HTML.
  // This is good enough for chat output; a full markdown parser
  // (like marked or react-markdown) can be swapped in if needed.
  const html = content
    // Fenced code blocks: ```lang\n...``` -> <pre><code class="lang-...">
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="lang-$1">$2</code></pre>')
    // Inline code: `...` -> <code>
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // Bold: **...** -> <strong>
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic: *...* -> <em>. Runs after bold so ** pairs are already consumed.
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Line breaks: \n -> <br />
    .replace(/\n/g, "<br />");

  return <div className="markdown" dangerouslySetInnerHTML={{ __html: html }} />;
}
