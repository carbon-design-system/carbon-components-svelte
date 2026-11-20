// @ts-check
// Run a command handler's result into a terminal, and let it be cancelled.

/**
 * What a command handler may return: nothing, a string, or a stream of
 * strings or bytes (a generator, an array, a `fetch` body).
 * @typedef {void | null | undefined | string | Iterable<string | Uint8Array> | AsyncIterable<string | Uint8Array>} TerminalOutput
 */

/** What `raceAbort` resolves to when the signal fires first. */
export const ABORTED = Symbol("aborted");

/**
 * Wait for a promise, or for the signal to abort, whichever comes first. A
 * handler that ignores its signal and never settles cannot hold the terminal.
 *
 * @template T
 * @param {Promise<T>} promise
 * @param {AbortSignal} signal
 * @returns {Promise<T | typeof ABORTED>}
 */
export function raceAbort(promise, signal) {
  if (signal.aborted) return Promise.resolve(ABORTED);
  return new Promise((resolve, reject) => {
    const onAbort = () => resolve(ABORTED);
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener("abort", onAbort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener("abort", onAbort);
        reject(error);
      },
    );
  });
}

/** @returns {Promise<void>} */
function nextTask() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Write what a handler returned. A string is written as it is. A stream is
 * written chunk by chunk, and the loop gives the page a turn every
 * `sliceMs`, so a stream that never waits cannot freeze the page or keep a
 * cancel from landing.
 *
 * @param {TerminalOutput} result
 * @param {Object} options
 * @param {AbortSignal} options.signal
 * @param {(text: string) => void} options.write
 * @param {number} [options.sliceMs=8]
 * @returns {Promise<void>}
 */
export async function pipeOutput(result, { signal, write, sliceMs = 8 }) {
  if (result === null || result === undefined) return;
  if (typeof result === "string") {
    write(result);
    return;
  }

  /** @type {TextDecoder | undefined} */
  let decoder;
  /** @param {unknown} chunk */
  const put = (chunk) => {
    if (chunk instanceof Uint8Array) {
      decoder ??= new TextDecoder();
      write(decoder.decode(chunk, { stream: true }));
    } else {
      write(String(chunk));
    }
  };

  let sliceStart = performance.now();
  const takeTurn = async () => {
    if (performance.now() - sliceStart < sliceMs) return;
    await nextTask();
    sliceStart = performance.now();
  };

  const asyncIterable = /** @type {AsyncIterable<string | Uint8Array>} */ (
    result
  );
  const iterable = /** @type {Iterable<string | Uint8Array>} */ (result);

  if (typeof asyncIterable[Symbol.asyncIterator] === "function") {
    const iterator = asyncIterable[Symbol.asyncIterator]();
    try {
      for (;;) {
        // eslint-disable-next-line no-await-in-loop -- one chunk at a time
        const step = await raceAbort(iterator.next(), signal);
        if (step === ABORTED || step.done) break;
        put(step.value);
        // eslint-disable-next-line no-await-in-loop -- the stream waits its turn
        await takeTurn();
      }
    } finally {
      if (signal.aborted) {
        Promise.resolve(iterator.return?.()).catch(() => {});
      }
    }
  } else if (typeof iterable[Symbol.iterator] === "function") {
    for (const chunk of iterable) {
      if (signal.aborted) break;
      put(chunk);
      // eslint-disable-next-line no-await-in-loop -- the stream waits its turn
      await takeTurn();
    }
  } else {
    write(String(result));
  }
}
