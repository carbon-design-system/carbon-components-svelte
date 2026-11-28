/** Options for the `sticky` action. */
export interface StickyOptions {
  /** Set to `false` to stop reporting. Defaults to `true`. */
  enabled?: boolean;
  /** The edge the element sticks to. Defaults to `"top"`. */
  edge?: "top" | "bottom";
  /**
   * The element's distance from `edge` while stuck: pixels for a number,
   * any CSS length for a string. Defaults to the element's computed `top`
   * or `bottom`.
   */
  offset?: number | string;
  /** Called with `true` when the element sticks and `false` when it lets go. */
  onChange?: (stuck: boolean) => void;
}

/**
 * Svelte action: report whether a `position: sticky` element is stuck,
 * pinned at its offset while content scrolls under it. Every instance on
 * the page shares one `IntersectionObserver`. Does nothing on the server
 * or without `IntersectionObserver`.
 */
export function sticky(
  node: HTMLElement,
  options?: StickyOptions,
): { update: (options?: StickyOptions) => void; destroy: () => void };
