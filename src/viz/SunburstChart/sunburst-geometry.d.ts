import type { VizColor } from "../utils/tokens.js";

export type SunburstOptions<T> = {
  id: (row: T, index: number) => unknown;
  parent: (row: T, index: number) => unknown;
  value: (row: T, index: number) => unknown;
  label?: (row: T, index: number) => unknown;
  group?: (row: T, index: number) => unknown;
  sort?: "none" | "value";
  /** The node to put at the center. */
  root?: string | number;
  /** Rings to draw around the center. */
  maxDepth?: number;
  radius: number;
  /** Radius of the hole as a share of the radius. @default 0.25 */
  innerRadius?: number;
  padAngle?: number;
  palette?: number;
  colors?: Record<string, VizColor>;
};

export type SunburstArc<T> = {
  id: string;
  parent: string | null;
  label: string;
  depth: number;
  /** Ring from the center, starting at 0. */
  ring: number;
  value: number;
  own: number;
  share: number;
  leaf: boolean;
  datum: T;
  index: number;
  group: string;
  color: string;
  d: string;
  /** Midpoint of the arc. */
  cx: number;
  cy: number;
};

export type Sunburst<T> = {
  total: number;
  /** The node at the center, or `null` when several share the first ring. */
  center: {
    id: string;
    parent: string | null;
    label: string;
    value: number;
    datum: T;
  } | null;
  rings: number;
  hole: number;
  /** Depth first, parents before their children. */
  arcs: SunburstArc<T>[];
  groups: Array<{ key: string; label: string; color: string }>;
};

/** The partition as rings around a center. */
export function buildSunburst<T>(
  rows: ReadonlyArray<T>,
  options: SunburstOptions<T>,
): Sunburst<T>;
