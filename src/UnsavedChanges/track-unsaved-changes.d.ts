import type { UnsavedChangesStore } from "./unsaved-changes.js";

export interface TrackUnsavedChangesParams {
  /** Defaults to the shared `unsavedChanges` store. */
  store?: UnsavedChangesStore;
  /** Defaults to a generated id. */
  id?: string;
  /** Mirror this flag instead of diffing controls. */
  dirty?: boolean;
}

/**
 * Reports the dirty state of a `<form>` (or any element) to an
 * unsaved-changes store.
 *
 * A form is compared control by control against a baseline taken on mount,
 * so unnamed controls count. A reset, or `store.markSaved()`, retakes the
 * baseline. Pass `dirty` to mirror a flag you compute yourself instead.
 * SSR-safe: actions only run in the browser.
 */
export function trackUnsavedChanges(
  node: HTMLElement,
  params?: TrackUnsavedChangesParams,
): {
  update: (params?: TrackUnsavedChangesParams) => void;
  destroy: () => void;
};
