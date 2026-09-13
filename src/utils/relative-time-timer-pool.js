// @ts-check

/**
 * One `setInterval` per refresh cadence. Live `RelativeTime` instances
 * subscribe; the first consumer starts the interval, the last clears it.
 *
 * @typedef {{ callback: () => void }} Consumer
 * @typedef {{
 *   refreshMs: number,
 *   intervalId: ReturnType<typeof setInterval>,
 *   consumers: Set<Consumer>,
 * }} Bucket
 *
 * @type {Map<number, Bucket>}
 */
const buckets = new Map();

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
    const consumers = /** @type {Set<Consumer>} */ (new Set());
    const intervalId = setInterval(() => {
      for (const consumer of [...consumers]) {
        if (consumers.has(consumer)) consumer.callback();
      }
    }, refreshMs);
    bucket = { refreshMs, intervalId, consumers };
    buckets.set(refreshMs, bucket);
  }
  const consumer = { callback };
  bucket.consumers.add(consumer);
  return () => {
    bucket.consumers.delete(consumer);
    if (bucket.consumers.size === 0 && buckets.get(refreshMs) === bucket) {
      clearInterval(bucket.intervalId);
      buckets.delete(refreshMs);
    }
  };
}
