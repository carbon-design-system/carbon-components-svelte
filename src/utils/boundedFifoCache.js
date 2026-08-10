// @ts-check

/**
 * A Map-like cache that evicts the oldest-inserted entry once `maxSize` is
 * reached. Eviction order is insertion order (FIFO) — a cache hit does not
 * bump an entry's recency, unlike an LRU cache.
 * @template K
 * @template V
 */
export class BoundedFifoCache {
  /** @param {number} maxSize */
  constructor(maxSize) {
    this.maxSize = maxSize;
    /** @type {Map<K, V>} */
    this.map = new Map();
  }

  /**
   * @param {K} key
   * @returns {V | undefined}
   */
  get(key) {
    return this.map.get(key);
  }

  /**
   * @param {K} key
   * @param {V} value
   */
  set(key, value) {
    if (this.map.size >= this.maxSize && !this.map.has(key)) {
      const oldestKey = this.map.keys().next().value;
      if (oldestKey !== undefined) {
        this.map.delete(oldestKey);
      }
    }
    this.map.set(key, value);
  }

  get size() {
    return this.map.size;
  }
}

export default BoundedFifoCache;
