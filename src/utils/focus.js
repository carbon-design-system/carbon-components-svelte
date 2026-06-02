// @ts-check

const selectorFirstInput =
  'input:not([type="hidden"]):not([disabled]):not([tabindex="-1"]), textarea:not([disabled]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"])';

/**
 * Resolve initial dialog focus: `selectorPrimaryFocus`, then the first form
 * input, then the first truthy `fallbacks` entry. Returns `null` when
 * `selectorPrimaryFocus` is null or no target is found.
 *
 * @param {Object} options
 * @param {Element | null | undefined} options.container - Dialog container to search within.
 * @param {string | null} [options.selectorPrimaryFocus] - Preferred focus target selector; `null` to focus nothing.
 * @param {Array<Element | null | undefined>} [options.fallbacks] - Fallback elements if no selector or input matches.
 * @returns {HTMLElement | null}
 */
export function initialFocus({
  container,
  selectorPrimaryFocus = "[data-modal-primary-focus]",
  fallbacks = [],
}) {
  if (selectorPrimaryFocus == null || container == null) return null;
  const node =
    container.querySelector(selectorPrimaryFocus) ||
    container.querySelector(selectorFirstInput) ||
    fallbacks.find(Boolean) ||
    null;
  return /** @type {HTMLElement | null} */ (node);
}

/**
 * Save focus before an overlay opens and restore it on close when the element
 * is still connected.
 *
 * @returns {{ save: () => void; restore: () => void }}
 */
export function restoreFocus() {
  /** @type {HTMLElement | null} */
  let previouslyFocusedElement = null;
  return {
    save() {
      previouslyFocusedElement =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
    },
    restore() {
      if (previouslyFocusedElement?.isConnected) {
        previouslyFocusedElement.focus();
        previouslyFocusedElement = null;
      }
    },
  };
}
