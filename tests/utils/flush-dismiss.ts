import { tick } from "svelte";

/**
 * `use:dismiss` defers its window listener registration by a macrotask, so
 * that enabling it (e.g. via a click) doesn't register the listener in time
 * to catch that same click as it bubbles. Wait a tick for the `enabled`
 * change to reach the action's `update()`, then a macrotask for the
 * deferred registration to run, before dispatching events the listener
 * should catch.
 */
export const flushDismiss = async () => {
  await tick();
  await new Promise((resolve) => setTimeout(resolve));
};
