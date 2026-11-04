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
 */
export function resolveIdSelection<T extends { id: string }>(params: {
  items: ReadonlyArray<T>;
  selectedId: string;
  currentIndex: number;
  /** `selectedId` differs from the one last resolved. */
  idChanged?: boolean;
}): { index: number; id: string } | null;
