export type Debounced<Fn extends (...args: unknown[]) => void> = ((
  ...args: Parameters<Fn>
) => void) & {
  /** Discard a pending invocation without calling `fn`. */
  cancel: () => void;
  /** Invoke a pending call immediately, if one is scheduled. */
  flush: () => void;
};

/**
 * Create a debounced version of `fn` that postpones invocation until `delay`
 * milliseconds have elapsed since the last call. Repeated calls within that
 * window reset the timer, so `fn` runs once after activity settles, using the
 * arguments from the most recent call.
 */
export function debounce<Fn extends (...args: unknown[]) => void>(
  fn: Fn,
  delay: number,
): Debounced<Fn>;
