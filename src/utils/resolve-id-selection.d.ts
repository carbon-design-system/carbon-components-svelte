/**
 * Resolve a selected index from a selected id within an ordered list of
 * items. If the id is missing from the list (its item was removed),
 * clamp the previous index into range and re-anchor to whatever item
 * that index now resolves to.
 */
export function resolveIdSelection<T extends { id: string }>(params: {
  items: ReadonlyArray<T>;
  selectedId: string;
  currentIndex: number;
}): { index: number; id: string } | null;
