/** A Carbon motion duration name. */
export type DurationToken =
  "fast01" | "fast02" | "moderate01" | "moderate02" | "slow01" | "slow02";

/** A Carbon easing curve. */
export type EasingName = "standard" | "entrance" | "exit";

/**
 * `productive` for everyday UI, `expressive` for moments that deserve
 * emphasis.
 */
export type MotionMode = "productive" | "expressive";

/** Carbon's motion durations in milliseconds. */
export const duration: Readonly<Record<DurationToken, number>>;

/** Carbon's easing curves as `(t) => progress` functions. */
export const easing: Readonly<
  Record<EasingName, Readonly<Record<MotionMode, (t: number) => number>>>
>;

/** Carbon's easing curves as CSS `cubic-bezier()` strings. */
export const easingCss: Readonly<
  Record<EasingName, Readonly<Record<MotionMode, string>>>
>;

/** Get the CSS timing function for an easing and motion mode. */
export function motion(name?: EasingName, mode?: MotionMode): string;
