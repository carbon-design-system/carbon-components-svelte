// @ts-check
// Scroll a highlighted option into view without scrolling the document.
//
// `Element.scrollIntoView` scrolls every scrollable ancestor up to the
// viewport. When the list box menu is portaled to `document.body` (or has no
// internal scroll container), the nearest scrollable ancestor is the document
// itself, so calling it on highlight would jump the whole page. This scopes the
// adjustment to the menu's own scroll container and is a no-op when the menu is
// not scrollable.

/**
 * Scroll `el` into view within its nearest `role="listbox"` scroll container
 * using `block: "nearest"` semantics. Never scrolls the document.
 *
 * @param {HTMLElement} el
 * @returns {void}
 */
export function scrollIntoViewWithinMenu(el) {
  const container = el.closest('[role="listbox"]');
  if (!(container instanceof HTMLElement)) return;
  if (container.scrollHeight <= container.clientHeight) return;

  const itemRect = el.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  if (itemRect.top < containerRect.top) {
    container.scrollTop -= containerRect.top - itemRect.top;
  } else if (itemRect.bottom > containerRect.bottom) {
    container.scrollTop += itemRect.bottom - containerRect.bottom;
  }
}
