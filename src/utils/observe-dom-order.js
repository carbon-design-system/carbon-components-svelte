// @ts-check

/**
 * Call `onReorder` when the elements matching `selector` inside `root` move
 * out of the order of `getItems()`.
 *
 * A keyed `{#each}` reorder moves slotted children without re-registering
 * them, and on Svelte 5 it doesn't run the parent's `afterUpdate` either, so
 * a registry kept in DOM order goes stale. Only registered ids that are in
 * the DOM are compared: an insert or removal still in flight is the
 * registry's own job.
 *
 * @param {Element} root - Element to watch, including its subtree.
 * @param {object} options
 * @param {string} options.selector - CSS selector for the ordered elements.
 * @param {() => ReadonlyArray<{ id: string }>} options.getItems - Registered items, in their current order.
 * @param {() => void} options.onReorder - Called after a mutation leaves the DOM out of registry order.
 * @returns {() => void} Stops observing.
 */
export function observeDomOrder(root, { selector, getItems, onReorder }) {
  const observer = new MutationObserver(() => {
    const ids = getItems().map((item) => item.id);
    const registered = new Set(ids);
    const domIds = Array.from(root.querySelectorAll(selector), (el) => el.id);
    const present = new Set(domIds);
    const inDom = domIds.filter((id) => registered.has(id));
    const inRegistry = ids.filter((id) => present.has(id));
    if (inDom.some((id, index) => id !== inRegistry[index])) onReorder();
  });
  observer.observe(root, { childList: true, subtree: true });
  return () => observer.disconnect();
}
