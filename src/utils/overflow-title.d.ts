/** Params for `overflowTitle`. */
export interface OverflowTitleParams {
  /** Fixed `title`; skips overflow detection. */
  title?: string;
  /** Element to measure. Defaults to `node`. */
  measure?: HTMLElement | null;
  /**
   * Measure on `pointerenter` and `focusin` instead of on mount and update,
   * and again when an ancestor's width transition ends while hovered or
   * focused.
   */
  lazy?: boolean;
}

/** Set `title` from overflow text. Provided `title` wins. */
export function overflowTitle(
  node: HTMLElement,
  options?: OverflowTitleParams,
): { update: (options?: OverflowTitleParams) => void; destroy: () => void };
