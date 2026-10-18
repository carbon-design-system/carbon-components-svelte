// @ts-check

/**
 * True when Alt, Ctrl or Meta is held. Menus leave these key combinations
 * to the browser (Alt/Cmd+Left is Back, Ctrl/Cmd+Down scrolls), so they
 * neither move focus nor call `preventDefault`. Shift is not included.
 *
 * @param {KeyboardEvent} event
 * @returns {boolean}
 */
export function hasModifierKey(event) {
  return event.altKey || event.ctrlKey || event.metaKey;
}
