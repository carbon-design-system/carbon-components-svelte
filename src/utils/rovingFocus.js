// @ts-check

import { clampIndex } from "./clampIndex.js";
import { moveIndex, nextEnabledIndex } from "./moveIndex.js";

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
 */

/**
 * Svelte action for arrow-key roving focus inside `node`.
 * Listens for keydown on matching items and on `node` when the list holds focus.
 * Calls `onMove(index, event)`. Index math uses moveIndex, clampIndex, and
 * nextEnabledIndex. Only Home/End call `preventDefault`.
 *
 * @param {HTMLElement} node
 * @param {RovingFocusOptions} options
 */
export function rovingFocus(node, options) {
  let opts = options;

  /** @param {HTMLElement} el */
  const defaultIsDisabled = (el) =>
    el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true";

  function getItems() {
    if (opts.getItems) return opts.getItems();
    return /** @type {HTMLElement[]} */ (
      Array.from(node.querySelectorAll(opts.selector))
    );
  }

  /**
   * @param {HTMLElement[]} items
   * @param {number} direction
   */
  function moveBy(items, direction) {
    const index = opts.getActiveIndex();
    if (opts.skipDisabled) {
      const isDisabled = opts.isDisabled ?? defaultIsDisabled;
      return nextEnabledIndex({ items, index, step: direction, isDisabled });
    }
    return opts.wrap === false
      ? clampIndex(index, direction, items.length)
      : moveIndex(index, direction, items.length);
  }

  /**
   * @param {HTMLElement[]} items
   * @param {1 | -1} direction - 1 for the first item, -1 for the last.
   */
  function edge(items, direction) {
    if (!opts.skipDisabled) {
      return direction === 1 ? 0 : items.length - 1;
    }
    const isDisabled = opts.isDisabled ?? defaultIsDisabled;
    return nextEnabledIndex({ items, index: -1, step: direction, isDisabled });
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    // Item keydown, or keydown on `node` when the list itself is focused.
    if (target !== node && !target.closest(opts.selector)) return;

    const orientation = opts.orientation ?? "horizontal";
    const horizontal = orientation === "horizontal" || orientation === "both";
    const vertical = orientation === "vertical" || orientation === "both";

    const items = getItems();
    if (items.length === 0) return;

    let index = -1;
    if (
      (horizontal && event.key === "ArrowRight") ||
      (vertical && event.key === "ArrowDown")
    ) {
      index = moveBy(items, 1);
    } else if (
      (horizontal && event.key === "ArrowLeft") ||
      (vertical && event.key === "ArrowUp")
    ) {
      index = moveBy(items, -1);
    } else if (opts.home !== false && event.key === "Home") {
      event.preventDefault();
      index = edge(items, 1);
    } else if (opts.end !== false && event.key === "End") {
      event.preventDefault();
      index = edge(items, -1);
    } else {
      return;
    }

    if (index < 0) return;
    opts.onMove?.(index, event);
    if (opts.focusOnMove) items[index]?.focus();
  }

  node.addEventListener("keydown", handleKeydown);

  return {
    /** @param {RovingFocusOptions} update */
    update(update) {
      opts = update;
    },
    destroy() {
      node.removeEventListener("keydown", handleKeydown);
    },
  };
}
