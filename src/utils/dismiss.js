// @ts-check

/**
 * One `window` listener per `(type, options)`. Handlers register as consumers;
 * the first consumer calls `addEventListener`, the last calls `removeEventListener`.
 *
 * @typedef {{ handler: (event: Event) => void }} Consumer
 * @typedef {{
 *   type: string,
 *   options: boolean | AddEventListenerOptions | undefined,
 *   listener: (event: Event) => void,
 *   consumers: Set<Consumer>,
 * }} Pool
 *
 * @type {Map<string, Pool>}
 */
const pools = new Map();

/**
 * Pool key from type plus `capture`, `passive`, and `once`. Those are the only
 * options that change how the listener runs.
 *
 * @param {string} type
 * @param {boolean | AddEventListenerOptions | undefined} options
 * @returns {string}
 */
function poolKey(type, options) {
  let capture = false;
  let passive = false;
  let once = false;
  if (typeof options === "boolean") {
    capture = options;
  } else if (options) {
    capture = !!options.capture;
    passive = !!options.passive;
    once = !!options.once;
  }
  return `${type} ${capture ? 1 : 0}${passive ? 1 : 0}${once ? 1 : 0}`;
}

/**
 * Add a consumer to the pool for `(type, options)`. Creates the pool on first use.
 *
 * @param {{ type: string, handler: (event: Event) => void, options: boolean | AddEventListenerOptions | undefined }} spec
 * @returns {{ key: string, pool: Pool, consumer: Consumer }}
 */
function registerConsumer(spec) {
  const key = poolKey(spec.type, spec.options);
  let pool = pools.get(key);
  if (!pool) {
    const consumers = /** @type {Set<Consumer>} */ (new Set());
    const listener = (/** @type {Event} */ event) => {
      // Copy before iterating. Handlers may add or remove consumers mid-dispatch;
      // removed consumers should not run, same as native listeners.
      for (const consumer of [...consumers]) {
        if (consumers.has(consumer)) consumer.handler(event);
      }
    };
    pool = { type: spec.type, options: spec.options, listener, consumers };
    pools.set(key, pool);
    window.addEventListener(spec.type, listener, spec.options);
  }
  const consumer = { handler: spec.handler };
  pool.consumers.add(consumer);
  return { key, pool, consumer };
}

/**
 * Remove a consumer. Drops the window listener when the pool is empty.
 *
 * @param {{ key: string, pool: Pool, consumer: Consumer }} entry
 */
function unregisterConsumer({ key, pool, consumer }) {
  pool.consumers.delete(consumer);
  if (pool.consumers.size === 0) {
    window.removeEventListener(pool.type, pool.listener, pool.options);
    pools.delete(key);
  }
}

/**
 * Svelte action: `window` listeners while `enabled` is true.
 * Controls with the same `(type, options)` share one listener.
 * Handler updates in place without re-registering. SSR-safe.
 *
 * @param {unknown} _node Host element (unused; listeners attach to `window`).
 * @param {import("./dismiss.js").DismissParams} params
 * @returns {{ update: (params: import("./dismiss.js").DismissParams) => void, destroy: () => void }}
 */
export function dismiss(_node, params) {
  let specs = normalize(params);
  let enabled = !!params.enabled;

  /**
   * @type {Array<{ key: string, pool: Pool, consumer: Consumer }>}
   */
  let registered = [];

  function add() {
    if (typeof window === "undefined") return;
    registered = specs.map((spec) => registerConsumer(spec));
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
      remove();
    },
  };
}

/**
 * @param {import("./dismiss.js").DismissParams} params
 * @returns {Array<{ type: string, handler: (event: Event) => void, options: boolean | AddEventListenerOptions | undefined }>}
 */
function normalize(params) {
  if (params.listeners) {
    return params.listeners.map((l) => ({
      type: l.type,
      handler: l.handler,
      options: l.options,
    }));
  }
  const types = Array.isArray(params.type)
    ? params.type
    : params.type == null
      ? []
      : [params.type];
  return types.map((type) => ({
    type,
    handler: /** @type {(event: Event) => void} */ (params.handler),
    options: params.options,
  }));
}
