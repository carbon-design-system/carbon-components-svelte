// @ts-check

/**
 * @typedef {{ left: number; right: number; top: number; bottom: number }} Box
 */

/**
 * How far to scroll so a focused element clears what sticks over the scroll
 * region. The browser scrolls a focused element just into the region, which
 * leaves it behind a pinned column or the sticky header: visible to the
 * browser, hidden to the user (WCAG 2.4.11).
 *
 * `cover` is how far the sticky parts reach in from each physical edge. An
 * element wider or taller than the room left keeps its leading edge clear,
 * since that is where reading starts. A pinned element never scrolls
 * horizontally.
 * @param {Box} box
 * @param {Box} port
 * @param {{ left: number; right: number; top: number }} cover
 * @param {boolean} [pinned]
 * @returns {{ dx: number; dy: number }}
 */
export function computeReveal(box, port, cover, pinned = false) {
  const left = port.left + cover.left;
  const right = port.right - cover.right;
  const top = port.top + cover.top;

  let dx = 0;
  if (!pinned) {
    if (box.left < left) dx = box.left - left;
    else if (box.right > right)
      dx = Math.min(box.right - right, box.left - left);
  }

  let dy = 0;
  if (box.top < top) dy = box.top - top;
  else if (box.bottom > port.bottom) {
    dy = Math.min(box.bottom - port.bottom, box.top - top);
  }
  return { dx, dy };
}

/**
 * @param {HTMLElement} container
 * @returns {Box}
 */
function scrollport(container) {
  const rect = container.getBoundingClientRect();
  const left = rect.left + container.clientLeft;
  const top = rect.top + container.clientTop;
  return {
    left,
    right: left + container.clientWidth,
    top,
    bottom: top + container.clientHeight,
  };
}

/**
 * Where the pinned columns and the sticky header cover the scroll region,
 * read from the header cells that carry them.
 * @param {HTMLElement} container
 * @param {Box} port
 */
function measureCover(container, port) {
  const cover = { left: 0, right: 0, top: 0 };
  const middle = (port.left + port.right) / 2;
  for (const edge of container.querySelectorAll(
    "thead .bx--table-column--pinned-start-edge, thead .bx--table-column--pinned-end-edge",
  )) {
    const rect = edge.getBoundingClientRect();
    // The side comes from where the column sits, so text direction needs no read.
    if ((rect.left + rect.right) / 2 < middle) {
      cover.left = Math.max(cover.left, rect.right - port.left);
    } else {
      cover.right = Math.max(cover.right, port.right - rect.left);
    }
  }
  const header = container.querySelector(
    ".bx--data-table--sticky-header thead th",
  );
  if (header) {
    cover.top = Math.max(0, header.getBoundingClientRect().bottom - port.top);
  }
  return cover;
}

/**
 * Scroll a focused element in a table body out from under the pinned
 * columns and the sticky header.
 * @param {EventTarget | null} target
 */
export function revealFocus(target) {
  if (!(target instanceof HTMLElement)) return;
  const container = /** @type {HTMLElement | null} */ (
    target.closest(".bx--data-table_inner-container, .bx--data-table-content")
  );
  if (!container) return;

  const port = scrollport(container);
  const cover = measureCover(container, port);
  if (cover.left === 0 && cover.right === 0 && cover.top === 0) return;

  const { dx, dy } = computeReveal(
    target.getBoundingClientRect(),
    port,
    cover,
    target.closest("td")?.className.includes("bx--table-column--pinned") ??
      false,
  );
  if (dx) container.scrollLeft += dx;
  if (dy) container.scrollTop += dy;
}
