/** What a reader leaves behind so Back can bring the place back. */
export type InfiniteListSnapshot = {
  v: 1;
  /** The cursor each loaded page was fetched with. The first is unused (`null`). */
  cursors: ReadonlyArray<unknown>;
  /** The first item in view. */
  anchorKey: string | number | null;
  /**
   * The anchor's top edge, in pixels from the top of the scroll area.
   * Negative when the item is partly above it.
   */
  offset: number;
  /** The scroll position, for an anchor that is gone. */
  y: number;
};

export function defaultGetKey(item: unknown, index: number): string | number;

/**
 * Add the items of a page that the list does not hold yet, in order, and
 * return their keys.
 */
export function appendNewItems<Item>(
  byKey: Map<string | number, Item>,
  incoming: ReadonlyArray<Item>,
  getKey: (item: Item, index: number) => string | number,
  offset: number,
): Array<string | number>;

/** Whether the next page may load without a click. */
export function loadsOnScroll(state: {
  mode: "auto" | "button" | "auto-then-button";
  autoPages: number;
  pageCount: number;
}): boolean;

export function reachedCap(
  count: number,
  maxItems: number | undefined,
): boolean;

/** The `aria-setsize` for the items. `-1` says the total is unknown. */
export function setSize(state: {
  count: number;
  total: number | undefined;
  hasMore: boolean;
}): number;

/**
 * The first item whose bottom edge is below the top of the scroll area: the
 * item to hold still when the page is rebuilt.
 */
export function captureAnchor(
  elements: ArrayLike<{
    getBoundingClientRect(): { top: number; bottom: number };
  }>,
  rootTop: number,
): { index: number; offset: number } | null;

/** How far to scroll so the anchor sits `offset` from the top again. */
export function scrollDeltaForAnchor(
  currentTop: number,
  rootTop: number,
  offset: number,
): number;

export function snapshotStorageKey(
  restoreKey: unknown,
  entryKey: string,
): string;

/** Read a snapshot back, or `null` when it is missing or not one of ours. */
export function parseSnapshot(raw: string | null): InfiniteListSnapshot | null;

/** Names the history entry the page is on. */
export function currentEntryKey(): string;

/**
 * Fetch pages at once, a few at a time, in order. Stops at the first failure
 * and returns the pages before it.
 */
export function loadPagesTogether<Page>(
  loadPage: (cursor: unknown) => Promise<Page>,
  cursors: ReadonlyArray<unknown>,
  concurrency?: number,
): Promise<{ pages: Page[]; error?: unknown; failed: boolean }>;

/**
 * Call `callback` with whether `element` is within `rootMargin` of the end of
 * the scroll area, and again for each change. Returns a function that stops.
 */
export function observeEnd(
  element: Element,
  options: { root: Element | null; rootMargin: string },
  callback: (near: boolean) => void,
): () => void;

/** Focus the first thing in a new item a keyboard can reach, or the item. */
export function focusItem(item: Element | undefined): void;
