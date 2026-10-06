// @ts-check

/**
 * Hand out positions to children in the order they initialize. Svelte
 * initializes children in document order on the server and on the client,
 * so a child that claims a position from its own script body knows it
 * before it renders. Batched registration only flushes after render (never
 * on the server), so claims let the first render, server included, show
 * state that depends on a child's position, such as which tab is selected.
 *
 * Call `close()` from the parent's `onMount`. Children added after that may
 * land anywhere in the list, so `claim()` returns `undefined` for them and
 * they should wait for registration instead. `close()` also drops the
 * claimed items.
 *
 * @template T
 * @returns {{
 *   claim: (item: T) => number | undefined,
 *   at: (index: number) => T | undefined,
 *   close: () => void,
 * }}
 */
export function createInitOrder() {
  /** @type {T[]} */
  let items = [];
  let closed = false;

  /** @param {T} item */
  function claim(item) {
    if (closed) return undefined;
    items.push(item);
    return items.length - 1;
  }

  /** @param {number} index */
  function at(index) {
    return items[index];
  }

  function close() {
    closed = true;
    items = [];
  }

  return { claim, at, close };
}
