/**
 * Waits one macrotask, letting a pending timer, resize/debounce handler, or
 * outside-click listener run before assertions. Svelte's own microtask-batched
 * updates (from a reactive prop write, for example) are also settled by the
 * time this resolves, since microtasks drain before the next macrotask.
 */
export const flushMacrotask = () =>
  new Promise((resolve) => setTimeout(resolve, 0));
