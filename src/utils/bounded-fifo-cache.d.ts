/**
 * A Map-like cache that evicts the oldest-inserted entry once `maxSize` is
 * reached. Eviction order is insertion order (FIFO) — a cache hit does not
 * bump an entry's recency, unlike an LRU cache.
 */
export class BoundedFifoCache<K, V> {
  constructor(maxSize: number);
  maxSize: number;
  map: Map<K, V>;
  get(key: K): V | undefined;
  set(key: K, value: V): void;
  get size(): number;
}
