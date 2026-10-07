// @ts-check
import { tick } from "svelte";

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
 * is still connected. Pass the overlay as `region` to skip the restore when
 * focus has already moved outside it (e.g. a close handler opened another
 * dialog).
 *
 * @returns {{ save: () => void; restore: (region?: Element | null) => void }}
 */
export function restoreFocus() {
  /** @type {HTMLElement | null} */
  let prevFocus = null;
  return {
    save() {
      // Also runs while rendering an open overlay on the server.
      if (typeof document === "undefined") return;
      prevFocus =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
    },
    restore(region) {
      if (!prevFocus?.isConnected) return;
      if (region === undefined || focusIsFree(region)) prevFocus.focus();
      prevFocus = null;
    },
  };
}

/**
 * Whether focus was dropped to `<body>` or is still inside `region`, i.e.
 * nothing else has claimed it since `region` started closing.
 *
 * @param {Element | null | undefined} region
 * @returns {boolean}
 */
function focusIsFree(region) {
  const active = document.activeElement;
  return !active || active === document.body || !!region?.contains(active);
}

/**
 * Move focus to `target` after a close or removal, unless something else
 * already took it. Only acts when focus was dropped to `<body>` or is still
 * inside `region` (the popup or row being closed), so a consumer handler that
 * moved focus elsewhere wins. Checks at call time, so call it after any
 * `tick()` the close needs.
 *
 * @param {HTMLElement | null | undefined} target
 * @param {Element | null | undefined} [region]
 * @returns {void}
 */
export function returnFocus(target, region) {
  if (!focusIsFree(region)) return;
  if (target?.isConnected) target.focus({ preventScroll: true });
}

/**
 * Return focus to a trigger when its panel closes while holding focus, however
 * it closed (including a consumer setting `open` to false from an item's
 * handler). Call the returned function from a `$:` block with the open state:
 * it checks focus before the panel unmounts and moves it after.
 *
 * @param {() => HTMLElement | null | undefined} getTrigger
 * @param {() => Element | null | undefined} getPanel
 * @returns {(open: boolean) => void}
 */
export function returnFocusOnClose(getTrigger, getPanel) {
  let wasOpen = false;
  return (open) => {
    const panel = getPanel();
    if (wasOpen && !open && panel?.contains(document.activeElement)) {
      tick().then(() => returnFocus(getTrigger(), panel));
    }
    wasOpen = open;
  };
}
