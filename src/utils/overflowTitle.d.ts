/** Params for `overflowTitle`. */
export interface OverflowTitleParams {
  /** Fixed `title`; skips overflow detection. */
  title?: string;
  /** Element to measure. Defaults to `node`. */
  measure?: HTMLElement | null;
}

/** Set `title` from overflow text. Provided `title` wins. */
export function overflowTitle(
  node: HTMLElement,
  params?: OverflowTitleParams,
): { update: (params?: OverflowTitleParams) => void };

export default overflowTitle;
