export const CONSUMER_BOOM = "consumer boom";

export function isConsumerBoom(reason: unknown): reason is Error {
  return reason instanceof Error && reason.message === CONSUMER_BOOM;
}

/**
 * `tick().then(dispatch)` leaves consumer throws as unhandled rejections in
 * Vitest even when assertions pass. Prepend a listener before the update.
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

  return {
    wait,
    dispose() {
      process.off("unhandledRejection", handler);
    },
  };
}
