// @ts-check
import { tick } from "svelte";
import { restoreFocus } from "../utils/focus.js";
import { trapFocus } from "../utils/trap-focus.js";

/**
 * Active overlays in activation order. Only the last one traps focus, so
 * two overlays on one page don't pull focus back and forth.
 * @type {HTMLElement[]}
 */
const stack = [];

/**
 * @param {Element} element
 * @returns {boolean}
 */
function isModalDialog(element) {
  if (element.matches('[aria-modal="true"]')) return true;
  if (!(element instanceof HTMLDialogElement) || !element.open) return false;
  try {
    return element.matches(":modal");
  } catch {
    // Browsers without `:modal` only reach here for an open `<dialog>`.
    return true;
  }
}

/**
 * Whether `target` sits in a modal (`Modal`, `ComposedModal`, a modal
 * `Dialog`) opened on top of `overlay`, rather than one that contains it.
 *
 * @param {EventTarget | null} target
 * @param {Element} overlay
 * @returns {boolean}
 */
function isLayeredOnTop(target, overlay) {
  if (!(target instanceof Element)) return false;
  /** @type {Element | null} */
  let element = target;
  while (element) {
    if (isModalDialog(element)) return !element.contains(overlay);
    element = element.parentElement;
  }
  return false;
}

/**
 * Hold focus in a `Loading` overlay while `active` is `true`, as in Carbon
 * v11. Focus moves in when loading starts, Tab and focus moves outside are
 * reclaimed, and focus returns to where it was when loading stops. A modal
 * opened on top keeps focus.
 *
 * @param {HTMLElement} node
 * @param {boolean} active
 * @returns {{ update: (active: boolean) => void, destroy: () => void }}
 */
export function overlayFocus(node, active) {
  const focusReturn = restoreFocus();
  let trapping = false;
  let reclaiming = false;

  function topmost() {
    return stack[stack.length - 1] === node;
  }

  function reclaim() {
    if (reclaiming) return;
    reclaiming = true;
    try {
      node.focus();
    } finally {
      reclaiming = false;
    }
  }

  /** @param {FocusEvent} event */
  function handleFocusin(event) {
    const { target } = event;
    if (!topmost() || !(target instanceof Node) || node.contains(target)) {
      return;
    }
    if (isLayeredOnTop(target, node)) return;
    reclaim();
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (event.key !== "Tab" || !topmost()) return;
    if (isLayeredOnTop(event.target, node)) return;
    trapFocus({ container: node, event });
    if (!node.contains(document.activeElement)) reclaim();
  }

  function start() {
    trapping = true;
    focusReturn.save();
    stack.push(node);
    document.addEventListener("focusin", handleFocusin, true);
    document.addEventListener("keydown", handleKeydown, true);
    // Wait for the `--stop` class to clear; a `display: none` overlay
    // can't take focus.
    tick().then(() => {
      if (!trapping || !topmost()) return;
      if (node.contains(document.activeElement)) return;
      if (isLayeredOnTop(document.activeElement, node)) return;
      node.focus();
    });
  }

  function stop() {
    trapping = false;
    const index = stack.indexOf(node);
    if (index !== -1) stack.splice(index, 1);
    document.removeEventListener("focusin", handleFocusin, true);
    document.removeEventListener("keydown", handleKeydown, true);
    // Restore after the flush, so a trigger the consumer re-enables in the
    // same update can take focus.
    tick().then(() => focusReturn.restore(node));
  }

  if (active) start();

  return {
    update(nextActive) {
      if (nextActive && !trapping) start();
      else if (!nextActive && trapping) stop();
    },
    destroy() {
      if (trapping) stop();
    },
  };
}
