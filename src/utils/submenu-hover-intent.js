// @ts-check

import { isAimingAt } from "./pointer-aim.js";
import { addPooledListener } from "./window-listener-pool.js";

/**
 * The intent whose open submenu the pointer may be heading for. One pointer
 * aims at one submenu at a time, so this is shared by every instance.
 * @type {object | null}
 */
let aiming = null;

/** @type {{ x: number, y: number } | null} */
let pointer = null;

/** @param {Event} event */
function trackPointer(event) {
  const { pointerType, clientX, clientY } = /** @type {PointerEvent} */ (event);
  // Touch never hovers, so it never aims.
  if (pointerType === "touch") return;
  pointer = { x: clientX, y: clientY };
}

/**
 * Create an open/close scheduler for hover-intent submenus (Menu/ContextMenu
 * items with a nested submenu): entering schedules an open after
 * `openDelay`, leaving schedules a close after `closeDelay`, and each
 * cancels the other's pending timer.
 *
 * With `getSubmenu`, leaving while the submenu is open also watches the
 * pointer. While it keeps moving toward the submenu, the close waits and
 * other items hold their own opens, so a diagonal path across them does not
 * switch submenus. The check repeats every `aimPause` and ends when the
 * pointer pauses, turns away, or enters the submenu.
 * @param {(open: boolean) => void} setOpen - Applies the resolved open state.
 * @param {{
 *   openDelay: number;
 *   closeDelay: number;
 *   aimPause?: number;
 *   getSubmenu?: () => Element | null | undefined;
 * }} options
 */
export function createSubmenuHoverIntent(setOpen, options) {
  const self = {};
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let openTimeout;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let closeTimeout;
  /** @type {(() => void) | undefined} */
  let stopTracking;
  /** @type {{ x: number, y: number } | null} */
  let from = null;

  function endAim() {
    stopTracking?.();
    stopTracking = undefined;
    from = null;
    if (aiming === self) aiming = null;
  }

  function cancel() {
    clearTimeout(openTimeout);
    clearTimeout(closeTimeout);
    endAim();
  }

  function open() {
    cancel();
    setOpen(true);
  }

  function tryOpen() {
    if (aiming && aiming !== self && options.aimPause) {
      openTimeout = setTimeout(tryOpen, options.aimPause);
      return;
    }
    open();
  }

  function scheduleOpen() {
    cancel();
    openTimeout = setTimeout(tryOpen, options.openDelay);
  }

  function tryClose() {
    const submenu = from && options.getSubmenu?.();
    if (
      submenu &&
      from &&
      pointer &&
      isAimingAt(pointer, from, submenu.getBoundingClientRect())
    ) {
      from = pointer;
      closeTimeout = setTimeout(tryClose, options.aimPause);
      return;
    }
    endAim();
    setOpen(false);
  }

  /** @param {MouseEvent} [event] */
  function scheduleClose(event) {
    cancel();
    if (event && options.aimPause && options.getSubmenu?.()) {
      from = pointer = { x: event.clientX, y: event.clientY };
      aiming = self;
      stopTracking = addPooledListener("pointermove", trackPointer, {
        passive: true,
      });
    }
    closeTimeout = setTimeout(tryClose, options.closeDelay);
  }

  function cancelClose() {
    clearTimeout(closeTimeout);
    endAim();
  }

  return { open, scheduleOpen, scheduleClose, cancelClose, cancel };
}
