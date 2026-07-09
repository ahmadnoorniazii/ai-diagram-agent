// Simplified Excalidraw element types for agent tool use.
// These cover the properties the agent needs to create diagrams.
// Excalidraw accepts many more properties, but these are the ones
// that matter for generating diagrams from an LLM.

// Fields shared by every Excalidraw element regardless of shape type
// (position, styling, grouping, and binding bookkeeping).
export interface BaseElement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  strokeColor: string;
  backgroundColor: string;
  fillStyle: "solid" | "hachure" | "cross-hatch";
  strokeWidth: number;
  roughness: number;
  opacity: number;
  angle: number;
  groupIds: string[];
  isDeleted: boolean;
  boundElements: { id: string; type: "arrow" | "text" }[] | null;
}

// Shape variants. Rectangle/ellipse/diamond add nothing but a discriminant
// (and optional corner rounding for rectangles) on top of BaseElement.
export interface RectangleElement extends BaseElement {
  type: "rectangle";
  roundness: { type: number; value?: number } | null;
}

export interface EllipseElement extends BaseElement {
  type: "ellipse";
}

export interface DiamondElement extends BaseElement {
  type: "diamond";
}

// Standalone text, or a label bound to a container shape via containerId.
export interface TextElement extends BaseElement {
  type: "text";
  text: string;
  fontSize: number;
  fontFamily: number;
  textAlign: "left" | "center" | "right";
  verticalAlign: "top" | "middle" | "bottom";
  containerId: string | null;
}

// Arrows carry their own point path plus optional bindings to snap their
// endpoints to other elements; lines are the same without bindings.
export interface ArrowElement extends BaseElement {
  type: "arrow";
  points: [number, number][];
  startBinding: { elementId: string; focus: number; gap: number } | null;
  endBinding: { elementId: string; focus: number; gap: number } | null;
}

export interface LineElement extends BaseElement {
  type: "line";
  points: [number, number][];
}

// Discriminated union over the `type` field, used to type-narrow elements
// coming back from the agent/tools before rendering them on the canvas.
export type ExcalidrawElement =
  | RectangleElement
  | EllipseElement
  | DiamondElement
  | TextElement
  | ArrowElement
  | LineElement;
