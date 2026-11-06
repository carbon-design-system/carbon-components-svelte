import type { Readable } from "svelte/store";

export interface HistoryCommand {
  /** Apply the change. `push` does not call it, since the change has already happened. */
  do: () => void;
  /** Take the change back. */
  undo: () => void;
  /** Names the step: "move tab" for "Undo move tab". */
  label?: string;
  /**
   * Steps with the same key that arrive within `coalesceMs` fold into one
   * step, keeping the first `undo` and the last `do`. Use it for absolute
   * commands ("set x to 40") such as a drag, a scrub or typing.
   */
  key?: string;
  /** Overrides `coalesceMs` for this step. */
  coalesceMs?: number;
  /** Approximate size of the step, counted against `maxCost`. */
  cost?: number;
}

export interface HistoryOptions {
  /**
   * The most steps kept. The oldest is dropped past it.
   * @default 100
   */
  limit?: number;
  /**
   * The most total `cost` kept (the newest step always stays).
   * @default Infinity
   */
  maxCost?: number;
  /**
   * The window in milliseconds in which keyed steps fold into one. It slides:
   * every folded step restarts it. Use `Infinity` to fold until `seal()`.
   * @default 500
   */
  coalesceMs?: number;
  /** The clock, for tests. */
  now?: () => number;
  /**
   * Called with a message after every undo and redo. Pass a live-region
   * announcer: `(message) => announce(message, { channel: "history" })`.
   */
  announce?: (message: string) => void;
  /** The message after an undo. Defaults to "Undid {label}". */
  undoneText?: (label: string | undefined) => string;
  /** The message after a redo. Defaults to "Redid {label}". */
  redoneText?: (label: string | undefined) => string;
}

export interface SnapshotMeta {
  label?: string;
  key?: string;
  coalesceMs?: number;
  cost?: number;
}

export interface SnapshotOptions<S> {
  /** The state the history starts from. */
  initial: S;
  /** Put a state back. Called by undo and redo. */
  apply: (state: S) => void;
  /** Whether two states are the same. A `record` of an equal state is skipped. Defaults to `Object.is`. */
  equals?: (a: S, b: S) => boolean;
  /** Read the live state. Needed for `checkpoint`. */
  capture?: () => S;
  /** Approximate size of a state, counted against `maxCost`. */
  cost?: (state: S) => number;
}

export interface Snapshots<S> {
  /** The state the history thinks is live. */
  readonly current: S;
  /**
   * Record the state after a change. Treat states as immutable and share
   * what did not change, so a step costs only what moved. Returns `false`
   * when `next` equals the current state, or while an undo is applying.
   */
  record: (next: S, meta?: SnapshotMeta) => boolean;
  /**
   * Call before a change, with `capture` set. Reads the state only when a
   * step starts, so a burst of keyed calls costs a timestamp check each.
   * Redo reads the state again when you undo.
   */
  checkpoint: (meta?: SnapshotMeta) => boolean;
  /** Set the current state without a step, such as after loading. */
  reset: (state: S) => void;
}

export interface History {
  /** Whether `undo()` has a step. */
  canUndo: Readable<boolean>;
  /** Whether `redo()` has a step. */
  canRedo: Readable<boolean>;
  /** The label of the step `undo()` takes back: "Undo {$undoLabel}". */
  undoLabel: Readable<string | undefined>;
  /** The label of the step `redo()` puts back. */
  redoLabel: Readable<string | undefined>;
  /**
   * Record a change that has already happened. Drops the redo steps.
   * Returns `false` while an undo is applying.
   */
  push: (command: HistoryCommand) => boolean;
  /** Call `command.do()`, then record it. */
  run: (command: HistoryCommand) => boolean;
  /**
   * Whether `key` continues the open step (and keeps its window open),
   * without recording anything.
   */
  extend: (key: string | undefined, coalesceMs?: number) => boolean;
  /** End the open step, so the next keyed push starts a new one. */
  seal: () => void;
  /** Start a group of steps that commit as one. Groups nest. */
  begin: (label?: string) => void;
  /** End the innermost group as one step. Returns `false` when it was empty. */
  commit: (label?: string) => boolean;
  /** End the innermost group and undo what it recorded. Nothing is kept. */
  cancel: () => boolean;
  /** Run `fn` in a group: commit when it returns, cancel when it throws. */
  transaction: <T>(label: string | undefined, fn: () => T) => T;
  /** Take back the last step. Returns `false` when there is none or a group is open. */
  undo: () => boolean;
  /** Put back the last undone step. */
  redo: () => boolean;
  /** Drop every step, and any open group. */
  clear: () => void;
  /**
   * A state-snapshot view of this history. Its steps share the timeline
   * with commands.
   */
  snapshots: <S>(options: SnapshotOptions<S>) => Snapshots<S>;
}

/**
 * Create an undo and redo history of commands and snapshots. SSR-safe.
 */
export function createHistory(options?: HistoryOptions): History;
