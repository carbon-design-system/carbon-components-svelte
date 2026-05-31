// @ts-check
/**
 * Reorder a collection of id-bearing items to match the DOM order of the
 * elements matching `selector` within `root`.
 *
 * Slotted children register with their parent in mount order, which can
 * diverge from visual DOM order when children are conditionally rendered or
 * reordered. This re-sorts the collection to the DOM and reassigns a
 * contiguous `index` to each item. Items with no matching DOM element (e.g.
 * removed mid-update) are dropped.
 *
 * @template {{ id: string }} T
 * @param {Object} options
 * @param {Element} options.root - Element to query within.
 * @param {string} options.selector - CSS selector for the ordered child elements.
 * @param {ReadonlyArray<T>} options.items - Items to reorder, keyed by `id`.
 * @returns {Array<T & { index: number }>} Items in DOM order with reassigned `index`.
 */
export function syncDomOrder({ root, selector, items }) {
  const itemsById = new Map(items.map((item) => [item.id, item]));
  /** @type {Array<T & { index: number }>} */
  const ordered = [];
  const elements = root.querySelectorAll(selector);

  for (let index = 0; index < elements.length; index++) {
    const item = itemsById.get(elements[index].id);
    if (item) ordered.push({ ...item, index });
  }

  return ordered;
}
