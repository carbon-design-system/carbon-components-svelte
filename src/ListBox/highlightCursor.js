// @ts-check
import { writable } from "svelte/store";
import { scrollIntoViewWithinMenu } from "../utils/scrollIntoViewWithinMenu.js";

export const HIGHLIGHT_CURSOR_KEY = "carbon:ListBoxHighlight";

const HIGHLIGHT_CLASS = "bx--list-box__menu-item--highlighted";
const ACTIVE_CLASS = "bx--list-box__menu-item--active";

/**
 * Two-node highlight cursor for listbox options.
 *
 * Arrow/hover changes write a class on the previous and next option nodes
 * instead of passing `highlighted` through the `{#each}` so Svelte does not
 * invalidate every `ListBoxMenuItem` (and re-run `overflowTitle`) per key.
 *
 * Selected options keep the highlight class via `ListBoxMenuItem`'s `active`
 * class directive; this cursor will not strip it from an `--active` node.
 *
 * @returns {{
 *   register: (id: string, node: HTMLElement) => () => void;
 *   set: (id: string | null | undefined, options?: { scroll?: boolean }) => void;
 *   highlightedId: { subscribe: import("svelte/store").Readable<string | null>["subscribe"] };
 * }}
 */
export function createHighlightCursor() {
  /** @type {Map<string, HTMLElement>} */
  const nodes = new Map();
  /** @type {string | null} */
  let currentId = null;
  const highlightedId = writable(/** @type {string | null} */ (null));

  /**
   * @param {HTMLElement} node
   * @param {boolean} on
   */
  function applyClass(node, on) {
    if (on || node.classList.contains(ACTIVE_CLASS)) {
      node.classList.add(HIGHLIGHT_CLASS);
      return;
    }
    node.classList.remove(HIGHLIGHT_CLASS);
  }

  /**
   * @param {string} id
   * @param {HTMLElement} node
   * @returns {() => void}
   */
  function register(id, node) {
    if (!id) return () => {};
    nodes.set(id, node);
    applyClass(node, currentId === id);
    return () => {
      if (nodes.get(id) === node) nodes.delete(id);
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
    if (prev) applyClass(prev, false);
    if (next) {
      applyClass(next, true);
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
