// @ts-check

/**
 * One `setInterval` per refresh cadence. Live `RelativeTime` instances
 * subscribe; the first consumer starts the interval, the last clears it.
 *
 * While `document.hidden` is true, every bucket's interval is cleared
 * instead of firing in the background. When the document becomes visible
 * again, each bucket's consumers are notified once immediately — so a
 * `RelativeTime` that was stale for minutes (or, at the 1-hour cadence,
 * up to an hour) resyncs right away instead of waiting for the next
 * scheduled tick — then the interval restarts. A single shared
 * `visibilitychange` listener is attached only while at least one bucket
 * exists, and removed once the last one is gone.
 *
 * @typedef {{ callback: () => void }} Consumer
 * @typedef {{
 *   refreshMs: number,
 *   intervalId: ReturnType<typeof setInterval> | undefined,
 *   consumers: Set<Consumer>,
 * }} Bucket
 *
 * @type {Map<number, Bucket>}
 */
const buckets = new Map();

let visibilityListening = false;

/** @param {Bucket} bucket */
function fireBucket(bucket) {
  for (const consumer of [...bucket.consumers]) {
    if (bucket.consumers.has(consumer)) consumer.callback();
  }
}

/** @param {Bucket} bucket */
function startBucket(bucket) {
  clearInterval(bucket.intervalId);
  bucket.intervalId = setInterval(() => fireBucket(bucket), bucket.refreshMs);
}

function handleVisibilityChange() {
  if (typeof document === "undefined") return;

  if (document.hidden) {
    for (const bucket of buckets.values()) {
      clearInterval(bucket.intervalId);
      bucket.intervalId = undefined;
    }
    return;
  }

  for (const bucket of buckets.values()) {
    // Resync immediately: the interval was cleared while hidden, so every
    // consumer may be showing a tick from before the tab was backgrounded.
    fireBucket(bucket);
    startBucket(bucket);
  }
}

function ensureVisibilityListener() {
  if (visibilityListening || typeof document === "undefined") return;
  visibilityListening = true;
  document.addEventListener("visibilitychange", handleVisibilityChange);
}

function releaseVisibilityListenerIfIdle() {
  if (!visibilityListening || buckets.size > 0) return;
  visibilityListening = false;
  document.removeEventListener("visibilitychange", handleVisibilityChange);
}

/**
 * Subscribe `callback` to the shared interval for `refreshMs`.
 * SSR-unsafe: call only where `window` exists.
 *
 * @param {number} refreshMs
 * @param {() => void} callback
 * @returns {() => void} Call to unsubscribe.
 */
export function subscribeRelativeTimeTick(refreshMs, callback) {
  let bucket = buckets.get(refreshMs);
  if (!bucket) {
    bucket = {
      refreshMs,
      intervalId: undefined,
      consumers: /** @type {Set<Consumer>} */ (new Set()),
    };
    buckets.set(refreshMs, bucket);
    ensureVisibilityListener();
    const hidden = typeof document !== "undefined" && document.hidden;
    if (!hidden) startBucket(bucket);
  }
  const consumer = { callback };
  bucket.consumers.add(consumer);
  return () => {
    bucket.consumers.delete(consumer);
    if (bucket.consumers.size === 0 && buckets.get(refreshMs) === bucket) {
      clearInterval(bucket.intervalId);
      buckets.delete(refreshMs);
      releaseVisibilityListenerIfIdle();
    }
  };
}
