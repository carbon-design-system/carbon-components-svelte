// @ts-check
import { observeResize } from "./shared-observer.js";

/**
 * `true` when the text in `node` overflows its box, so CSS clips it. A
 * single line overflows sideways; a line-clamped block overflows downward.
 * Only the clamped axis counts, since a glyph or an inline box can poke out
 * of the other one without hiding any text.
 * @param {HTMLElement} node
 * @param {boolean} [multiline]
 */
export function isTruncated(node, multiline = false) {
  return multiline
    ? node.scrollHeight > node.clientHeight
    : node.scrollWidth > node.clientWidth;
}

/**
 * Call `callback` after the first layout, then whenever `node` resizes or
 * its text changes. Text can change without a resize, such as a single line
 * whose width the container sets. Sizes come from the shared
 * `ResizeObserver`, so many instances measure in one layout.
 * @param {HTMLElement} node
 * @param {() => void} callback
 * @returns {() => void} Stops observing.
 */
export function observeTruncation(node, callback) {
  const stopResize = observeResize(node, callback);
  if (typeof MutationObserver === "undefined") return stopResize;

  const mutations = new MutationObserver(callback);
  mutations.observe(node, {
    characterData: true,
    childList: true,
    subtree: true,
  });

  return () => {
    stopResize();
    mutations.disconnect();
  };
}
