import type { Readable } from "svelte/store";

export type DelayedLoadingOptions = {
  /**
   * Milliseconds `loading` must stay `true` before the indicator shows.
   * @default 300
   */
  delay?: number;
  /**
   * Milliseconds the indicator stays once it shows.
   * @default 500
   */
  minDuration?: number;
};

export type LoadingDelay = ((loading: boolean) => void) & {
  cancel: () => void;
};

/**
 * Turns a `loading` flag into whether to show a loading indicator. Work that
 * ends within `delay` shows nothing. Once shown, the indicator stays for at
 * least `minDuration`.
 * @param onChange - Called with each new state.
 */
export function createLoadingDelay(
  onChange: (shown: boolean) => void,
  options?: DelayedLoadingOptions,
): LoadingDelay;

/**
 * Follows a component's `loading` prop and its `loadingDelay` prop. With a
 * delay, the indicator also stays for the default minimum; with none, it
 * follows `loading` exactly. A new delay starts from what is on screen.
 * @param onChange - Called with each new state.
 */
export function createLoadingIndicator(
  onChange: (shown: boolean) => void,
): ((loading: boolean, delay: number) => void) & { cancel: () => void };

/**
 * Creates a readable store that follows a `loading` store: `true` only when
 * the work outlasts `delay`, and then for at least `minDuration`.
 */
export function delayedLoading(
  loading: Readable<boolean>,
  options?: DelayedLoadingOptions,
): Readable<boolean>;
