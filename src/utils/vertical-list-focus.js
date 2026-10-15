// @ts-check

import { getActiveElement } from "./focus.js";
import { rovingFocus } from "./roving-focus.js";

/**
 * Svelte action for a vertical menu or list: Up/Down wrap, Home/End jump to
 * the ends, and focus follows. Items are `selector` matches inside `node`, in
 * DOM order, so conditionally inserted items land where they render. Arrow
 * keys call `preventDefault` so the page does not scroll.
 *
 * Wraps `rovingFocus` with the options the header menus share. `options` are
 * read once.
 *
 * @param {HTMLElement} node
 * @param {{
 *   selector: string,
 *   isDisabled?: (item: HTMLElement) => boolean,
 * }} options - Pass `isDisabled` to skip matching items.
 * @returns {{ destroy: () => void }}
 */
export function verticalListFocus(node, { selector, isDisabled }) {
  const getItems = () =>
    /** @type {HTMLElement[]} */ (Array.from(node.querySelectorAll(selector)));

  const { destroy } = rovingFocus(node, {
    selector,
    getItems,
    orientation: "vertical",
    focusOnMove: true,
    skipDisabled: isDisabled !== undefined,
    isDisabled,
    getActiveIndex: () =>
      getItems().indexOf(/** @type {HTMLElement} */ (getActiveElement(node))),
    onMove: (_index, event) => event.preventDefault(),
  });

  return { destroy };
}
