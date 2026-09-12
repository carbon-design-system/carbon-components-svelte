export type RafThrottled<Fn extends (...args: unknown[]) => void> = ((
  ...args: Parameters<Fn>
) => void) & {
  cancel: () => void;
};

/** Run `fn` at most once per frame; same-frame calls keep the latest arguments. */
export function rafThrottle<Fn extends (...args: unknown[]) => void>(
  fn: Fn,
): RafThrottled<Fn>;
