// @ts-check

import { isInSafeTriangle } from "./isInSafeTriangle.js";

/**
 * @typedef {Object} SubmenuHoverController
 * @property {() => void} open - Cancel any pending timers and open immediately (click/keyboard activation).
 * @property {() => void} scheduleOpen - Open after the hover delay.
 * @property {() => void} scheduleClose - Close after the hover delay, unless the pointer is in the safe triangle when it fires.
 * @property {() => void} cancelClose - Cancel a pending close (e.g. the pointer entered the submenu itself).
 * @property {(x: number, y: number) => void} trackPointer - Record the latest pointer position; cancels a pending close early if it's now safe.
 * @property {() => void} destroy - Clear any pending timers (call from onDestroy).
 */

/**
 * Shared hover-intent scheduling for a menu item's submenu: open after the
 * "moderate-01" Carbon motion delay, and on leave, close after the same
 * delay unless the pointer is moving through the "safe triangle" toward the
 * submenu. `MenuItem` and `ContextMenuOption` each own their own DOM and
 * submenu-instantiation (a nested `Menu` vs. a nested `ContextMenu`), but
 * this exact timing/geometry logic is identical between them.
 *
 * @param {Object} options
 * @param {() => boolean} options.isDisabled
 * @param {(open: boolean) => void} options.setOpen
 * @param {() => Element | null} options.getTrigger - The item's own element, anchoring the near edge of the wedge.
 * @param {() => Element | null} options.getSubmenu - The submenu's own element, anchoring the far side of the wedge.
 * @param {number} [options.delayMs] Default `150`.
 * @returns {SubmenuHoverController}
 */
export function createSubmenuHoverController({
  isDisabled,
  setOpen,
  getTrigger,
  getSubmenu,
  delayMs = 150,
}) {
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let hoverTimeout;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let closeTimeout;
  let mousePosition = { x: 0, y: 0 };

  function isSafe() {
    const trigger = getTrigger();
    const submenu = getSubmenu();
    if (!trigger || !submenu) return false;
    return isInSafeTriangle(
      mousePosition.x,
      mousePosition.y,
      trigger.getBoundingClientRect(),
      submenu.getBoundingClientRect(),
    );
  }

  function open() {
    if (isDisabled()) return;
    clearTimeout(hoverTimeout);
    clearTimeout(closeTimeout);
    setOpen(true);
  }

  function scheduleOpen() {
    if (isDisabled()) return;
    clearTimeout(closeTimeout);
    clearTimeout(hoverTimeout);
    hoverTimeout = setTimeout(open, delayMs);
  }

  function scheduleClose() {
    clearTimeout(hoverTimeout);
    clearTimeout(closeTimeout);
    closeTimeout = setTimeout(() => {
      if (isSafe()) return;
      setOpen(false);
    }, delayMs);
  }

  function cancelClose() {
    clearTimeout(closeTimeout);
  }

  /** @type {(x: number, y: number) => void} */
  function trackPointer(x, y) {
    mousePosition = { x, y };
    if (closeTimeout !== undefined && isSafe()) {
      clearTimeout(closeTimeout);
      closeTimeout = undefined;
    }
  }

  function destroy() {
    clearTimeout(hoverTimeout);
    clearTimeout(closeTimeout);
  }

  return { open, scheduleOpen, scheduleClose, cancelClose, trackPointer, destroy };
}
