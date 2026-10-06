/**
 * Hand out positions to children in the order they initialize. Svelte
 * initializes children in document order on the server and on the client,
 * so a child that claims a position from its own script body knows it
 * before it renders, unlike batched registration, which only flushes after
 * render (never on the server).
 *
 * Call `close()` from the parent's `onMount`; later claims return
 * `undefined` and the claimed items are dropped.
 */
export function createInitOrder<T>(): {
  claim: (item: T) => number | undefined;
  at: (index: number) => T | undefined;
  close: () => void;
};
