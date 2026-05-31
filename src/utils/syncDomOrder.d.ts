/**
 * Reorder a collection of id-bearing items to match the DOM order of the
 * elements matching `selector` within `root`, reassigning a contiguous `index`.
 * Items with no matching DOM element are dropped.
 */
export function syncDomOrder<T extends { id: string }>(options: {
  /** Element to query within. */
  root: Element;
  /** CSS selector for the ordered child elements. */
  selector: string;
  /** Items to reorder, keyed by `id`. */
  items: readonly T[];
}): (T & { index: number })[];
