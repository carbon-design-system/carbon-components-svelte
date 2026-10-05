/**
 * The element that holds a virtualized list's rendered rows: the child of the
 * scroll spacer, which is itself the first child of the scroll container.
 */
export function virtualWindowLayer(container: Element): HTMLElement {
  const layer = container.querySelector(":scope > div > div");
  assert(layer instanceof HTMLElement);
  return layer;
}
