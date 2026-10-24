/**
 * Parse a "WxH" string into positive width/height numbers, or `null` if
 * it isn't one (not a string, wrong shape, or zero/negative on either side).
 */
export function parseAspectRatio(
  value: unknown,
): null | { width: number; height: number };
