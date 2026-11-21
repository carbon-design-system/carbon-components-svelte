import type { TransitionConfig } from "svelte/transition";
import type { DurationToken, EasingName, MotionMode } from "./tokens.js";

/** Params every Carbon transition accepts. */
export interface MotionParams {
  /** Milliseconds before starting. */
  delay?: number;
  /** Milliseconds, or a token name such as `"moderate02"`. */
  duration?: number | DurationToken;
  /**
   * An easing name or a `(t) => progress` function. By default `in:` uses
   * `entrance`, `out:` uses `exit`, and `transition:` uses `standard` (Svelte
   * 3 and 4 cannot tell which way a `transition:` runs).
   */
  easing?: EasingName | ((t: number) => number);
  /** Carbon motion mode. */
  mode?: MotionMode;
  /**
   * `"ignore"` plays the motion under `prefers-reduced-motion: reduce`. Use it
   * only for motion people need to understand the UI.
   */
  reducedMotion?: "respect" | "ignore";
}

export type FadeParams = MotionParams;

export interface SlideParams extends MotionParams {
  /** The axis to animate. */
  axis?: "x" | "y";
}

export interface FlyParams extends MotionParams {
  /** Horizontal offset to move in from. Physical: it does not flip in RTL. */
  x?: number | string;
  /** Vertical offset to move in from. */
  y?: number | string;
  /** Opacity to start from. */
  opacity?: number;
  /** Also shrink the height, so siblings close the gap. */
  collapse?: boolean;
}

export interface FlipParams extends Omit<MotionParams, "duration"> {
  /** Milliseconds, a token name, or a function of the distance moved. */
  duration?: number | DurationToken | ((distance: number) => number);
}

export interface TransitionOptions {
  direction?: "in" | "out" | "both";
}

/**
 * Fade in and out. Defaults to `fast02`. `in:` and `out:` take the entrance
 * and exit curves; `transition:` takes the standard curve.
 */
export function fade(
  node: Element,
  params?: FadeParams,
  options?: TransitionOptions,
): TransitionConfig;

/** Reveal and hide along an axis. Defaults to `moderate02`. */
export function slide(
  node: Element,
  params?: SlideParams,
  options?: TransitionOptions,
): TransitionConfig;

/** Move in from an offset while fading. Defaults to `moderate02`. */
export function fly(
  node: Element,
  params?: FlyParams,
  options?: TransitionOptions,
): TransitionConfig;

/** Animate a keyed `{#each}` item to its new position. Use with `animate:`. */
export function flip(
  node: Element,
  rects: { from: DOMRect; to: DOMRect },
  params?: FlipParams,
): TransitionConfig;
