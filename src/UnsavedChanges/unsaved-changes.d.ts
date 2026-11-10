import type { Readable } from "svelte/store";

/** A pending `guard()` waiting for the user's answer. */
export interface UnsavedChangesRequest {
  /** `true` discards the changes. */
  resolve: (discard: boolean) => void;
}

export interface UnsavedChangesOptions {
  /**
   * Show the browser's leave-page prompt while a source is dirty.
   * @default true
   */
  beforeUnload?: boolean;
}

export interface UnsavedChangesStore {
  /** `true` while any source is dirty. */
  dirty: Readable<boolean>;
  /** Number of dirty sources. */
  count: Readable<number>;
  /** The pending request, for `UnsavedChangesPrompt`. */
  prompt: Readable<UnsavedChangesRequest | null>;
  /** Mark a source dirty or clean. Use it from `$:` in stateful widgets. */
  set: (id: string, dirty: boolean) => void;
  /** Remove a source. */
  clear: (id: string) => void;
  /** Mark every source clean without re-baselining forms. */
  reset: () => void;
  /**
   * Mark every source clean and re-baseline tracked forms. Call after a
   * successful save, or after async data finishes loading into the form.
   */
  markSaved: () => void;
  /** Run `listener` on `markSaved()`. Returns an unsubscribe function. */
  onSaved: (listener: () => void) => () => void;
  /**
   * Resolve `true` when it is safe to leave: the store is clean, or the user
   * agreed to discard. Dirty stores ask `ask`, else a mounted
   * `UnsavedChangesPrompt`, else `window.confirm`. Approval calls `reset()`.
   * Concurrent calls share one answer.
   */
  guard: (ask?: () => boolean | Promise<boolean>) => Promise<boolean>;
  /**
   * Bridge to a router. When dirty, calls `cancel()` synchronously, asks the
   * user, and calls `retry()` on approval. Returns whether it interrupted.
   */
  interrupt: (cancel: () => void, retry: () => void) => boolean;
  /**
   * Build a handler for a dialog's cancelable `close` event, or for a Cancel
   * button. Programmatic closes and clean stores pass through. On approval
   * it runs `close()`, then `markSaved()`, so restore the form's values in
   * `close()`.
   */
  closeGuard: (
    close: () => void,
  ) => (event?: CustomEvent<{ trigger?: string }>) => void;
  /** Turn the browser leave-page prompt on or off at runtime. */
  setBeforeUnload: (on: boolean) => void;
  /** @internal Attach `UnsavedChangesPrompt`. `null` when one is attached. */
  mountPrompt: () => (() => void) | null;
  /** @internal Skip the leave-page prompt while `predicate` is true. */
  ignoreUnload: (predicate: () => boolean) => () => void;
}

/** Create a registry of dirty sources and the guards that read it. */
export function createUnsavedChanges(
  options?: UnsavedChangesOptions,
): UnsavedChangesStore;

/** The shared store, for zero-config page protection. */
export const unsavedChanges: UnsavedChangesStore;
