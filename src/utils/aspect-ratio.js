// @ts-check

const RATIO_PATTERN = /^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)$/;

/**
 * Parse a "WxH" string into positive width/height numbers, or `null` if
 * it isn't one (not a string, wrong shape, or zero/negative on either side).
 *
 * @param {unknown} value
 * @returns {null | { width: number; height: number }}
 */
export function parseAspectRatio(value) {
  if (typeof value !== "string") return null;
  const match = RATIO_PATTERN.exec(value);
  if (!match) return null;
  const width = Number(match[1]);
  const height = Number(match[2]);
  if (!(width > 0) || !(height > 0)) return null;
  return { width, height };
}
