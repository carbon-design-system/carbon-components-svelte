/**
 * Resolve the writing direction: the nearest `LayoutDirection` first, then
 * the element's computed direction, then the document's. Returns `"ltr"`
 * on the server.
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
