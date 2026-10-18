/**
 * Finds a tree row by its `data-tree-row-id`, or `null` if it isn't mounted
 * (for example a virtualized row outside the windowed slice).
 */
export function findRowById(id: string | number) {
  return document.querySelector<HTMLElement>(
    `[data-tree-row-id="${CSS.escape(String(id))}"]`,
  );
}

/** Finds a mounted tree row by its `data-tree-row-id`, failing if it is missing. */
export function treeItemById(id: string | number): HTMLElement {
  const el = findRowById(id);
  assert(el instanceof HTMLElement);
  return el;
}
