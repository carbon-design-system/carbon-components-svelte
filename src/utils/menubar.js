// @ts-check

import { derived, get, writable } from "svelte/store";
import { createDomNodeRegistry } from "./dom-node-registry.js";
import { moveIndex } from "./move-index.js";
import { sortByDomOrder } from "./sort-by-dom-order.js";
import {
  createTypeaheadBuffer,
  isTypeaheadKey,
  typeaheadIndex,
} from "./typeahead.js";

/**
 * Roving-tabindex bookkeeping and horizontal keyboard navigation for a WAI-ARIA
 * menubar. Top-level items register their focusable element; the bar keeps one
 * of them as the single Tab stop (the last focused item, else the current-page
 * item, else the first). ArrowLeft and ArrowRight move between items with wrap,
 * Home and End jump to the ends, and typing a character focuses the next item
 * whose label starts with it.
 *
 * An item's submenu lives in the same container as its focusable element, so
 * key presses and focus inside an open submenu are attributed to the item that
 * owns it.
 *
 * @returns {{
 *   register: (node: HTMLElement) => void,
 *   unregister: (node: HTMLElement) => void,
 *   setCurrent: (node: HTMLElement, isCurrent: boolean) => void,
 *   tabStop: import("svelte/store").Readable<HTMLElement | undefined>,
 *   handleKeydown: (event: KeyboardEvent) => void,
 *   handleFocusin: (event: FocusEvent) => void,
 *   destroy: () => void,
 * }}
 */
export function createMenubar() {
  const registry = createDomNodeRegistry();
  /** @type {import("svelte/store").Writable<ReadonlySet<HTMLElement>>} */
  const current = writable(new Set());
  /** @type {import("svelte/store").Writable<HTMLElement | null>} */
  const active = writable(null);
  /**
   * Registration order is mount order, which differs from DOM order for
   * conditionally rendered items.
   * @param {ReadonlyArray<HTMLElement>} list
   * @returns {HTMLElement[]}
   */
  const inDomOrder = (list) =>
    sortByDomOrder(list.map((node) => ({ node }))).map(({ node }) => node);

  /** @type {import("svelte/store").Readable<HTMLElement[]>} */
  const ordered = derived(registry.items, inDomOrder);
  const getNodes = () => get(ordered);

  const tabStop = derived(
    [ordered, current, active],
    ([$ordered, $current, $active]) => {
      if ($active && $ordered.includes($active)) return $active;
      return $ordered.find((node) => $current.has(node)) ?? $ordered[0];
    },
  );

  const typeahead = createTypeaheadBuffer();

  /** @param {EventTarget | null} target */
  function ownerOf(target) {
    return getNodes().find((node) =>
      node.parentElement?.contains(/** @type {Node} */ (target)),
    );
  }

  return {
    register: registry.register,
    unregister: registry.unregister,
    setCurrent(node, isCurrent) {
      current.update((set) => {
        if (set.has(node) === isCurrent) return set;
        const next = new Set(set);
        if (isCurrent) next.add(node);
        else next.delete(node);
        return next;
      });
    },
    tabStop,
    handleKeydown(event) {
      if (event.defaultPrevented) return;
      if (isTypeaheadKey(event)) {
        registry.flush();
        const nodes = getNodes();
        const index = nodes.indexOf(/** @type {HTMLElement} */ (event.target));
        // Typing inside a submenu belongs to the submenu.
        if (index === -1) return;
        const next = typeaheadIndex({
          items: nodes,
          query: typeahead.push(event.key),
          itemToString: (node) => node.textContent?.trim() ?? "",
          index,
          isDisabled: () => false,
        });
        if (next !== index) {
          event.preventDefault();
          nodes[next].focus();
        }
        return;
      }
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return;
      }
      const { key } = event;
      if (
        key !== "ArrowLeft" &&
        key !== "ArrowRight" &&
        key !== "Home" &&
        key !== "End"
      ) {
        return;
      }
      registry.flush();
      const owner = ownerOf(event.target);
      if (!owner) return;
      // Inside a submenu, Home and End belong to the submenu's own items.
      if ((key === "Home" || key === "End") && event.target !== owner) return;

      const nodes = getNodes();
      const index = nodes.indexOf(owner);
      const next =
        key === "ArrowRight"
          ? nodes[moveIndex(index, 1, nodes.length)]
          : key === "ArrowLeft"
            ? nodes[moveIndex(index, -1, nodes.length)]
            : key === "Home"
              ? nodes[0]
              : nodes[nodes.length - 1];
      event.preventDefault();
      next?.focus();
    },
    handleFocusin(event) {
      const owner = ownerOf(event.target);
      if (owner) active.set(owner);
    },
    destroy: typeahead.clear,
  };
}
