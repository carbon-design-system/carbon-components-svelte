// @ts-check
// Plain DOM, no Svelte, so non-component modules (the DatePicker's calendar
// engine) can resolve the direction without pulling in the Svelte runtime.

/** @typedef {"ltr" | "rtl"} Direction */

/**
 * The direction the markup sets for `node`: its nearest `dir` attribute,
 * else the nearest `LayoutDirection`'s. `undefined` when neither sets one.
 * Content portalled out of `node`'s subtree takes this as its `dir`.
 * Returns the `LayoutDirection`'s on the server.
 * @param {Direction | undefined} contextDirection - From `getLayoutDirection`.
 * @param {Element | null} [node]
 * @returns {Direction | undefined}
 */
export function declaredDirection(contextDirection, node) {
  if (typeof document === "undefined" || !node?.isConnected) {
    return contextDirection;
  }
  const dir = node.closest("[dir]")?.getAttribute("dir")?.toLowerCase();
  if (dir === "rtl" || dir === "ltr") return dir;
  return contextDirection;
}

/**
 * Resolve the writing direction as the styles do: the nearest `dir`
 * attribute on the element or an ancestor wins, so a plain `dir` inside a
 * `LayoutDirection` overrides it. Then the nearest `LayoutDirection`, then
 * the computed direction (for `dir="auto"`, or a `direction` set in CSS).
 * Returns the `LayoutDirection`'s, or `"ltr"`, on the server.
 * @param {Direction | undefined} contextDirection - From `getLayoutDirection`.
 * @param {Element | null} [node]
 * @returns {Direction}
 */
export function resolveLayoutDirection(contextDirection, node) {
  if (typeof document === "undefined") return contextDirection ?? "ltr";
  const declared = declaredDirection(contextDirection, node);
  if (declared) return declared;
  const element = node?.isConnected ? node : document.documentElement;
  return getComputedStyle(element).direction === "rtl" ? "rtl" : "ltr";
}

/**
 * The arrow key as an LTR page reads it. In RTL, ArrowLeft and ArrowRight
 * swap, so "ArrowRight" always points to the inline end. Other keys pass
 * through, and only the two inline arrows resolve the direction.
 * @param {string} key - A `KeyboardEvent` key.
 * @param {Direction | undefined} contextDirection - From `getLayoutDirection`.
 * @param {Element | null} [node]
 * @returns {string}
 */
export function inlineKey(key, contextDirection, node) {
  if (key !== "ArrowLeft" && key !== "ArrowRight") return key;
  if (resolveLayoutDirection(contextDirection, node) !== "rtl") return key;
  return key === "ArrowLeft" ? "ArrowRight" : "ArrowLeft";
}
