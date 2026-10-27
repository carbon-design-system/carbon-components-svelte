// @ts-check
import { writable } from "svelte/store";

/**
 * The tearsheets that are open, oldest first.
 *
 * Module state is shared by every request on a server, so a component
 * writes here only from `onMount`, which a server render never runs. A
 * server renders every tearsheet as a lone one, and the first client render
 * matches it.
 *
 * @type {import("svelte/store").Writable<symbol[]>}
 */
const openTearsheets = writable([]);

/** How many tearsheets show as a stack. Older ones share the last level. */
export const MAX_STACK_DEPTH = 3;

let warned = false;

/** Subscribe to the open tearsheets, oldest first. */
export const tearsheetStack = { subscribe: openTearsheets.subscribe };

/**
 * Add a tearsheet to the top of the stack, if it is not in it.
 * @param {symbol} key
 */
export function joinStack(key) {
  openTearsheets.update((list) => {
    if (list.includes(key)) return list;
    const next = [...list, key];
    if (next.length > MAX_STACK_DEPTH && !warned) {
      warned = true;
      console.warn(
        `[Tearsheet.svelte] more than ${MAX_STACK_DEPTH} tearsheets are open; the oldest share the last level of the stack.`,
      );
    }
    return next;
  });
}

/**
 * Remove a tearsheet from the stack, wherever it is.
 * @param {symbol} key
 */
export function leaveStack(key) {
  openTearsheets.update((list) =>
    list.includes(key) ? list.filter((item) => item !== key) : list,
  );
}

/**
 * Where a tearsheet sits in the stack. `level` is how many open tearsheets
 * are above it, up to the last level. `stacked` is set for the top
 * tearsheet when others are open beneath it.
 *
 * @param {symbol[]} list
 * @param {symbol} key
 * @returns {{ level: 0 | 1 | 2, stacked: boolean }}
 */
export function stackPosition(list, key) {
  const index = list.indexOf(key);
  if (index === -1) return { level: 0, stacked: false };
  const above = list.length - 1 - index;
  return {
    level: /** @type {0 | 1 | 2} */ (Math.min(above, MAX_STACK_DEPTH - 1)),
    stacked: above === 0 && list.length > 1,
  };
}
