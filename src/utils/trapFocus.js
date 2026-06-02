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
    const style = getComputedStyle(el);
    if (style.visibility === "hidden" || style.display === "none") {
      return false;
    }

    // Zero dimensions after layout; offsetParent is null when not in the DOM.
    if (
      el.offsetParent !== null &&
      el.offsetWidth === 0 &&
      el.offsetHeight === 0
    ) {
      return false;
    }

    return true;
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
