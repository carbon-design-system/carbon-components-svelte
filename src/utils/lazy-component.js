// @ts-check
import { writable } from "svelte/store";

/**
 * A component that loads on first use, in the browser only, for parts most
 * pages never show, such as a popup that renders only once opened. The
 * store holds `null` until the component has loaded. Create one at module
 * level, so it loads once for every instance.
 *
 * Only lazy-load what renders after an interaction. Markup shown because
 * of a prop must render on the server, so it can't wait for a chunk.
 *
 * @template T
 * @param {() => Promise<{ default: T }>} loader
 * @returns {import("svelte/store").Readable<T | null> & { load(): void }}
 */
export function lazyComponent(loader) {
  /** @type {import("svelte/store").Writable<T | null>} */
  const component = writable(null);
  /** @type {undefined | Promise<void>} */
  let pending;
  return {
    subscribe: component.subscribe,
    load() {
      if (pending || typeof window === "undefined") return;
      pending = loader().then(
        (module) => component.set(module.default),
        // A chunk that fails to load, offline or after a deploy, leaves
        // the store empty. The next `load()` tries again.
        () => {
          pending = undefined;
        },
      );
    },
  };
}
