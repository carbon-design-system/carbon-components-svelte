export type Debounced<Fn extends (...args: unknown[]) => void> = ((
  ...args: Parameters<Fn>
) => void) & {
  cancel: () => void;
  flush: () => void;
};

/** Debounce `callback` until `delay` ms after the last call. */
export function debounce<Fn extends (...args: unknown[]) => void>(
  callback: Fn,
  delay: number,
): Debounced<Fn>;
