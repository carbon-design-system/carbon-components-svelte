export interface ShouldFlipHorizontallyOptions {
  /** Anchor's viewport-relative left edge. */
  anchorLeft: number;
  anchorWidth: number;
  floatingWidth: number;
  viewportWidth: number;
}

/** Decide whether a menu should align to the anchor's right edge to stay inside the viewport. */
export function shouldFlipHorizontally(
  options: ShouldFlipHorizontallyOptions,
): boolean;
