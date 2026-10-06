/**
 * The id of the last section whose top has crossed the activation line:
 * `offset` pixels (default: the container's `scroll-padding-top`) from the
 * top of the scroll container, then `line` (0–1, default 0) of the way down
 * the rest of its visible height. The first before any cross, the last once
 * the container is scrolled to its end.
 */
export function getActiveSectionId(
  ids: ReadonlyArray<string>,
  options?: { container?: HTMLElement | null; offset?: number; line?: number },
): string | undefined;

/**
 * Scroll only `container` (or the window) so `target`'s top sits below the
 * scroller's `scroll-padding-top` plus its own `scroll-margin-top`, as a
 * native hash jump does, or `offset` pixels below the top if larger.
 */
export function scrollToSection(
  target: HTMLElement,
  options?: { container?: HTMLElement | null; offset?: number },
): void;

/**
 * Focus `target` without scrolling, as a native hash jump does, adding
 * `tabindex="-1"` until it loses focus if it isn't focusable.
 */
export function focusSection(target: HTMLElement): void;

/**
 * Scroll `item` into view within its nearest scrollable ancestor that
 * doesn't also contain `section`. Never scrolls the page.
 */
export function revealItem(item: HTMLElement, section: HTMLElement): void;
