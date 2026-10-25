export type LabelBox = {
  key: string;
  /** Left edge of the preferred place. */
  x: number;
  /** Top edge of the preferred place. */
  y: number;
  width: number;
  height: number;
  /** Higher wins a collision. Default 0. */
  priority?: number;
  /** Other top-left corners to try, in order, before giving up. */
  alternatives?: ReadonlyArray<{ x: number; y: number }>;
};

export type PlacedLabel = {
  key: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Whether an alternative place was used. */
  moved: boolean;
};

/**
 * Keep the labels that fit, highest priority first, nudging to an
 * alternative before dropping.
 */
export function placeLabels(
  boxes: ReadonlyArray<LabelBox>,
  options?: {
    bounds?: { x0: number; x1: number; y0: number; y1: number };
    gap?: number;
  },
): PlacedLabel[];

/** Estimated width of a label in the 12px label style, with padding. */
export function labelWidth(text: string, glyph?: number): number;
