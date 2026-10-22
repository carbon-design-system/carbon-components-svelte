// @ts-check
import { writable } from "svelte/store";
import { scrollIntoViewWithin } from "../utils/scroll-into-view-within.js";

export const HIGHLIGHT_CURSOR_KEY = "carbon:ListBoxHighlight";

const HIGHLIGHT_CLASS = "bx--list-box__menu-item--highlighted";

/**
 * Two-node highlight cursor for listbox options.
 *
 * Arrow/hover changes write a class on the previous and next option nodes
 * instead of passing `highlighted` through the `{#each}` so Svelte does not
 * invalidate every `ListBoxMenuItem` (and re-run `overflowTitle`) per key.
 *
 * Only the option under the cursor carries the class. A selected option
 * shows `--active` instead, so the focus outline marks one option at a time.
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
   * @param {string} id
   * @param {HTMLElement} node
   * @returns {() => void}
   */
  function register(id, node) {
    if (!id) return () => {};
    nodes.set(id, node);
    node.classList.toggle(HIGHLIGHT_CLASS, currentId === id);
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
    prev?.classList.remove(HIGHLIGHT_CLASS);
    if (next) {
      next.classList.add(HIGHLIGHT_CLASS);
      if (scroll && !next.matches(":hover")) {
        const inner = next.querySelector(".bx--list-box__menu-item__option");
        scrollIntoViewWithin(inner instanceof HTMLElement ? inner : next);
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
