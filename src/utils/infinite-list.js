// @ts-check
import { observeIntersection } from "./shared-observer.js";
import { uniqueId } from "./unique-id.js";

/**
 * What a reader leaves behind so Back can bring the place back.
 * @typedef {object} InfiniteListSnapshot
 * @property {1} v
 * @property {ReadonlyArray<unknown>} cursors The cursor each loaded page was
 *   fetched with. The first is unused (`null`).
 * @property {string | number | null} anchorKey The first item in view.
 * @property {number} offset The anchor's top edge, in pixels from the top of
 *   the scroll area. Negative when the item is partly above it.
 * @property {number} y The scroll position, for an anchor that is gone.
 */

/** Most pages a snapshot holds. A list that deep has hit its depth cap. */
const MAX_SNAPSHOT_PAGES = 200;

const STORAGE_PREFIX = "ccs:infinite-list:";
const ENTRY_TOKEN = "ccsEntry";

/**
 * @param {unknown} item
 * @param {number} index
 * @returns {string | number}
 */
export function defaultGetKey(item, index) {
  if (item && typeof item === "object" && "id" in item) {
    const id = /** @type {{ id: unknown }} */ (item).id;
    if (typeof id === "string" || typeof id === "number") return id;
  }
  return index;
}

/**
 * Add the items of a page that the list does not hold yet, in order. A
 * dataset that shifts between requests repeats an item on the next page;
 * showing it twice breaks keyed rendering and the count.
 *
 * @template Item
 * @param {Map<string | number, Item>} byKey The loaded items. Added to.
 * @param {ReadonlyArray<Item>} incoming
 * @param {(item: Item, index: number) => string | number} getKey
 * @param {number} offset The index of the page's first item in the list.
 * @returns {Array<string | number>} The keys it added.
 */
export function appendNewItems(byKey, incoming, getKey, offset) {
  /** @type {Array<string | number>} */
  const added = [];
  for (let i = 0; i < incoming.length; i++) {
    const item = incoming[i];
    const key = getKey(item, offset + added.length);
    if (byKey.has(key)) continue;
    byKey.set(key, item);
    added.push(key);
  }
  return added;
}

/**
 * Whether the next page may load without a click.
 *
 * @param {object} state
 * @param {"auto" | "button" | "auto-then-button"} state.mode
 * @param {number} state.autoPages Pages that load by themselves, after the first.
 * @param {number} state.pageCount Pages loaded so far.
 * @returns {boolean}
 */
export function loadsOnScroll({ mode, autoPages, pageCount }) {
  if (mode === "auto") return true;
  if (mode === "auto-then-button") return pageCount - 1 < autoPages;
  return false;
}

/**
 * @param {number} count
 * @param {number | undefined} maxItems
 * @returns {boolean}
 */
export function reachedCap(count, maxItems) {
  return typeof maxItems === "number" && maxItems > 0 && count >= maxItems;
}

/**
 * Pick the `aria-setsize` for the items. `-1` says the total is unknown, as
 * the ARIA spec asks, so a reader is not told "3 of 20" of a list of 4,000.
 *
 * @param {object} state
 * @param {number} state.count Items loaded.
 * @param {number | undefined} state.total
 * @param {boolean} state.hasMore Whether another page could follow.
 * @returns {number}
 */
export function setSize({ count, total, hasMore }) {
  if (!hasMore) return count;
  return typeof total === "number" && total >= count ? total : -1;
}

/**
 * The first item whose bottom edge is below the top of the scroll area: the
 * item to hold still when the page is rebuilt. Items run top to bottom, so
 * it is a binary search, and a pause in scrolling reads about 8 rects.
 *
 * @param {ArrayLike<{ getBoundingClientRect(): { top: number; bottom: number } }>} elements
 * @param {number} rootTop
 * @returns {{ index: number; offset: number } | null}
 */
export function captureAnchor(elements, rootTop) {
  let low = 0;
  let high = elements.length - 1;
  if (high < 0) return null;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (elements[mid].getBoundingClientRect().bottom > rootTop) high = mid;
    else low = mid + 1;
  }
  const rect = elements[low].getBoundingClientRect();
  return { index: low, offset: rect.top - rootTop };
}

/**
 * How far to scroll so the anchor sits `offset` from the top of the scroll
 * area again. Anchored by item, not by pixel, so it holds when the items
 * above it changed height or the column count changed.
 *
 * @param {number} currentTop The anchor's top now.
 * @param {number} rootTop
 * @param {number} offset
 * @returns {number}
 */
export function scrollDeltaForAnchor(currentTop, rootTop, offset) {
  return currentTop - rootTop - offset;
}

/**
 * @param {unknown} restoreKey
 * @param {string} entryKey
 * @returns {string}
 */
export function snapshotStorageKey(restoreKey, entryKey) {
  return `${STORAGE_PREFIX}${restoreKey}:${entryKey}`;
}

/**
 * Read a snapshot back, or `null` when it is missing or not one of ours.
 *
 * @param {string | null} raw
 * @returns {InfiniteListSnapshot | null}
 */
export function parseSnapshot(raw) {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || value.v !== 1) return null;
    const { cursors, anchorKey, offset, y } = value;
    if (
      !Array.isArray(cursors) ||
      cursors.length < 1 ||
      cursors.length > MAX_SNAPSHOT_PAGES
    ) {
      return null;
    }
    if (
      anchorKey !== null &&
      typeof anchorKey !== "string" &&
      typeof anchorKey !== "number"
    ) {
      return null;
    }
    if (!Number.isFinite(offset) || !Number.isFinite(y)) return null;
    return { v: 1, cursors, anchorKey, offset, y };
  } catch {
    return null;
  }
}

/**
 * Names the history entry the page is on. Back to an entry finds its
 * snapshot, and a new visit to the same URL, which is a new entry, does not:
 * it starts at the top.
 *
 * The Navigation API's `key` is stable for an entry, across reloads and
 * `replaceState`, and no router can overwrite it. Without it, a token in
 * `history.state` stands in; a router that replaces the state object
 * loses the token, and the list then starts at the top, which is safe.
 *
 * @returns {string}
 */
export function currentEntryKey() {
  const nav = /** @type {any} */ (globalThis).navigation;
  const key = nav?.currentEntry?.key;
  if (typeof key === "string" && key) return key;
  try {
    const state = history.state;
    const held =
      state && typeof state === "object" ? state[ENTRY_TOKEN] : undefined;
    if (typeof held === "string" && held) return held;
    const token = uniqueId("entry");
    history.replaceState(
      {
        ...(state && typeof state === "object" ? state : null),
        [ENTRY_TOKEN]: token,
      },
      "",
    );
    return token;
  } catch {
    return "";
  }
}

/**
 * Fetch pages at once, a few at a time, in order. Their cursors are known
 * from the snapshot, so none waits for another's answer. Stops at the first
 * failure and returns the pages before it.
 *
 * @template Page
 * @param {(cursor: unknown) => Promise<Page>} loadPage
 * @param {ReadonlyArray<unknown>} cursors
 * @param {number} [concurrency]
 * @returns {Promise<{ pages: Page[]; error?: unknown; failed: boolean }>}
 */
export function loadPagesTogether(loadPage, cursors, concurrency = 4) {
  /** @type {Page[]} */
  const pages = [];
  /**
   * @param {number} start
   * @returns {Promise<{ pages: Page[]; error?: unknown; failed: boolean }>}
   */
  function next(start) {
    if (start >= cursors.length)
      return Promise.resolve({ pages, failed: false });
    const batch = cursors.slice(start, start + concurrency);
    return Promise.allSettled(batch.map((cursor) => loadPage(cursor))).then(
      (settled) => {
        for (const result of settled) {
          if (result.status === "rejected") {
            return { pages, error: result.reason, failed: true };
          }
          pages.push(result.value);
        }
        return next(start + concurrency);
      },
    );
  }
  return next(0);
}

/**
 * Call `callback` with whether `element` is within `rootMargin` of the end of
 * the scroll area, and again for each change. Returns a function that stops.
 * Observing again queues a fresh entry, which is how the list checks whether
 * it is still near the end after a page loaded.
 *
 * With no `root` the viewport is the scroll area and the observer is shared
 * with every other component that watches it.
 *
 * @param {Element} element
 * @param {{ root: Element | null; rootMargin: string }} options
 * @param {(near: boolean) => void} callback
 * @returns {() => void}
 */
export function observeEnd(element, { root, rootMargin }, callback) {
  if (!root) {
    return observeIntersection(
      element,
      (entry) => callback(entry.isIntersecting),
      { rootMargin },
    );
  }
  if (typeof IntersectionObserver !== "function") return () => {};
  const observer = new IntersectionObserver(
    (entries) => {
      const last = entries[entries.length - 1];
      if (last) callback(last.isIntersecting);
    },
    { root, rootMargin },
  );
  observer.observe(element);
  return () => observer.disconnect();
}

/**
 * Focus the first thing in a new item a keyboard can reach, or the item.
 * `preventScroll`: the reader is already looking at the new items, because the
 * button they pressed sat where they start.
 *
 * @param {Element | undefined} item
 */
export function focusItem(item) {
  if (!(item instanceof HTMLElement)) return;
  const target =
    item.querySelector(
      'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ) ?? item;
  if (target === item && !item.hasAttribute("tabindex")) {
    item.setAttribute("tabindex", "-1");
  }
  /** @type {HTMLElement} */ (target).focus({ preventScroll: true });
}
