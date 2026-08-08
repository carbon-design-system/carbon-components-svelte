// @ts-check

// taken from github.com/carbon-design-system/carbon/packages/react/src/internal/keyboard/navigation.js
const selectorTabbable = `
  a[href], area[href], input:not([disabled]):not([tabindex='-1']),
  button:not([disabled]):not([tabindex='-1']),select:not([disabled]):not([tabindex='-1']),
  textarea:not([disabled]):not([tabindex='-1']),
  iframe, object, embed, *[tabindex]:not([tabindex='-1']):not([disabled]), *[contenteditable=true]
`;

/**
 * Trap Tab/Shift+Tab focus within `container`. Call on Tab keydown; always
 * calls `event.preventDefault()`.
 *
 * @param {Object} options
 * @param {Element} options.container - Element whose tabbable descendants form the focus loop.
 * @param {KeyboardEvent} options.event - The Tab keydown event.
 * @returns {void}
 */
export function trapFocus({ container, event }) {
  const tabbable = /** @type {HTMLElement[]} */ (
    Array.from(container.querySelectorAll(selectorTabbable))
  ).filter((el) => {
    // Cheap geometry check first, so the (layout/style-recalc-forcing)
    // `getComputedStyle` call below is only reached for elements not
    // already excluded by it. `offsetParent` is `null` both when the
    // browser hasn't computed real layout for the element (not attached,
    // inside a `display: none` ancestor) and for visible `position: fixed`
    // elements — and, in test environments like jsdom that don't compute
    // layout at all, for every element unconditionally. Requiring
    // `offsetParent !== null` before trusting zero dimensions avoids
    // treating "no layout information" as "hidden".
    if (
      el.offsetParent !== null &&
      el.offsetWidth === 0 &&
      el.offsetHeight === 0
    ) {
      return false;
    }

    // `visibility: hidden` elements keep their layout box, so this can only
    // be detected via computed style, not geometry.
    const style = getComputedStyle(el);
    return style.visibility !== "hidden" && style.display !== "none";
  });

  if (tabbable.length === 0) {
    event.preventDefault();
    return;
  }

  let index = tabbable.indexOf(
    /** @type {HTMLElement} */ (document.activeElement),
  );
  if (index === -1) {
    index = event.shiftKey ? tabbable.length : -1;
  }

  index += event.shiftKey ? -1 : 1;
  index = (index + tabbable.length) % tabbable.length;

  tabbable[index].focus();
  event.preventDefault();
}
