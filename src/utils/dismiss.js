// @ts-check

import {
  poolKey,
  registerConsumer,
  unregisterConsumer,
} from "./window-listener-pool.js";

/**
 * @typedef {{ handler: (event: Event) => void }} Consumer
 * @typedef {import("./window-listener-pool.js").Pool} Pool
 */

/**
 * Svelte action: `window` listeners while `enabled` is true.
 * Controls with the same `(type, options)` share one listener.
 * Handler updates in place without re-registering. SSR-safe.
 *
 * @param {unknown} _node Host element (unused; listeners attach to `window`).
 * @param {import("./dismiss.js").DismissParams} options
 * @returns {{ update: (options: import("./dismiss.js").DismissParams) => void, destroy: () => void }}
 */
export function dismiss(_node, options) {
  let specs = normalize(options);
  let enabled = !!options.enabled;
  let destroyed = false;
  let addScheduled = false;

  /**
   * @type {Array<{ key: string, pool: Pool, consumer: Consumer }>}
   */
  let registered = [];

  function add() {
    if (typeof window === "undefined" || addScheduled) return;
    addScheduled = true;
    // Defer registration to the next task (not just a microtask). Enabling
    // synchronously within a click (e.g. a button outside the anchor setting
    // `open` to true) would otherwise register the window listener while
    // that SAME click is still bubbling — heavy synchronous DOM work in the
    // handler (mounting a portal, positioning it) can delay the event's
    // arrival at `window` past any microtask flush, so only a macrotask
    // defer reliably waits for the current dispatch to finish. Re-checks
    // `enabled`/`destroyed` since either may have changed by the time this
    // runs.
    setTimeout(() => {
      addScheduled = false;
      if (destroyed || !enabled) return;
      registered = specs.map((spec) => registerConsumer(spec));
    });
  }

  function remove() {
    for (const entry of registered) unregisterConsumer(entry);
    registered = [];
  }

  if (enabled) add();

  return {
    /** @param {import("./dismiss.js").DismissParams} next */
    update(next) {
      const nextSpecs = normalize(next);
      const nextEnabled = !!next.enabled;
      const sameShape =
        registered.length === nextSpecs.length &&
        nextSpecs.every(
          (s, i) =>
            registered[i] && registered[i].key === poolKey(s.type, s.options),
        );

      if (enabled && nextEnabled && sameShape) {
        nextSpecs.forEach((s, i) => {
          registered[i].consumer.handler = s.handler;
        });
        specs = nextSpecs;
        return;
      }

      remove();
      specs = nextSpecs;
      enabled = nextEnabled;
      if (enabled) add();
    },
    destroy() {
      destroyed = true;
      remove();
    },
  };
}

/**
 * @param {import("./dismiss.js").DismissParams} options
 * @returns {Array<{ type: string, handler: (event: Event) => void, options: boolean | AddEventListenerOptions | undefined }>}
 */
function normalize(options) {
  if (options.listeners) {
    return options.listeners.map((l) => ({
      type: l.type,
      handler: l.handler,
      options: l.options,
    }));
  }
  const types = Array.isArray(options.type)
    ? options.type
    : options.type == null
      ? []
      : [options.type];
  return types.map((type) => ({
    type,
    handler: /** @type {(event: Event) => void} */ (options.handler),
    options: options.options,
  }));
}
