export interface SelectionState<Id = string> {
  selected: ReadonlyArray<Id>;
  /** Where a Shift range starts. */
  anchor: Id | null;
}

/** Both ends and everything between, in list order. */
export function rangeBetween<Id = string>(
  ordered: ReadonlyArray<Id>,
  from: Id,
  to: Id,
): Id[];

/**
 * The selection after a click or key on `id`. Cmd or Ctrl toggles one id,
 * Shift selects the range from the anchor, and both add that range.
 */
export function selectWith<Id = string>(
  state: SelectionState<Id>,
  /** Every id in the order it is shown. */
  ordered: ReadonlyArray<Id>,
  id: Id,
  modifiers?: { shift?: boolean; toggle?: boolean },
): SelectionState<Id>;

export function selectEvery<Id = string>(
  ordered: ReadonlyArray<Id>,
  state?: SelectionState<Id>,
): SelectionState<Id>;

/** Drop ids that are no longer in the list. */
export function pruneSelection<Id = string>(
  state: SelectionState<Id>,
  present: { has(id: Id): boolean },
): SelectionState<Id>;
