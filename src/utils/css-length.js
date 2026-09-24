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
