// @ts-check
// Document-unique ids for SVG references such as `clip-path="url(#…)"`.

let count = 0;

/**
 * An id that no other call has returned. A counter, not a random string, so
 * a server render and the browser's first render agree as long as they
 * create components in the same order.
 *
 * @param {string} prefix
 * @returns {string}
 */
export function nextId(prefix) {
  count += 1;
  return `${prefix}-${count}`;
}
