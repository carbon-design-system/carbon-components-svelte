// @ts-check
// Place the rendered window of a virtualized list inside its scroll spacer.
//
// The browser scrolls on the compositor and can paint a new scroll position
// before the window has moved to it. Normally the rows scroll away with the
// content and leave blank space for that frame. A pinned window is a sticky
// layer the compositor holds at the top of the viewport, so the rows that were
// on screen stay on screen until the window catches up.
//
// The layer is zero-height. Sticky positioning then offsets it by the scroll
// position itself, clamped only at zero, and the rows inside are translated
// back by the same amount. Nothing clips the layer: the rows overflow it and
// the scroll container clips them, as it does an unpinned window. So nothing
// needs to know the viewport's height.

/** Marks a pinned layer and holds the offset it was last placed at. */
export const PINNED_WINDOW_ATTRIBUTE = "data-virtual-window-pinned";

/**
 * The distance sticky positioning moves a zero-height layer, which is the
 * scroll position with any overscroll above the top ignored.
 *
 * @param {number} scrollTop
 * @returns {number}
 */
function getStickyOffset(scrollTop) {
  return Math.max(0, scrollTop);
}

/**
 * @typedef {Object} VirtualWindowParams
 * @property {number} offsetY Where the first rendered row sits in the list.
 * @property {number} scrollTop The scroll position the window was resolved
 * against. Read only when `pinned`.
 * @property {boolean} [pinned]
 */

/**
 * @param {HTMLElement} node
 * @param {VirtualWindowParams} params
 */
function place(node, { offsetY, scrollTop, pinned = false }) {
  if (pinned) {
    node.style.position = "sticky";
    node.style.top = "0";
    node.style.height = "0";
    node.setAttribute(PINNED_WINDOW_ATTRIBUTE, String(offsetY));
    node.style.transform = `translateY(${offsetY - getStickyOffset(scrollTop)}px)`;
    return;
  }

  node.style.removeProperty("position");
  node.style.removeProperty("top");
  node.style.removeProperty("height");
  node.removeAttribute(PINNED_WINDOW_ATTRIBUTE);
  node.style.transform = `translateY(${offsetY}px)`;
}

/**
 * Svelte action for the element that wraps the rendered rows. It owns the
 * element's `transform`, so `syncPinnedWindow` can move it between renders
 * without a style binding writing back a stale value.
 *
 * @param {HTMLElement} node
 * @param {VirtualWindowParams} params
 */
export function virtualWindow(node, params) {
  place(node, params);

  return {
    /** @param {VirtualWindowParams} next */
    update(next) {
      place(node, next);
    },
  };
}

/**
 * Move a pinned window under `container` to a scroll position just written to
 * it, before the component renders that position. Code that writes
 * `scrollTop` and then reads where rows are needs the rows to have moved, as
 * they do in an unpinned window. A no-op when nothing under `container` is
 * pinned.
 *
 * @param {HTMLElement} container The scroll container.
 * @param {number} scrollTop The position written.
 * @returns {void}
 */
export function syncPinnedWindow(container, scrollTop) {
  const layer = container.querySelector(`[${PINNED_WINDOW_ATTRIBUTE}]`);
  if (!(layer instanceof HTMLElement)) return;

  const offsetY = Number(layer.getAttribute(PINNED_WINDOW_ATTRIBUTE));
  layer.style.transform = `translateY(${offsetY - getStickyOffset(scrollTop)}px)`;
}
