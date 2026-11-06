export type Debounced<Fn extends (...args: never[]) => void> = ((
  ...args: Parameters<Fn>
) => void) & {
  cancel: () => void;
  flush: () => void;
};

/** Debounce `callback` until `delay` ms after the last call. */
export function debounce<Fn extends (...args: never[]) => void>(
  callback: Fn,
  delay: number,
): Debounced<Fn>;
