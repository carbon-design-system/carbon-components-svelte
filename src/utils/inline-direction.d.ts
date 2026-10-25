/**
 * The direction the markup sets for `node`: its nearest `dir` attribute,
 * else the nearest `LayoutDirection`'s. `undefined` when neither sets one.
 * Content portalled out of `node`'s subtree takes this as its `dir`.
 * Returns the `LayoutDirection`'s on the server.
 */
export function declaredDirection(
  contextDirection: "ltr" | "rtl" | undefined,
  node?: Element | null,
): "ltr" | "rtl" | undefined;

/**
 * Resolve the writing direction as the styles do: the nearest `dir`
 * attribute on the element or an ancestor wins, so a plain `dir` inside a
 * `LayoutDirection` overrides it. Then the nearest `LayoutDirection`, then
 * the computed direction (for `dir="auto"`, or a `direction` set in CSS).
 * Returns the `LayoutDirection`'s, or `"ltr"`, on the server.
 */
export function resolveLayoutDirection(
  contextDirection: "ltr" | "rtl" | undefined,
  node?: Element | null,
): "ltr" | "rtl";

/**
 * The arrow key as an LTR page reads it. In RTL, ArrowLeft and ArrowRight
 * swap, so "ArrowRight" always points to the inline end. Other keys pass
 * through.
 */
export function inlineKey(
  key: string,
  contextDirection: "ltr" | "rtl" | undefined,
  node?: Element | null,
): string;
