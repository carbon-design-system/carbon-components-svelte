// @ts-check

import { clampIndex } from "./clamp-index.js";
import { hasModifierKey } from "./has-modifier-key.js";
import { moveIndex, nextEnabledIndex } from "./move-index.js";

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
 * Calls `onMove(index, event)`. Index math uses moveIndex, clampIndex, and
 * nextEnabledIndex. Only Home/End without Alt, Ctrl or Meta call
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

  /**
   * @param {HTMLElement[]} items
   * @param {number} direction
   */
  function moveBy(items, direction) {
    const index = currentOptions.getActiveIndex();
    if (currentOptions.skipDisabled) {
      const isDisabled = currentOptions.isDisabled ?? defaultIsDisabled;
      return nextEnabledIndex({
        items,
        index,
        step: direction,
        isDisabled,
        wrap: currentOptions.wrap !== false,
      });
    }
    return currentOptions.wrap === false
      ? clampIndex(index, direction, items.length)
      : moveIndex(index, direction, items.length);
  }

  /**
   * @param {HTMLElement[]} items
   * @param {1 | -1} direction - 1 for the first item, -1 for the last.
   */
  function edge(items, direction) {
    if (!currentOptions.skipDisabled) {
      return direction === 1 ? 0 : items.length - 1;
    }
    const isDisabled = currentOptions.isDisabled ?? defaultIsDisabled;
    return nextEnabledIndex({ items, index: -1, step: direction, isDisabled });
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    // Item keydown, or keydown on `node` when the list itself is focused.
    if (target !== node && !target.closest(currentOptions.selector)) return;

    const orientation = currentOptions.orientation ?? "horizontal";
    const horizontal = orientation === "horizontal" || orientation === "both";
    const vertical = orientation === "vertical" || orientation === "both";

    const items = getItems();
    if (items.length === 0) return;
    if (
      currentOptions.itemsOnly &&
      target !== node &&
      !items.some((item) => item.contains(target))
    ) {
      return;
    }

    const inline =
      horizontal && (event.key === "ArrowLeft" || event.key === "ArrowRight");
    // Read when the key arrives: nothing reports a `dir` change.
    const forward =
      inline && currentOptions.rtl?.() ? "ArrowLeft" : "ArrowRight";

    let index = -1;
    if (
      (inline && event.key === forward) ||
      (vertical && event.key === "ArrowDown")
    ) {
      index = moveBy(items, 1);
    } else if (inline || (vertical && event.key === "ArrowUp")) {
      index = moveBy(items, -1);
    } else if (hasModifierKey(event)) {
      // Leave Ctrl/Cmd+Home/End (scroll to the top or bottom) to the browser.
      return;
    } else if (currentOptions.home !== false && event.key === "Home") {
      event.preventDefault();
      index = edge(items, 1);
    } else if (currentOptions.end !== false && event.key === "End") {
      event.preventDefault();
      index = edge(items, -1);
    } else {
      return;
    }

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
