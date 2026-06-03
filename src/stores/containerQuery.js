// @ts-check
import { readable } from "svelte/store";

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
 * @template {Record<string, number>} T
 * @param {Element} node - Element to observe.
 * @param {T} ranges - Map of range name to minimum content-box width in px.
 * @returns {import("svelte/store").Readable<Record<keyof T, boolean>>}
 */
export function containerQuery(node, ranges) {
  /** @param {number} width */
  function evaluate(width) {
    const result = /** @type {Record<keyof T, boolean>} */ ({});
    for (const name of /** @type {(keyof T)[]} */ (Object.keys(ranges))) {
      result[name] = width >= ranges[name];
    }
    return result;
  }

  return readable(evaluate(0), (set) => {
    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        set(evaluate(entry.contentRect.width));
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  });
}

export default containerQuery;
