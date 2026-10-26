export type Box = { left: number; top: number; width: number; height: number };

export type SideLabel = {
  side: "top" | "right" | "bottom" | "left";
  value: number;
  x: number;
  y: number;
};

export type Segment = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  value: number;
};

/** Signed distance from `y` to the nearest baseline row, or `null` without rows. */
export function rowDelta(
  y: number,
  step: number,
  offset: number,
): number | null;

/** Margin, padding, and content boxes from a border box and side widths. */
export function boxes(
  rect: Box,
  margin: number[],
  border: number[],
  padding: number[],
): {
  marginBox: Box;
  paddingBox: Box;
  contentBox: Box;
  marginWidths: number[];
};

/** Labels centered in each non-zero side of the ring between two boxes. */
export function ringLabels(
  outer: Box,
  inner: Box,
  values: number[],
): SideLabel[];

/** Distance segments between two ranges on one axis. */
export function axisSegments(
  a1: number,
  a2: number,
  b1: number,
  b2: number,
): [number, number][];

/** Middle of the overlap of two ranges, else the middle of the first. */
export function crossCenter(
  a1: number,
  a2: number,
  b1: number,
  b2: number,
): number;

/** Horizontal and vertical distance segments from rect `a` to rect `b`. */
export function distanceSegments(
  a: { left: number; top: number; right: number; bottom: number },
  b: { left: number; top: number; right: number; bottom: number },
): Segment[];

/**
 * Indexes of the targets that fail WCAG 2.2 target size (2.5.8): smaller
 * than `size` and not spaced from other targets. With `layers`, only
 * targets with the same layer key are compared.
 */
export function failingTargets(
  targets: Box[],
  size: number,
  layers?: unknown[],
): number[];

/**
 * Labels for page marks, merging labels of the same `group` that would
 * overlap into one label on the first mark. `null` hides a label.
 */
export function mergeLabels(
  marks: { x: number; y: number; text: string; group: string }[],
  metrics?: { charWidth?: number; padding?: number; height?: number },
): (string | null)[];

/**
 * The targets that fail WCAG 2.2 target size (2.5.8), each with the index
 * of the target that crowds it most and how many pixels more room it needs.
 */
export function targetConflicts(
  targets: Box[],
  size: number,
  layers?: unknown[],
): { index: number; by: number; needs: number }[];
