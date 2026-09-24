/**
 * Finds a virtualized row by its `data-tree-row-id`, or `null` if the row
 * falls outside the windowed slice and isn't mounted.
 */
export function findRowById(id: string | number) {
  return document.querySelector<HTMLElement>(
    `[data-tree-row-id="${CSS.escape(String(id))}"]`,
  );
}
