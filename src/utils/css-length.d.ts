/**
 * Convert a number to a pixel length. Strings (e.g. `"50%"`, `"2rem"`)
 * and nullish values pass through unchanged.
 */
export function toCssLength<T extends string | null | undefined>(
  value: number | T,
): string | T;

/**
 * Resolve a CSS length to pixels by laying out a hidden probe in the
 * document body. Numbers pass through. Returns `undefined` on the server,
 * for nullish values, and for a length that does not resolve to a positive
 * height there.
 */
export function resolveCssLength(
  value: number | string | null | undefined,
): number | undefined;
