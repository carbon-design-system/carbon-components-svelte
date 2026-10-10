// @ts-check

/**
 * One `ResizeObserver`, and one viewport `IntersectionObserver` per
 * `rootMargin` and `threshold`, shared by every caller.
 *
 * Sharing batches the work: the browser delivers every observed element's
 * entry in one callback, so components measure one after another without
 * a DOM write in between. With one observer per instance, each callback
 * ran in its own task step, Svelte flushed its update in between, and the
 * next instance's measurement forced a fresh layout.
 *
 * Observers are kept per constructor, so tests that stub
 * `globalThis.ResizeObserver` get an observer of the stubbed class.
 *
 * @typedef {(entry: any) => void} EntryCallback
 * @typedef {{
 *   observer: { observe(element: Element): void; unobserve(element: Element): void },
 *   callbacks: Map<Element, Set<EntryCallback>>,
 * }} SharedObserver
 */

/** @type {WeakMap<object, SharedObserver>} */
const resizeObservers = new WeakMap();

/** @type {WeakMap<object, Map<string, SharedObserver>>} */
const intersectionObservers = new WeakMap();

/**
 * Run every callback for each entry. A callback that throws doesn't stop
 * the rest; its error is reported once the batch is done.
 *
 * @param {Map<Element, Set<EntryCallback>>} callbacks
 * @param {ReadonlyArray<{ target: Element }>} entries
 */
function deliver(callbacks, entries) {
  /** @type {unknown[]} */
  const errors = [];
  for (const entry of entries) {
    const set = callbacks.get(entry.target);
    if (!set) continue;
    for (const callback of [...set]) {
      // Skip callbacks removed by an earlier callback in this batch.
      if (!set.has(callback)) continue;
      try {
        callback(entry);
      } catch (error) {
        errors.push(error);
      }
    }
  }
  for (const error of errors) {
    setTimeout(() => {
      throw error;
    });
  }
}

/**
 * Subscribe `callback` to `element` on a shared observer.
 *
 * @param {SharedObserver} shared
 * @param {Element} element
 * @param {EntryCallback} callback
 * @returns {() => void}
 */
function subscribe(shared, element, callback) {
  const { observer, callbacks } = shared;
  // A wrapper per call, so the same function subscribed twice stays two
  // subscriptions and each unsubscribe removes only its own.
  /** @type {EntryCallback} */
  const subscription = (entry) => callback(entry);
  let set = callbacks.get(element);
  if (set) {
    // Observing again queues a fresh initial entry, so the new subscriber
    // gets its first callback like it would from its own observer.
    observer.unobserve(element);
  } else {
    set = new Set();
    callbacks.set(element, set);
  }
  set.add(subscription);
  observer.observe(element);

  let active = true;
  return () => {
    if (!active) return;
    active = false;
    const current = callbacks.get(element);
    if (!current) return;
    current.delete(subscription);
    if (current.size === 0) {
      callbacks.delete(element);
      observer.unobserve(element);
    }
  };
}

/**
 * Call `callback` with the element's `ResizeObserverEntry` whenever its
 * size changes, and once after it is first observed. Every caller shares
 * one `ResizeObserver`. Returns an unsubscribe function; without
 * `ResizeObserver` (server rendering) it does nothing.
 *
 * @param {Element} element
 * @param {(entry: ResizeObserverEntry) => void} callback
 * @returns {() => void}
 * @example
 * ```js
 * const stop = observeResize(node, (entry) => {
 *   width = entry.contentRect.width;
 * });
 * ```
 */
export function observeResize(element, callback) {
  const Observer = globalThis.ResizeObserver;
  if (typeof Observer !== "function") return () => {};
  let shared = resizeObservers.get(Observer);
  if (!shared) {
    /** @type {Map<Element, Set<EntryCallback>>} */
    const callbacks = new Map();
    shared = {
      observer: new Observer((entries) => deliver(callbacks, entries)),
      callbacks,
    };
    resizeObservers.set(Observer, shared);
  }
  return subscribe(shared, element, callback);
}

/**
 * Call `callback` with the element's `IntersectionObserverEntry` whenever
 * it crosses `threshold` relative to the viewport grown by `rootMargin`,
 * and once after it is first observed. Callers with the same `rootMargin`
 * and `threshold` share one `IntersectionObserver`. Returns an unsubscribe
 * function; without `IntersectionObserver` it does nothing.
 *
 * `rootMargin` grows the viewport only. Inside a scroll container, such as
 * a modal body, the container's clipping still applies, so an element there
 * counts as near only once it scrolls into the container's view.
 *
 * @param {Element} element
 * @param {(entry: IntersectionObserverEntry) => void} callback
 * @param {{ rootMargin?: string; threshold?: number | number[] }} [options]
 * @returns {() => void}
 * @example
 * ```js
 * const stop = observeIntersection(
 *   node,
 *   (entry) => {
 *     if (entry.isIntersecting) visible = true;
 *   },
 *   { rootMargin: "600px" },
 * );
 * ```
 */
export function observeIntersection(element, callback, options = {}) {
  const Observer = globalThis.IntersectionObserver;
  if (typeof Observer !== "function") return () => {};
  const rootMargin = options.rootMargin ?? "0px";
  const threshold = options.threshold ?? 0;
  const key = `${rootMargin}|${threshold}`;
  let byKey = intersectionObservers.get(Observer);
  if (!byKey) {
    byKey = new Map();
    intersectionObservers.set(Observer, byKey);
  }
  let shared = byKey.get(key);
  if (!shared) {
    /** @type {Map<Element, Set<EntryCallback>>} */
    const callbacks = new Map();
    shared = {
      observer: new Observer((entries) => deliver(callbacks, entries), {
        rootMargin,
        threshold,
      }),
      callbacks,
    };
    byKey.set(key, shared);
  }
  return subscribe(shared, element, callback);
}
