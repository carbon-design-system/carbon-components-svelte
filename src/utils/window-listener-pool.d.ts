/** A single consumer of a pooled `window` listener. */
export interface Consumer {
  handler: (event: Event) => void;
}

/** A pooled `window` listener shared by one or more consumers. */
export interface Pool {
  type: string;
  options: boolean | AddEventListenerOptions | undefined;
  listener: (event: Event) => void;
  consumers: Set<Consumer>;
}

/** Pool key from `type` plus the `capture`/`passive`/`once` options. */
export function poolKey(
  type: string,
  options: boolean | AddEventListenerOptions | undefined,
): string;

/** Add a consumer to the pool for `(type, options)`. Creates the pool on first use. */
export function registerConsumer(spec: {
  type: string;
  handler: (event: Event) => void;
  options: boolean | AddEventListenerOptions | undefined;
}): { key: string; pool: Pool; consumer: Consumer };

/** Remove a consumer. Drops the window listener when the pool is empty. */
export function unregisterConsumer(entry: {
  key: string;
  pool: Pool;
  consumer: Consumer;
}): void;

/**
 * Add a pooled `window` listener, registered immediately (no deferral).
 * Consumers sharing the same `(type, options)` share one real
 * `addEventListener` call; the underlying listener is removed once the last
 * consumer unregisters.
 */
export function addPooledListener(
  type: string,
  handler: (event: Event) => void,
  options?: boolean | AddEventListenerOptions,
): () => void;
