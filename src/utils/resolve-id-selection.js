// @ts-check

import { clampIndex } from "./clamp-index.js";

/**
 * Resolve a selected index from a selected id within an ordered list of
 * items. If the id is missing from the list (its item was removed), clamp
 * the previous index into range and re-anchor to whatever item that index
 * now resolves to.
 *
 * A freshly set id (`idChanged`) can name an item that registers in the same
 * update, after this runs. A missing id is then left alone: the caller
 * resolves again once the items change, and falls back if it is still
 * missing.
 *
 * @template {{ id: string }} T
 * @param {object} params
 * @param {ReadonlyArray<T>} params.items
 * @param {string} params.selectedId
 * @param {number} params.currentIndex
 * @param {boolean} [params.idChanged] `selectedId` differs from the one
 *   last resolved.
 * @returns {{ index: number, id: string } | null} `null` when `items`
 *   is empty, or a changed `selectedId` is not found.
 */
export function resolveIdSelection({
  items,
  selectedId,
  currentIndex,
  idChanged = false,
}) {
  const index = items.findIndex((item) => item.id === selectedId);
  if (index > -1) return { index, id: selectedId };
  if (items.length === 0 || idChanged) return null;
  const clamped = clampIndex(currentIndex, 0, items.length);
  return { index: clamped, id: items[clamped]?.id };
}
