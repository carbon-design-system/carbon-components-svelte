// @ts-check
import { get } from "svelte/store";
import { moveIndex } from "./move-index.js";

/**
 * Build ArrowUp/ArrowDown/Home/End navigation over the enabled
 * `[role="option"]` descendants of a menu element, tracking the active
 * option by id in `highlightedId`. Options marked `aria-disabled="true"`
 * are skipped.
 *
 * @param {Object} options
 * @param {() => HTMLElement | null} options.getMenuRef
 * @param {import("svelte/store").Writable<string | null>} options.highlightedId
 * @param {boolean} [options.includeHidden=false] - include `[hidden]`
 *   `[role="option"]` elements instead of skipping them.
 * @returns {{
 *   getOptionElements: () => HTMLElement[],
 *   moveActive: (step: 1 | -1) => void,
 *   setActiveEdge: (edge: "first" | "last") => void,
 *   setPointerActive: (id: string | null) => void,
 *   getKeyboardActiveOption: () => HTMLElement | null,
 * }}
 */
export function createOptionListNavigator({
  getMenuRef,
  highlightedId,
  includeHidden = false,
}) {
  const selector = includeHidden
    ? '[role="option"]'
    : '[role="option"]:not([hidden])';

  // Enter commits only an option reached with the keyboard, so a hover
  // highlight under a resting pointer can't take over a typed submit.
  let keyboardActive = false;

  function getOptionElements() {
    const menuRef = getMenuRef();
    if (!menuRef) return [];
    const options = /** @type {NodeListOf<HTMLElement>} */ (
      menuRef.querySelectorAll(selector)
    );
    return Array.from(options).filter(
      (option) => option.getAttribute("aria-disabled") !== "true",
    );
  }

  /** @param {1 | -1} step */
  function moveActive(step) {
    const els = getOptionElements();
    if (els.length === 0) {
      highlightedId.set(null);
      return;
    }
    const current = els.findIndex((option) => option.id === get(highlightedId));
    highlightedId.set(els[moveIndex(current, step, els.length)].id);
    keyboardActive = true;
  }

  /** @param {"first" | "last"} edge */
  function setActiveEdge(edge) {
    const els = getOptionElements();
    if (els.length === 0) return;
    highlightedId.set(els[edge === "first" ? 0 : els.length - 1].id);
    keyboardActive = true;
  }

  /** @param {string | null} id */
  function setPointerActive(id) {
    highlightedId.set(id);
    keyboardActive = false;
  }

  function getKeyboardActiveOption() {
    const id = get(highlightedId);
    if (!keyboardActive || !id) return null;
    return getOptionElements().find((option) => option.id === id) ?? null;
  }

  return {
    getOptionElements,
    moveActive,
    setActiveEdge,
    setPointerActive,
    getKeyboardActiveOption,
  };
}
