/** Default distance from the bottom (px) that counts as near end. */
export const DEFAULT_SCROLL_END_THRESHOLD: 32;

export type ScrollEndDetail = {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
};

/**
 * True when the scroll position is within `threshold` px of the bottom.
 * Returns false when the content does not overflow.
 */
export function isScrollNearEnd(options: {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  threshold?: number;
}): boolean;

export type ScrollEndTracker = {
  noteItemCount: (itemCount: number) => void;
  observe: (
    metrics: ScrollEndDetail & { itemCount?: number },
  ) => ScrollEndDetail | null;
  reset: () => void;
};

/**
 * Fire-once-per-approach tracker for listbox near-bottom `scrollend`.
 * Re-arms after the user scrolls away from the bottom, and when the item
 * count grows so another page can be requested.
 */
export function createScrollEndTracker(options?: {
  threshold?: number;
}): ScrollEndTracker;
