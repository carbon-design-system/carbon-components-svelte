/** Options for the `sticky` action. */
export interface StickyOptions {
  /** Set to `false` to stop reporting. Defaults to `true`. */
  enabled?: boolean;
  /** The edge the element sticks to. Defaults to `"top"`. */
  edge?: "top" | "bottom";
  /**
   * The element's distance from `edge` while stuck: pixels for a number,
   * any CSS length for a string. Defaults to the element's computed `top`
   * or `bottom`. `"stack"` sets a top-edge element's `top` to stick below
   * the UI Shell `Header` (when the page scrolls) and below the sticky
   * elements before it in the same scroll container.
   */
  offset?: "stack" | number | (string & {});
  /** Called with `true` when the element sticks and `false` when it lets go. */
  onChange?: (stuck: boolean) => void;
}

/**
 * Svelte action: report whether a `position: sticky` element is stuck,
 * pinned at its offset while content scrolls under it. Every instance on
 * the page shares one `IntersectionObserver`. With `offset: "stack"`,
 * top-edge elements stack, and their scroll container publishes the
 * height its top-edge elements cover as `--ccs-sticky-offset`, on the
 * root element when the page scrolls. Does nothing on the server or
 * without `IntersectionObserver`.
 */
export function sticky(
  node: HTMLElement,
  options?: StickyOptions,
): { update: (options?: StickyOptions) => void; destroy: () => void };
