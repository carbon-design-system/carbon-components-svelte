export type SampleWindowOptions<T> = {
  /** How many samples the queue needs at most; older ones are dropped unseen. */
  capacity(): number | undefined;
  /** Receives every sample queued since the last flush, once per frame. */
  onFlush(batch: T[]): void;
};

export type SampleWindow<T> = {
  /** Queue samples; they are flushed on the next animation frame. */
  push(samples: ReadonlyArray<T>): void;
  /** Hold flushes while `true`; the queue flushes when set back. */
  pause(paused: boolean): void;
  /** Start listening for frames and tab visibility. Returns the cleanup. */
  mount(): () => void;
};

/**
 * A queue for samples that arrive faster than a chart should redraw: many
 * in one frame draw once, nothing draws in a hidden tab, and before mount
 * a flush is synchronous.
 */
export function createSampleWindow<T>(
  options: SampleWindowOptions<T>,
): SampleWindow<T>;

/**
 * The rows plus the new ones, keeping only the last `max`: the reassign
 * idiom for a sliding window, `data = appendWindow(data, rows, 500)`.
 */
export function appendWindow<T>(
  rows: ReadonlyArray<T>,
  incoming: ReadonlyArray<T>,
  max?: number,
): T[];
