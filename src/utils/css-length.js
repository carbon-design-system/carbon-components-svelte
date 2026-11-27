// @ts-check

/**
 * Convert a number to a pixel length. Strings (e.g. `"50%"`, `"2rem"`)
 * and nullish values pass through unchanged.
 *
 * @template {string | null | undefined} T
 * @param {number | T} value
 * @returns {string | T}
 */
export function toCssLength(value) {
  return typeof value === "number" ? `${value}px` : value;
}

/**
 * Resolve a CSS length to pixels by laying out a hidden probe in the
 * document body. Numbers pass through. Returns `undefined` on the server,
 * for nullish values, and for a length that does not resolve to a positive
 * height there. A percentage resolves against the body, so pass a fixed or
 * viewport length.
 *
 * @param {number | string | null | undefined} value
 * @returns {number | undefined}
 */
export function resolveCssLength(value) {
  if (typeof value === "number") return value;
  if (!value || typeof document === "undefined") return undefined;

  const probe = document.createElement("div");
  probe.style.cssText =
    "position:absolute;visibility:hidden;pointer-events:none;inline-size:0";
  probe.style.height = value;
  document.body.appendChild(probe);
  const height = probe.getBoundingClientRect().height;
  probe.remove();

  return height > 0 ? height : undefined;
}
