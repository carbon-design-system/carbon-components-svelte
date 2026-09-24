/**
 * Convert a number to a pixel length. Strings (e.g. `"50%"`, `"2rem"`)
 * and nullish values pass through unchanged.
 */
export function toCssLength<T extends string | null | undefined>(
  value: number | T,
): string | T;
