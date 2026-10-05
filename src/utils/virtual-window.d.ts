/** Marks a pinned layer and holds the offset it was last placed at. */
export const PINNED_WINDOW_ATTRIBUTE: "data-virtual-window-pinned";

export type VirtualWindowParams = {
  /** Where the first rendered row sits in the list. */
  offsetY: number;
  /** The scroll position the window was resolved against. Read only when `pinned`. */
  scrollTop: number;
  /** @default false */
  pinned?: boolean;
};

/**
 * Svelte action for the element that wraps the rendered rows. It owns the
 * element's `transform`, so `syncPinnedWindow` can move it between renders.
 */
export function virtualWindow(
  node: HTMLElement,
  params: VirtualWindowParams,
): { update: (next: VirtualWindowParams) => void };

/**
 * Move a pinned window under `container` to a scroll position just written to
 * it, before the component renders that position. A no-op when nothing under
 * `container` is pinned.
 */
export function syncPinnedWindow(
  container: HTMLElement,
  scrollTop: number,
): void;
