// @ts-check
// Scroll an item into view within its own scroll container (a menu or modal
// body) without scrolling the document.
//
// `Element.scrollIntoView` scrolls every scrollable ancestor up to the
// viewport, so a portaled menu would jump the whole page. This scopes the
// adjustment to the container and is a no-op when the container is not
// scrollable.

import { syncPinnedWindow } from "./virtual-window.js";

/**
 * Scroll `node` into view within its nearest scroll container matching
 * `containerSelector` using `block: "nearest"` semantics. Never scrolls the
 * document.
 *
 * @param {HTMLElement} node
 * @param {string} [containerSelector] defaults to `[role="listbox"]`
 * @returns {void}
 */
export function scrollIntoViewWithin(
  node,
  containerSelector = '[role="listbox"]',
) {
  const container = node.closest(containerSelector);
  if (!(container instanceof HTMLElement)) return;
  if (container.scrollHeight <= container.clientHeight) return;

  const itemRect = node.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  if (itemRect.top < containerRect.top) {
    container.scrollTop -= containerRect.top - itemRect.top;
  } else if (itemRect.bottom > containerRect.bottom) {
    container.scrollTop += itemRect.bottom - containerRect.bottom;
  } else {
    return;
  }

  syncPinnedWindow(container, container.scrollTop);
}
