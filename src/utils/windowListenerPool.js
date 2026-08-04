// @ts-check

/**
 * One `window` listener per `(type, options)`. Callers register as consumers;
 * the first consumer calls `addEventListener`, the last calls
 * `removeEventListener`. Shared by the `dismiss` action (outside-click/escape)
 * and any other code that wants a `window` listener without adding one per
 * component instance (e.g. `FloatingPortal`'s scroll/resize reposition).
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
export function poolKey(type, options) {
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
export function registerConsumer(spec) {
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
export function unregisterConsumer({ key, pool, consumer }) {
  pool.consumers.delete(consumer);
  if (pool.consumers.size === 0) {
    window.removeEventListener(pool.type, pool.listener, pool.options);
    pools.delete(key);
  }
}

/**
 * Add a pooled `window` listener, registered immediately (no deferral).
 * Consumers sharing the same `(type, options)` share one real
 * `addEventListener` call; the underlying listener is removed once the last
 * consumer unregisters. SSR-unsafe: call only where `window` exists.
 *
 * @param {string} type
 * @param {(event: Event) => void} handler
 * @param {boolean | AddEventListenerOptions} [options]
 * @returns {() => void} Call to unregister.
 */
export function addPooledListener(type, handler, options) {
  const entry = registerConsumer({ type, handler, options });
  return () => unregisterConsumer(entry);
}
