/** Returns the tree node rendered with the given `id`. */
export function treeItemById(id: string | number): HTMLElement {
  const el = document.getElementById(String(id));
  assert(el instanceof HTMLElement);
  return el;
}
