// @ts-check
// Scroll restoration for a list that is loaded as you read it. The browser can
// put the scroll position back only if the page is tall enough when it tries,
// and an incrementally loaded list is not. So the page keeps the place itself,
// as an item and an offset into its row rather than pixels (a phone turned on
// its side has a different column count), in the entry's `history.state`.

const KEY = "carbonCatalog";

/**
 * What to remember about where the reader is.
 * @typedef {Object} ScrollSnapshot
 * @property {string} key The query string the list was showing.
 * @property {number} index The first item in view.
 * @property {number} within How far into that item's row the viewport starts, in pixels.
 * @property {number} y The page's scroll position, a fallback.
 */

/**
 * The first row in view, and how far into it.
 * @param {Object} geometry
 * @param {number} geometry.scrollY
 * @param {number} geometry.listTop Where the first row starts, in page pixels.
 * @param {number} geometry.stride Row height plus gap.
 * @param {number} geometry.columns
 */
export function anchorAt({ scrollY, listTop, stride, columns }) {
  const into = Math.max(0, scrollY - listTop);
  const row = Math.floor(into / stride);
  return { index: row * columns, within: into - row * stride };
}

/**
 * The scroll position that puts `index` back at `within`.
 * @param {Object} geometry
 * @param {number} geometry.index
 * @param {number} geometry.within
 * @param {number} geometry.listTop
 * @param {number} geometry.stride
 * @param {number} geometry.columns
 */
export function scrollForAnchor({ index, within, listTop, stride, columns }) {
  return listTop + Math.floor(index / columns) * stride + within;
}

/**
 * The snapshot in this history entry, if it was made for `key`.
 * @param {string} key
 * @returns {ScrollSnapshot | null}
 */
export function readSnapshot(key) {
  if (typeof history === "undefined") return null;
  const saved = history.state?.[KEY];
  return saved && saved.key === key ? saved : null;
}

/**
 * Save the snapshot into the current entry. Browsers throttle `replaceState`
 * (Safari throws past 100 calls in 30 seconds), so call this on a pause in
 * scrolling and when the page is left, never on every scroll event.
 * @param {ScrollSnapshot} snapshot
 */
export function writeSnapshot(snapshot) {
  if (typeof history === "undefined") return;
  try {
    history.replaceState(
      { ...history.state, [KEY]: snapshot },
      "",
      location.href,
    );
  } catch {
    // Throttled: the next pause saves it.
  }
}
