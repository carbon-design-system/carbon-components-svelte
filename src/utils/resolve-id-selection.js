// @ts-check

import { clampIndex } from "./clamp-index.js";

/**
 * Resolve a selected index from a selected id within an ordered list of
 * items. If the id is missing from the list (its item was removed), clamp
 * the previous index into range and re-anchor to whatever item that index
 * now resolves to.
 *
 * @template {{ id: string }} T
 * @param {object} params
 * @param {ReadonlyArray<T>} params.items
 * @param {string} params.selectedId
 * @param {number} params.currentIndex
 * @returns {{ index: number, id: string } | null} `null` when `items`
 *   is empty and `selectedId` is not found.
 */
export function resolveIdSelection({ items, selectedId, currentIndex }) {
  const index = items.findIndex((item) => item.id === selectedId);
  if (index > -1) return { index, id: selectedId };
  if (items.length === 0) return null;
  const clamped = clampIndex(currentIndex, 0, items.length);
  return { index: clamped, id: items[clamped]?.id };
}
