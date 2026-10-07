// @ts-check
// Scroll a highlighted option into view without scrolling the document.
//
// `Element.scrollIntoView` scrolls every scrollable ancestor up to the
// viewport. When the list box menu is portaled to `document.body` (or has no
// internal scroll container), the nearest scrollable ancestor is the document
// itself, so calling it on highlight would jump the whole page. This scopes the
// adjustment to the menu's own scroll container and is a no-op when the menu is
// not scrollable.

import { syncPinnedWindow } from "./virtual-window.js";

/**
 * Scroll `node` into view within its nearest scroll container matching
 * `containerSelector`, aligned like `Element.scrollIntoView`'s `block` option
 * (default `"nearest"`). Never scrolls the document.
 *
 * @param {HTMLElement} node
 * @param {string} [containerSelector] defaults to `[role="listbox"]`
 * @param {"start" | "center" | "end" | "nearest"} [block] defaults to `"nearest"`
 * @returns {void}
 */
export function scrollIntoViewWithinMenu(
  node,
  containerSelector = '[role="listbox"]',
  block = "nearest",
) {
  const container = node.closest(containerSelector);
  if (!(container instanceof HTMLElement)) return;
  if (container.scrollHeight <= container.clientHeight) return;

  const itemRect = node.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  if (block === "start") {
    container.scrollTop += itemRect.top - containerRect.top;
  } else if (block === "end") {
    container.scrollTop += itemRect.bottom - containerRect.bottom;
  } else if (block === "center") {
    container.scrollTop +=
      itemRect.top +
      itemRect.height / 2 -
      (containerRect.top + containerRect.height / 2);
  } else if (itemRect.top < containerRect.top) {
    container.scrollTop -= containerRect.top - itemRect.top;
  } else if (itemRect.bottom > containerRect.bottom) {
    container.scrollTop += itemRect.bottom - containerRect.bottom;
  } else {
    return;
  }

  syncPinnedWindow(container, container.scrollTop);
}
