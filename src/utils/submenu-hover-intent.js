// @ts-check

/**
 * Create an open/close scheduler for hover-intent submenus (Menu/ContextMenu
 * items with a nested submenu): entering schedules an open after
 * `openDelay`, leaving schedules a close after `closeDelay`, and each
 * cancels the other's pending timer.
 * @param {(open: boolean) => void} setOpen - Applies the resolved open state.
 * @param {{ openDelay: number; closeDelay: number }} delays
 */
export function createSubmenuHoverIntent(setOpen, delays) {
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let openTimeout;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let closeTimeout;

  function cancel() {
    clearTimeout(openTimeout);
    clearTimeout(closeTimeout);
  }

  function open() {
    cancel();
    setOpen(true);
  }

  function scheduleOpen() {
    cancel();
    openTimeout = setTimeout(open, delays.openDelay);
  }

  function scheduleClose() {
    cancel();
    closeTimeout = setTimeout(() => setOpen(false), delays.closeDelay);
  }

  function cancelClose() {
    clearTimeout(closeTimeout);
  }

  return { open, scheduleOpen, scheduleClose, cancelClose, cancel };
}
