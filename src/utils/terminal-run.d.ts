/**
 * What a command handler may return: nothing, a string, or a stream of
 * strings or bytes (a generator, an array, a `fetch` body).
 */
export type TerminalOutput =
  | void
  | null
  | undefined
  | string
  | Iterable<string | Uint8Array>
  | AsyncIterable<string | Uint8Array>;

/** What `raceAbort` resolves to when the signal fires first. */
export const ABORTED: unique symbol;

/**
 * Wait for a promise, or for the signal to abort, whichever comes first. A
 * handler that ignores its signal and never settles cannot hold the terminal.
 */
export function raceAbort<T>(
  promise: Promise<T>,
  signal: AbortSignal,
): Promise<T | typeof ABORTED>;

/**
 * Write what a handler returned. A string is written as it is. A stream is
 * written chunk by chunk, and the loop gives the page a turn every
 * `sliceMs`, so a stream that never waits cannot freeze the page or keep a
 * cancel from landing.
 */
export function pipeOutput(
  result: TerminalOutput,
  options: {
    signal: AbortSignal;
    write: (text: string) => void;
    sliceMs?: number;
  },
): Promise<void>;
