// @ts-check

import { nextIndex } from "./focus-nav.js";
import { hasModifierKey } from "./has-modifier-key.js";

/**
 * @typedef {"horizontal" | "vertical" | "both"} RovingFocusOrientation
 */

/**
 * @typedef {Object} RovingFocusOptions
 * @property {string} selector - Items inside `node`. Also filters which keydown events count.
 * @property {() => HTMLElement[]} [getItems] - Item list in tab order. Default: `node.querySelectorAll(selector)`.
 * @property {RovingFocusOrientation} [orientation] - "horizontal" = Left/Right, "vertical" = Up/Down, "both" = all four. Default "horizontal".
 * @property {boolean} [wrap] - Wrap at the ends. Default `true`; `false` clamps.
 * @property {boolean} [skipDisabled] - Skip disabled items. Default `false`.
 * @property {boolean} [home] - Home jumps to the first item. Default `true`.
 * @property {boolean} [end] - End jumps to the last item. Default `true`.
 * @property {(item: HTMLElement) => boolean} [isDisabled] - Default: `disabled` or `aria-disabled="true"`.
 * @property {() => number} getActiveIndex - Index to move from.
 * @property {(index: number, event: KeyboardEvent) => void} [onMove] - New index after a navigation key.
 * @property {boolean} [focusOnMove] - Call `.focus()` on the new item. Default `false`.
 * @property {boolean} [itemsOnly] - Ignore keydown from elements outside `getItems()`, such as matching controls in a nested popover. Default `false`.
 * @property {() => boolean} [rtl] - Read on each horizontal arrow key. When it returns `true`, ArrowLeft moves to the next item and ArrowRight to the previous one. Default: never.
 */

/**
 * Svelte action for arrow-key roving focus inside `node`.
 * Listens for keydown on matching items and on `node` when the list holds focus.
 * Calls `onMove(index, event)`. The index comes from `nextIndex`, the pure
 * key map that `createFocusNav` shares for grids, typeahead and virtualized
 * lists; this action keeps the item-query and callback shape its users
 * already have. Only Home/End without Alt, Ctrl or Meta call
 * `preventDefault`.
 *
 * @param {HTMLElement} node
 * @param {RovingFocusOptions} options
 */
export function rovingFocus(node, options) {
  let currentOptions = options;

  /** @param {HTMLElement} node */
  function defaultIsDisabled(node) {
    return (
      node.hasAttribute("disabled") ||
      node.getAttribute("aria-disabled") === "true"
    );
  }

  function getItems() {
    if (currentOptions.getItems) return currentOptions.getItems();
    return /** @type {HTMLElement[]} */ (
      Array.from(node.querySelectorAll(currentOptions.selector))
    );
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    // Item keydown, or keydown on `node` when the list itself is focused.
    if (target !== node && !target.closest(currentOptions.selector)) return;

    const orientation = currentOptions.orientation ?? "horizontal";
    const items = getItems();
    if (items.length === 0) return;
    if (
      currentOptions.itemsOnly &&
      target !== node &&
      !items.some((item) => item.contains(target))
    ) {
      return;
    }

    const { key } = event;
    const edge = key === "Home" || key === "End";
    if (edge) {
      // Leave Ctrl/Cmd+Home/End (scroll to the top or bottom) to the browser.
      if (hasModifierKey(event)) return;
      if (
        (key === "Home" ? currentOptions.home : currentOptions.end) === false
      ) {
        return;
      }
      event.preventDefault();
    }

    const isDisabled = currentOptions.isDisabled ?? defaultIsDisabled;
    // Read when the key arrives: nothing reports a `dir` change.
    const swap =
      (key === "ArrowLeft" || key === "ArrowRight") &&
      orientation !== "vertical" &&
      currentOptions.rtl?.() === true;
    const move = nextIndex(
      {
        index: edge ? -1 : currentOptions.getActiveIndex(),
        count: items.length,
      },
      key,
      {
        orientation,
        wrap: currentOptions.wrap !== false,
        rtl: swap,
        skip: currentOptions.skipDisabled
          ? (i) => isDisabled(items[i])
          : undefined,
      },
    );
    if (!move) return;
    const index = move.index;
    if (index < 0) return;
    currentOptions.onMove?.(index, event);
    if (currentOptions.focusOnMove) items[index]?.focus();
  }

  node.addEventListener("keydown", handleKeydown);

  return {
    /** @param {RovingFocusOptions} update */
    update(update) {
      currentOptions = update;
    },
    destroy() {
      node.removeEventListener("keydown", handleKeydown);
    },
  };
}
