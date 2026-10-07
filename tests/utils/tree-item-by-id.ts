export function treeItemById(id: string | number): HTMLElement {
  const el = document.querySelector(
    `[data-tree-row-id="${CSS.escape(String(id))}"]`,
  );
  assert(el instanceof HTMLElement);
  return el;
}
