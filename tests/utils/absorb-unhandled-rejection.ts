export const CONSUMER_BOOM = "consumer boom";

export function isConsumerBoom(reason: unknown): reason is Error {
  return reason instanceof Error && reason.message === CONSUMER_BOOM;
}

/**
 * A throw out of a consumer's dispatch handler can escape as either an
 * `unhandledRejection` (e.g. `tick().then(dispatch)`, or Svelte 3/4's own
 * internal `resolved_promise.then(flush)` scheduler, which is fire-and-forget)
 * or a synchronous `uncaughtException` (observed for Svelte 5's scheduler),
 * depending on framework version and call path. Prepend a listener for both
 * before the update.
 */
export function absorbUnhandledRejection(
  predicate: (reason: unknown) => boolean,
): { wait: Promise<void>; dispose: () => void } {
  let settled = false;
  let resolve!: () => void;
  const wait = new Promise<void>((resolveWait) => {
    resolve = () => {
      if (settled) return;
      settled = true;
      resolveWait();
    };
  });

  const handler = (reason: unknown) => {
    if (predicate(reason)) {
      resolve();
    }
  };

  process.prependListener("unhandledRejection", handler);
  process.prependListener("uncaughtException", handler);

  return {
    wait,
    dispose() {
      process.off("unhandledRejection", handler);
      process.off("uncaughtException", handler);
    },
  };
}

/**
 * Yields to a real macrotask so Node's rejection-tracking check (which runs
 * after the current tick) has a chance to fire before a listener is torn
 * down. Framework versions that resolve the throw synchronously never emit
 * anything for this to catch, so callers should race this against `wait`
 * rather than awaiting `wait` unconditionally.
 */
export function flushRejectionQueue(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}
