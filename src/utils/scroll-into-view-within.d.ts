/**
 * Scroll an item into view within its own scroll container (a menu or modal
 * body) without scrolling the document.
 *
 * `Element.scrollIntoView` scrolls every scrollable ancestor up to the
 * viewport, so a portaled menu would jump the whole page. This scopes the
 * adjustment to the container and is a no-op when the container is not
 * scrollable.
 */
/**
 * Scroll `node` into view within its nearest scroll container matching
 * `containerSelector` using `block: "nearest"` semantics. Never scrolls the
 * document.
 */
export function scrollIntoViewWithin(
  node: HTMLElement,
  containerSelector?: string,
): void;
