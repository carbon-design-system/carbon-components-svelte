import type { Readable } from "svelte/store";
import type { AutosaveStatus } from "./autosave-state.js";

export type { AutosaveStatus };

export type AutosaveRetryOptions = {
  /**
   * Tries after the first failure.
   * @default 3
   */
  count?: number;
  /**
   * Milliseconds before the first retry.
   * @default 1000
   */
  delay?: number;
  /**
   * Each retry waits this many times longer.
   * @default 2
   */
  factor?: number;
  /**
   * Longest wait in milliseconds.
   * @default 30000
   */
  max?: number;
  /**
   * Return `false` to give up on this error at once, such as for a
   * validation failure that another try cannot fix.
   */
  when?: (error: unknown, attempt: number) => boolean;
};

export type AutosaveOptions<T = unknown> = {
  /**
   * Quiet time in milliseconds before a save.
   * @default 1000
   */
  debounce?: number;
  /**
   * The longest an edit waits, so typing that never pauses still saves.
   * `0` removes the limit.
   * @default 10000
   */
  maxWait?: number;
  /**
   * Retries after a failed save. A number is the `count`; `false` turns
   * retries off.
   */
  retry?: number | boolean | AutosaveRetryOptions;
  /**
   * Ask before the page closes while changes are unsaved.
   * @default true
   */
  beforeUnload?: boolean;
  /**
   * Follow the browser's `online` and `offline` events. Set `false` to drive
   * it with `setOnline`.
   * @default true
   */
  offline?: boolean;
  /**
   * The value as loaded. With it, an edit that equals the last saved value
   * is no edit: nothing is saved and the status stays put. That makes
   * `$: autosave.change(values)` safe on mount, and leaves a form clean when
   * a change is typed back. Values are compared by content, so pass a new
   * object for each edit.
   */
  initial?: T;
  /** When the loaded value was last saved. Shows `saved` instead of `idle`. */
  savedAt?: number;
};

export type AutosaveContext = {
  /** Aborts when the autosave is destroyed. */
  signal: AbortSignal;
  /** Counts from 1, and from 1 again after Retry. */
  attempt: number;
};

export type AutosaveView = {
  status: AutosaveStatus;
  /** A value no save has confirmed. */
  dirty: boolean;
  /** A request is in flight. */
  saving: boolean;
  /** A failed save waits to be tried again. */
  retrying: boolean;
  online: boolean;
  /** When a save last succeeded. */
  savedAt: number | undefined;
  /** Why the save failed, while `status` is `"error"`. */
  error: unknown;
  /** Failed attempts so far. */
  attempts: number;
};

export type Autosave<T = unknown> = Readable<AutosaveView> & {
  /** Record an edit. The latest value wins. */
  change: (value?: T) => void;
  /**
   * Save now instead of waiting for the debounce. Resolves `true` once
   * everything is saved, `false` when a save fails, the network is down, or
   * the autosave is destroyed or reset.
   */
  flush: () => Promise<boolean>;
  /** Try again now, without waiting for the backoff. */
  retry: () => void;
  /**
   * Take the current value as saved and forget any failure. Pass the loaded
   * value to compare later edits against it, as `initial` does.
   */
  reset: (loaded?: T) => void;
  /** Tell it the network is up or down. */
  setOnline: (online: boolean) => void;
  /** Stop the timers and listeners. */
  destroy: () => void;
};

/**
 * Drives a save for a form or an editor that saves as you go: debounced,
 * with a `maxWait`, one save at a time with only the latest value kept,
 * retried with backoff, paused offline, and guarded by `beforeunload`.
 */
export function createAutosave<T = unknown>(
  save: (value: T, context: AutosaveContext) => unknown,
  options?: AutosaveOptions<T>,
): Autosave<T>;
