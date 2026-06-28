// @ts-check
// Pick a stable avatar background color from a name or id. Same string, same color.

/**
 * Chromatic `UserAvatar` background colors for auto mode. Grays are left out.
 * Each entry is a valid `UserAvatar` `backgroundColor` value.
 * @type {ReadonlyArray<"red" | "magenta" | "purple" | "blue" | "cyan" | "teal" | "green">}
 */
export const AVATAR_BACKGROUND_COLORS = [
  "red",
  "magenta",
  "purple",
  "blue",
  "cyan",
  "teal",
  "green",
];

/**
 * Hash a string to a non-negative 32-bit integer (djb2). Same string in, same hash out.
 *
 * @param {string} value
 * @returns {number}
 */
export function hashString(value) {
  let hash = 5381;
  for (let i = 0; i < value.length; i++) {
    // hash * 33 + charCode, kept within 32-bit range via `| 0`.
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  // Coerce to an unsigned 32-bit integer.
  return hash >>> 0;
}

/**
 * Pick a stable avatar background color from a string. Empty or falsy input
 * returns the first palette entry.
 *
 * @template {string} [T=AVATAR_BACKGROUND_COLORS[number]]
 * @param {string | null | undefined} value
 * @param {ReadonlyArray<T>} [palette]
 * @returns {T}
 */
export function getAvatarBackgroundColor(
  value,
  palette = /** @type {ReadonlyArray<T>} */ (AVATAR_BACKGROUND_COLORS),
) {
  if (!value || palette.length === 0) return palette[0];
  return palette[hashString(value) % palette.length];
}
