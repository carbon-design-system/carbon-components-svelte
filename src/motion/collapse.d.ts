import type { DurationToken, MotionMode } from "./tokens.js";

export interface CollapseOptions {
  /** Whether the element is expanded. @default true */
  open?: boolean;
  /** Milliseconds, or a Carbon duration token. @default "moderate02" */
  duration?: number | DurationToken;
  /** Carbon motion mode. @default "productive" */
  mode?: MotionMode;
  /**
   * `"respect"` jumps between states when the user prefers reduced motion.
   * @default "respect"
   */
  reducedMotion?: "respect" | "ignore";
}

/**
 * Svelte action that expands and collapses an element that stays mounted,
 * such as a disclosure's content or a side nav submenu, with Carbon motion.
 * Pass `open` as a boolean or in an options object. It animates `height`
 * and the vertical padding of the element alone, with the `entrance` curve
 * on open and the `exit` curve on close. While closed the element is
 * `inert` and `visibility: hidden`. Under `prefers-reduced-motion: reduce`
 * the element jumps between states.
 */
export function collapse(
  node: HTMLElement,
  options?: boolean | CollapseOptions,
): {
  update: (options?: boolean | CollapseOptions) => void;
  destroy: () => void;
};
