/**
 * Scroll a highlighted option into view without scrolling the document.
 *
 * `Element.scrollIntoView` scrolls every scrollable ancestor up to the
 * viewport. When the list box menu is portaled to `document.body` (or has no
 * internal scroll container), the nearest scrollable ancestor is the document
 * itself, so calling it on highlight would jump the whole page. This scopes the
 * adjustment to the menu's own scroll container and is a no-op when the menu is
 * not scrollable.
 */
/**
 * Scroll `el` into view within its nearest `role="listbox"` scroll container
 * using `block: "nearest"` semantics. Never scrolls the document.
 */
export function scrollIntoViewWithinMenu(el: HTMLElement): void;
