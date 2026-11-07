// Types shared by `DashboardGrid` and `DashboardGridItem`. Nothing here is
// public: the item reads the grid through context.

import type { Readable } from "svelte/store";
import type { BreakpointSize } from "../Breakpoint/breakpoints.js";
import type { GridMetrics } from "../utils/dashboard-grid-geometry.js";
import type { DashboardGridLayoutItem } from "../utils/dashboard-layout.js";

/** How a widget's drag handle or resize edge moves it. */
export type DashboardGridEdge = "inline" | "block" | "corner";

/** What the grid knows about one widget, for the widget to render. */
export interface DashboardGridItemInfo {
  /** The custom properties that place the widget. */
  style: string;
  /** Whether the widget is `static`. */
  locked: boolean;
}

/** The elements of one registered widget. */
export interface DashboardGridWidget {
  /** The widget's grid cell. */
  root: HTMLElement;
  /** The card that follows the pointer. */
  frame: HTMLElement | null;
  /** The drag handle. */
  handle: HTMLElement | null;
}

/** The widget being moved or resized, and how. */
export interface DashboardGridInteraction {
  id: string;
  type: "move" | "resize";
  source: "pointer" | "keyboard";
}

/** What `DashboardGrid` sets in context for `DashboardGridItem`. */
export interface DashboardGridContext {
  items: Readable<Map<string, DashboardGridItemInfo>>;
  options: Readable<{ draggable: boolean; resizable: boolean }>;
  texts: Readable<{
    handleLabelText: (position: { label: string }) => string;
    instructionsId: string;
    gridId: string;
  }>;
  interaction: Readable<DashboardGridInteraction | null>;
  register: (id: string, widget: DashboardGridWidget) => () => void;
  setLabel: (id: string, label: string) => void;
  /** Returns `false` to decline the drag. */
  pointerStart: (
    id: string,
    mode: "move" | "resize",
    edge: DashboardGridEdge | null,
    event: PointerEvent,
    root: HTMLElement,
    frame: HTMLElement,
  ) => boolean;
  pointerMove: (event: PointerEvent) => void;
  pointerEnd: (event: PointerEvent) => void;
  keydown: (id: string, label: string, event: KeyboardEvent) => void;
  blur: (id: string) => void;
}

/** One pointer drag or resize, from the press to the release. */
export interface PointerSession {
  id: string;
  mode: "move" | "resize";
  edge: DashboardGridEdge | null;
  key: BreakpointSize;
  /** The layout the drag started from. Every candidate is made from it. */
  base: DashboardGridLayoutItem[];
  item: DashboardGridLayoutItem;
  metrics: GridMetrics;
  /** The widget's cell at the press. */
  rect: DOMRect;
  /** The grid at the press. */
  gridRect: DOMRect;
  root: HTMLElement;
  frame: HTMLElement;
  x0: number;
  y0: number;
  x: number;
  y: number;
  /** Whether the pointer has moved far enough to be a drag. */
  started: boolean;
  /** The cell or size of the last candidate, to skip an unchanged one. */
  last: string;
  frameId: number;
  lastTime: number;
  edgeSince: number;
  carry: { x: number; y: number };
  scrollers: HTMLElement[];
}

/** One keyboard move, from the pick-up to the drop. */
export interface KeyboardSession {
  id: string;
  label: string;
  key: BreakpointSize;
  origin: DashboardGridLayoutItem;
}
