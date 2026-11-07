export interface History<S> {
  /** Call before a change. Captures the state before it, unless this change continues a run of the same `kind` that is still open. */
  record(kind: string, capture: () => S): void;
  /** Add a step of its own: the state before a command. */
  push(state: S): void;
  /** End the open run, so the next change starts a new step. */
  seal(): void;
  /** Returns the state to restore, after pushing the current one for redo. */
  undo(capture: () => S): S | undefined;
  redo(capture: () => S): S | undefined;
  clear(): void;
  canUndo(): boolean;
  canRedo(): boolean;
}

/** Undo history that groups typing and captures state only at group starts. */
export function createHistory<S>(options?: {
  limit?: number;
  delay?: number;
  now?: () => number;
}): History<S>;
