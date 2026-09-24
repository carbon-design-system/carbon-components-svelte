// @ts-check

/**
 * DOM attribute set on each rendered tree row so `TreeView` can locate a
 * row by node id without keeping its own ref map (used for scroll-into-view
 * and event-target lookups in the virtualized and non-virtualized paths).
 */
export const TREE_ROW_ID_ATTR = "data-tree-row-id";

/**
 * CSS attribute selector matching the row for `id`.
 * @param {string | number} id
 * @returns {string}
 */
export function treeRowIdSelector(id) {
  return `[${TREE_ROW_ID_ATTR}="${CSS.escape(String(id))}"]`;
}
