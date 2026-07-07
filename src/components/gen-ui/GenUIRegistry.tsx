// Registry mapping agent tool names to custom "generative UI" React
// components. Lets specific tool results (e.g. a diagram preview) render
// with a bespoke component instead of falling back to raw JSON.

import type { ComponentType } from "react";

export interface GenUIComponentProps {
  toolName: string;
  args: Record<string, unknown>;
  result: unknown;
}

type GenUIMap = Record<string, ComponentType<GenUIComponentProps>>;

// Populated incrementally as tool-specific renderers are built.
// Example: { "generateDiagram": DiagramPreview }
const registry: GenUIMap = {};

// Associates a tool name with the component that should render its result.
export function registerGenUI(
  toolName: string,
  component: ComponentType<GenUIComponentProps>
) {
  registry[toolName] = component;
}

// Looks up the registered component for a tool, or null if none exists
// (in which case callers should fall back to a generic renderer).
export function getGenUIComponent(
  toolName: string
): ComponentType<GenUIComponentProps> | null {
  return registry[toolName] ?? null;
}
