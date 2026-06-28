/**
 * Chromatic `UserAvatar` background colors for auto mode. Grays are left out.
 */
export const AVATAR_BACKGROUND_COLORS: ReadonlyArray<
  "red" | "magenta" | "purple" | "blue" | "cyan" | "teal" | "green"
>;

/**
 * Hash a string to a non-negative 32-bit integer (djb2). Same string in, same hash out.
 */
export function hashString(value: string): number;

/**
 * Pick a stable avatar background color from a string. Empty or falsy input
 * returns the first palette entry.
 */
export function getAvatarBackgroundColor<
  T extends string = (typeof AVATAR_BACKGROUND_COLORS)[number],
>(value: string | null | undefined, palette?: ReadonlyArray<T>): T;
