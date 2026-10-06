// @ts-check

/**
 * The element that scrolls for `container`, or the document's when `null`.
 *
 * @param {HTMLElement | null} container
 * @returns {Element}
 */
function getScroller(container) {
  return container ?? document.scrollingElement ?? document.documentElement;
}

/**
 * A computed `scroll-padding-top` or `scroll-margin-top` in pixels.
 * Percentages resolve against `height`; `auto` is 0.
 *
 * @param {string} value
 * @param {number} height
 * @returns {number}
 */
function toPixels(value, height) {
  const number = Number.parseFloat(value);
  if (Number.isNaN(number)) return 0;
  return value.endsWith("%") ? (number / 100) * height : number;
}

/**
 * The `scroll-padding-top` of `container`, or of the document when `null`,
 * in pixels.
 *
 * @param {HTMLElement | null} container
 * @returns {number}
 */
function getScrollPaddingTop(container) {
  const scroller = getScroller(container);
  return toPixels(
    getComputedStyle(scroller).scrollPaddingTop,
    scroller.clientHeight,
  );
}

/**
 * Whether `container` (or the document, when `null`) is scrolled to its end.
 * A container that cannot scroll is never at its end, so a short page keeps
 * the first section active instead of jumping to the last.
 *
 * @param {HTMLElement | null} container
 * @returns {boolean}
 */
function isScrolledToEnd(container) {
  const element = getScroller(container);
  const max = element.scrollHeight - element.clientHeight;
  return max > 0 && element.scrollTop >= max - 1;
}

/**
 * The id of the section a reader is looking at: the last target, in the
 * order given, whose top has crossed the activation line. The line sits
 * `offset` pixels from the top of the scroll container, then `line` of the
 * way down the rest of its visible height: `0` (the default) at the offset,
 * `0.5` halfway down, `1` at the bottom edge, so a section counts as soon as
 * it scrolls into view. `offset` defaults to the container's
 * `scroll-padding-top`, where a native hash jump lands a section. Before the
 * first target crosses, the first is active; once the container is scrolled
 * to its end, the last is, since short trailing sections can never reach the
 * line. Ids with no element are skipped.
 *
 * @param {ReadonlyArray<string>} ids Section ids in document order
 * @param {{ container?: HTMLElement | null; offset?: number; line?: number }} [options]
 * @returns {string | undefined}
 */
export function getActiveSectionId(
  ids,
  { container = null, offset = getScrollPaddingTop(container), line = 0 } = {},
) {
  /** @type {Array<{ id: string; element: HTMLElement }>} */
  const targets = [];
  for (const id of ids) {
    const element = document.getElementById(id);
    if (element) targets.push({ id, element });
  }
  if (targets.length === 0) return undefined;
  if (isScrolledToEnd(container)) return targets[targets.length - 1].id;

  const rootTop = container ? container.getBoundingClientRect().top : 0;
  const height = getScroller(container).clientHeight;
  const fraction = Math.min(Math.max(line, 0), 1);
  const lineTop = offset + fraction * Math.max(height - offset, 0);
  let active = targets[0].id;
  for (const { id, element } of targets) {
    // 1px of slack: anchor jumps can land a fraction of a pixel short.
    if (element.getBoundingClientRect().top - rootTop > lineTop + 1) break;
    active = id;
  }
  return active;
}

/**
 * Scroll `container` (or the window, when `null`) so `target`'s top sits
 * where a native hash jump would put it: below the scroller's
 * `scroll-padding-top` plus the target's `scroll-margin-top`, or `offset`
 * pixels below the container's top when that is larger. Only that one
 * scroller moves; the smoothness follows its CSS `scroll-behavior`, as a
 * native hash jump does.
 *
 * @param {HTMLElement} target
 * @param {{ container?: HTMLElement | null; offset?: number }} [options]
 */
export function scrollToSection(target, { container = null, offset = 0 } = {}) {
  const padding = getScrollPaddingTop(container);
  const margin = toPixels(
    getComputedStyle(target).scrollMarginTop,
    getScroller(container).clientHeight,
  );
  const inset = Math.max(offset, padding + margin);
  const targetTop = target.getBoundingClientRect().top;

  if (container) {
    const rootTop = container.getBoundingClientRect().top;
    container.scrollTo({
      top: container.scrollTop + targetTop - rootTop - inset,
    });
  } else {
    window.scrollTo({ top: window.scrollY + targetTop - inset });
  }
}

/**
 * Focus `target` without scrolling, as a native hash jump moves the
 * sequential focus navigation starting point, so the next Tab continues from
 * the section. A section that isn't focusable gets `tabindex="-1"` until it
 * loses focus.
 *
 * @param {HTMLElement} target
 */
export function focusSection(target) {
  const added = target.tabIndex < 0 && !target.hasAttribute("tabindex");
  if (added) target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
  if (!added) return;
  if (document.activeElement === target) {
    target.addEventListener("blur", () => target.removeAttribute("tabindex"), {
      once: true,
    });
  } else {
    target.removeAttribute("tabindex");
  }
}

const SCROLLABLE_OVERFLOW = /(auto|scroll)/;

/**
 * Scroll `item` into view, as `block: "nearest"` would, within its nearest
 * scrollable ancestor that doesn't also contain `section`, such as a sticky
 * sidebar that overflows. An ancestor that contains the section scrolls the
 * page, so the search stops there and the page never moves.
 *
 * @param {HTMLElement} item
 * @param {HTMLElement} section
 */
export function revealItem(item, section) {
  for (
    let element = item.parentElement;
    element && element !== document.body && !element.contains(section);
    element = element.parentElement
  ) {
    if (element.scrollHeight <= element.clientHeight) continue;
    if (!SCROLLABLE_OVERFLOW.test(getComputedStyle(element).overflowY)) {
      continue;
    }
    const itemRect = item.getBoundingClientRect();
    const rootRect = element.getBoundingClientRect();
    if (itemRect.top < rootRect.top) {
      element.scrollTop -= rootRect.top - itemRect.top;
    } else if (itemRect.bottom > rootRect.bottom) {
      element.scrollTop += itemRect.bottom - rootRect.bottom;
    }
    return;
  }
}
