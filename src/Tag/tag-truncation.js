// @ts-check
import { observeResize } from "../utils/shared-observer.js";

/**
 * `true` when the text in `node` overflows its box, so an ellipsis shows.
 * @param {HTMLElement} node
 */
export function isTruncated(node) {
  return node.scrollWidth > node.clientWidth;
}

/**
 * Report whether a tag label is truncated: once after its first layout,
 * then on every size change, such as a container that narrows below
 * `maxWidth="100%"`. Every tag shares one `ResizeObserver`, so a row of
 * tags measures in one layout.
 * @param {HTMLElement} node
 * @param {(truncated: boolean) => void} callback
 * @returns {() => void} Stops observing.
 */
export function observeTruncation(node, callback) {
  return observeResize(node, () => callback(isTruncated(node)));
}
