// @ts-check
import { writable } from "svelte/store";
import { scrollIntoViewWithinMenu } from "../utils/scroll-into-view-within-menu.js";

export const HIGHLIGHT_CURSOR_KEY = "carbon:ListBoxHighlight";

const HIGHLIGHT_CLASS = "bx--list-box__menu-item--highlighted";

/**
 * Two-node highlight cursor for listbox options.
 *
 * Arrow/hover changes write a class on the previous and next option nodes
 * instead of passing `highlighted` through the `{#each}` so Svelte does not
 * invalidate every `ListBoxMenuItem` (and re-run `overflowTitle`) per key.
 *
 * Selected options keep the highlight class while `active`; this cursor
 * tracks active ids itself instead of reading the `--active` class back off
 * the DOM, since that class is written by `ListBoxMenuItem`'s own `class:`
 * directive and is not guaranteed to have been patched onto the node yet by
 * the time this cursor runs in the same update cycle.
 *
 * @returns {{
 *   register: (id: string, node: HTMLElement, isActive?: boolean) => () => void;
 *   set: (id: string | null | undefined, options?: { scroll?: boolean }) => void;
 *   highlightedId: { subscribe: import("svelte/store").Readable<string | null>["subscribe"] };
 * }}
 */
export function createHighlightCursor() {
  /** @type {Map<string, HTMLElement>} */
  const nodes = new Map();
  /** @type {Set<string>} */
  const activeIds = new Set();
  /** @type {string | null} */
  let currentId = null;
  const highlightedId = writable(/** @type {string | null} */ (null));

  /**
   * @param {HTMLElement} node
   * @param {boolean} isCurrent
   * @param {boolean} isActive
   */
  function applyClass(node, isCurrent, isActive) {
    node.classList.toggle(HIGHLIGHT_CLASS, isCurrent || isActive);
  }

  /**
   * @param {string} id
   * @param {HTMLElement} node
   * @param {boolean} [isActive]
   * @returns {() => void}
   */
  function register(id, node, isActive = false) {
    if (!id) return () => {};
    nodes.set(id, node);
    if (isActive) {
      activeIds.add(id);
    } else {
      activeIds.delete(id);
    }
    applyClass(node, currentId === id, isActive);
    return () => {
      if (nodes.get(id) === node) nodes.delete(id);
      activeIds.delete(id);
    };
  }

  /**
   * @param {string | null | undefined} id
   * @param {{ scroll?: boolean }} [options]
   */
  function set(id, { scroll = true } = {}) {
    const nextId = id || null;
    if (nextId === currentId) return;

    const prev = currentId ? nodes.get(currentId) : undefined;
    const next = nextId ? nodes.get(nextId) : undefined;
    if (prev) applyClass(prev, false, activeIds.has(currentId));
    if (next) {
      applyClass(next, true, true);
      if (scroll && !next.matches(":hover")) {
        const inner = next.querySelector(".bx--list-box__menu-item__option");
        scrollIntoViewWithinMenu(inner instanceof HTMLElement ? inner : next);
      }
    }

    currentId = nextId;
    highlightedId.set(nextId);
  }

  return {
    register,
    set,
    highlightedId: { subscribe: highlightedId.subscribe },
  };
}
