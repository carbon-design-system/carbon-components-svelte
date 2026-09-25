export function treeItemById(id: string | number): HTMLElement {
  const el = document.getElementById(String(id));
  assert(el instanceof HTMLElement);
  return el;
}
