import type { TransitionConfig } from "svelte/transition";

/** A Svelte transition function, such as `fade` or `fly`. */
export type TransitionFunction = (
  node: Element,
  params: never,
  options: { direction: "in" | "out" | "both" },
) => TransitionConfig;

/**
 * The `transition` prop of a component that can animate.
 *
 * - `undefined` or `false`: no animation.
 * - `true`: the component's own preset.
 * - An object of the preset's params, which override it.
 * - An object with `fn`, any Svelte transition function, to use instead. The
 *   rest of the object is that function's params.
 */
export type TransitionProp<P extends object = object> =
  | undefined
  | boolean
  | P
  | ({ fn: TransitionFunction } & Record<string, unknown>);

/** Resolve a `transition` prop against a component's preset. */
export function resolveTransition<P extends object>(
  prop: TransitionProp<P>,
  preset: { fn: TransitionFunction; params?: P },
): { fn: TransitionFunction; params: P; animated: boolean };
