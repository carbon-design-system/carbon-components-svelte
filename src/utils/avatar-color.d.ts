/** Chromatic `UserAvatar` background colors for auto mode. Grays are left out. */
type AvatarBackgroundColor =
  | "red"
  | "magenta"
  | "purple"
  | "blue"
  | "cyan"
  | "teal"
  | "green";

/**
 * Pick a stable avatar background color from a string. Empty or falsy input
 * returns the first palette entry.
 */
export function getAvatarBackgroundColor<
  T extends string = AvatarBackgroundColor,
>(value: string | null | undefined, palette?: ReadonlyArray<T>): T;
