import type { Readable } from "svelte/store";

/**
 * Observe an element's width with a `ResizeObserver` and report which named
 * min-width ranges currently match. Each range matches when the element's
 * content-box width is greater than or equal to its threshold (in px).
 *
 * Returns a readable store (rather than acting as a Svelte action) so the
 * matched state stays reactive and composable. The observer is disconnected
 * when the last subscriber unsubscribes. SSR-safe: every range reports `false`
 * until observed in a browser.
 *
 * @param node Element to observe.
 * @param ranges Map of range name to minimum content-box width in px.
 */
export function containerQuery<T extends Record<string, number>>(
  node: Element,
  ranges: T,
): Readable<Record<keyof T, boolean>>;

export default containerQuery;
