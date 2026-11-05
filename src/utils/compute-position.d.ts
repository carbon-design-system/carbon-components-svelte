export type RectLike = {
  top: number;
  bottom: number;
  left: number;
  right: number;
  width: number;
  height: number;
};

export type Side = "top" | "bottom" | "left" | "right";

/**
 * A physical alignment along the anchor's edge: `start` is the left edge of
 * a box above or below the anchor and the top edge of one beside it.
 */
export type Align = "start" | "center" | "end";

export type Edges = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export type Offset = {
  /** The gap between anchor and box. */
  main?: number;
  /** Slides the box along the anchor's edge: positive moves it right, or down. */
  cross?: number;
};

export type Resolved = { side: Side; align: Align };

export interface FlipOptions {
  /** Set to `false` to keep the preferred side, and still fit the alignment. @default true */
  side?: boolean;
  /** When neither side along the main axis has room, open on the other axis. */
  fallbackAxis?: boolean;
  /** Take another alignment when the box runs past the boundary along the anchor's edge. */
  align?: boolean | "any";
  /** When nothing fits, take the placement that overflows least. On by default. */
  bestFit?: boolean;
}

export interface ShiftOptions {
  /** Room to keep between the box and the boundary. */
  padding?: number;
  /** Also slide the box across the side it opens on. */
  mainAxis?: boolean;
}

export interface ComputePositionOptions {
  /**
   * `bottom`, `top-start`, `left-end`, `start` (the inline start side),
   * `bottom-left`, `right-top`. A bare side centers.
   * @default "bottom"
   */
  placement?: string;
  /** Read `start` and `end` for a right-to-left page. */
  rtl?: boolean;
  offset?: number | Offset | ((resolved: Resolved) => number | Offset);
  /** @default true */
  flip?: boolean | FlipOptions;
  /** @default false */
  shift?: boolean | ShiftOptions;
  /** Report the room left on the side the box opens on. */
  size?: boolean | { padding?: number };
  arrow?: { size: number; padding?: number };
  /** The box the overlay stays in (several are intersected). Without one nothing flips or shifts. */
  boundary?: Edges | Edges[] | null;
  /** Room kept inside the boundary. */
  padding?: number | { main?: number; cross?: number };
}

export interface PositionResult {
  /** Left edge of the box, in the anchor rect's coordinates. */
  x: number;
  /** Top edge of the box. */
  y: number;
  /** Where the box's alignment meets the anchor, before any slide. */
  reference: { x: number; y: number };
  side: Side;
  align: Align;
  /** `side` and `align` in the form that was asked for: logical or physical. */
  placement: string;
  flipped: boolean;
  /** How far the box slid. */
  shift: { x: number; y: number };
  arrow: { x?: number; y?: number; offset: number } | undefined;
  available: { width: number; height: number } | undefined;
}

/** Read a placement into a side and a physical alignment. */
export function parsePlacement(placement: string, rtl?: boolean): Resolved;

/** Name a side and a physical alignment as a placement. */
export function formatPlacement(
  side: Side,
  align: Align,
  options?: { rtl?: boolean; logical?: boolean },
): string;

/**
 * How far a box of `size` that starts at `at` has to slide to sit between
 * `min` and `max`. A box longer than the room keeps its start in view.
 */
export function slideWithin(
  at: number,
  size: number,
  min: number,
  max: number,
): number;

/**
 * Where a floating box of `floating`'s size goes next to `anchor`. Pure
 * arithmetic on rects: offset, flip, align fit, shift, then the arrow and
 * the size for the placement that won.
 */
export function computePosition(
  anchor: RectLike,
  floating: { width: number; height: number },
  options?: ComputePositionOptions,
): PositionResult;
