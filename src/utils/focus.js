// @ts-check
import { tick } from "svelte";
import { writable } from "svelte/store";
import { selectorTabbable } from "./trap-focus.js";

const selectorFirstInput =
  'input:not([type="hidden"]):not([disabled]):not([tabindex="-1"]), textarea:not([disabled]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"])';

/**
 * Resolve initial dialog focus: `selectorPrimaryFocus`, then the first form
 * input, then the first `fallbacks` entry that is set and not disabled.
 * Returns `null` when `selectorPrimaryFocus` is null or no target is found.
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
    fallbacks.find((el) => el && !el.matches(":disabled")) ||
    null;
  return /** @type {HTMLElement | null} */ (node);
}

/**
 * The element the library is moving focus to on its own, while it moves.
 * @type {Element | null}
 */
let quietTarget = null;

/**
 * Move focus to `target` on the library's own initiative: a dialog's first
 * focus, or focus returned to a trigger as its panel closes. The user did
 * not ask for the target's tooltip, so a tooltip on `target` stays closed
 * until the next pointer enter or focus (see `isQuietFocus`).
 *
 * @param {HTMLElement} target
 * @param {FocusOptions} [options]
 * @returns {void}
 */
export function focusQuietly(target, options) {
  quietTarget = target;
  try {
    target.focus(options);
  } finally {
    quietTarget = null;
  }
}

/**
 * Give a dialog's first target focus quietly, and try once more on the next
 * frame if focus did not land in the dialog. WebKit refuses to focus an
 * element created in the same update that makes its dialog visible: it
 * inherits the dialog's `visibility: hidden` until the next frame. The retry
 * is skipped once the dialog closes or focus has landed inside it.
 *
 * @param {HTMLElement} target
 * @param {Object} options
 * @param {Element | null | undefined} options.container - The dialog.
 * @param {() => boolean} options.isOpen
 * @param {FocusOptions} [options.focusOptions]
 * @returns {void}
 */
export function focusFirstQuietly(target, { container, isOpen, focusOptions }) {
  focusQuietly(target, focusOptions);
  if (container?.contains(document.activeElement)) return;
  requestAnimationFrame(() => {
    if (!isOpen() || !target.isConnected) return;
    if (container?.contains(document.activeElement)) return;
    focusQuietly(target, focusOptions);
  });
}

/**
 * Whether focus is moving to `node` through `focusQuietly`. Call it from a
 * `focus` listener, which runs while focus moves.
 *
 * @param {Element | null | undefined} node
 * @returns {boolean}
 */
export function isQuietFocus(node) {
  return node != null && node === quietTarget;
}

const pointerInputStore = writable(false);

/**
 * `true` from a pointer press until the next key press. A menu that opens
 * from a click reads it to skip the focus ring on the item it focuses.
 * Chromium and Safari match `:focus-visible` on script focus after some
 * clicks, so CSS alone cannot tell the two apart.
 *
 * @type {import("svelte/store").Readable<boolean>}
 */
export const pointerInput = { subscribe: pointerInputStore.subscribe };

/**
 * The element the last pointer press landed on, until the next key press.
 * @type {EventTarget | null}
 */
let pressTarget = null;

if (typeof document !== "undefined") {
  /** @param {Event} event */
  const press = (event) => {
    pressTarget = event.target;
    pointerInputStore.set(true);
  };
  document.addEventListener("pointerdown", press, true);
  document.addEventListener("mousedown", press, true);
  document.addEventListener(
    "keydown",
    () => {
      pressTarget = null;
      pointerInputStore.set(false);
    },
    true,
  );
}

/**
 * Whether focus on `node` came from a pointer press on it, with no key
 * pressed since. A tooltip ignores that focus, as Carbon React's does
 * (`focusByMouse`), so it closes when the pointer leaves.
 *
 * @param {Element | null | undefined} node
 * @returns {boolean}
 */
export function isPointerFocus(node) {
  return (
    node != null && pressTarget instanceof Node && node.contains(pressTarget)
  );
}

/**
 * Save focus before an overlay opens and restore it on close when the element
 * is still connected. With nothing focused, it saves the control a pointer
 * last pressed (Safari does not focus a clicked button). Pass the overlay as
 * `region` to skip the restore when focus has already moved outside it (e.g. a
 * close handler opened another dialog).
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
      const active = document.activeElement;
      prevFocus = active instanceof HTMLElement ? active : null;
      // Safari does not focus a button on click, so `<body>` holds focus when
      // a click opens the overlay. Return to the control that was pressed.
      if (!active || active === document.body) {
        const pressed =
          pressTarget instanceof Element
            ? pressTarget.closest(selectorTabbable)
            : null;
        if (pressed instanceof HTMLElement && pressed.isConnected)
          prevFocus = pressed;
      }
    },
    restore(region) {
      if (!prevFocus?.isConnected) return;
      if (region === undefined || focusIsFree(region)) {
        focusQuietly(prevFocus);
      }
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
  if (target?.isConnected) focusQuietly(target, { preventScroll: true });
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
