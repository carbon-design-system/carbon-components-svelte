// @ts-check
// Pointer and keyboard selection over an ordered list of ids, as a file
// browser does it: click selects one, Cmd or Ctrl toggles one, Shift selects
// the range from the anchor. The list order is an argument of every call, so
// a selection by id survives a sort and a switch between a table and a grid.

/**
 * @template [Id=string]
 * @typedef {Object} SelectionState
 * @property {ReadonlyArray<Id>} selected
 * @property {Id | null} anchor - Where a Shift range starts.
 */

/**
 * @template [Id=string]
 * @param {ReadonlyArray<Id>} ordered
 * @param {Id} from
 * @param {Id} to
 * @returns {Id[]} Both ends and everything between, in list order.
 */
export function rangeBetween(ordered, from, to) {
  const start = ordered.indexOf(from);
  const end = ordered.indexOf(to);
  if (start < 0 || end < 0) return end < 0 ? [] : [to];
  return ordered.slice(Math.min(start, end), Math.max(start, end) + 1);
}

/**
 * The selection after a click or key on `id`.
 * @template [Id=string]
 * @param {SelectionState<Id>} state
 * @param {ReadonlyArray<Id>} ordered - Every id in the order it is shown.
 * @param {Id} id
 * @param {{ shift?: boolean, toggle?: boolean }} [modifiers]
 * @returns {SelectionState<Id>}
 */
export function selectWith(
  state,
  ordered,
  id,
  { shift = false, toggle = false } = {},
) {
  if (shift) {
    const anchor =
      state.anchor !== null && ordered.includes(state.anchor)
        ? state.anchor
        : (state.selected.find((selected) => ordered.includes(selected)) ?? id);
    const range = rangeBetween(ordered, anchor, id);
    // Cmd or Ctrl with Shift adds the range to what is selected already.
    const selected = toggle
      ? [...new Set([...state.selected, ...range])]
      : range;
    return { selected, anchor };
  }
  if (toggle) {
    const has = state.selected.includes(id);
    return {
      selected: has
        ? state.selected.filter((selected) => selected !== id)
        : [...state.selected, id],
      anchor: id,
    };
  }
  return { selected: [id], anchor: id };
}

/**
 * @template [Id=string]
 * @param {ReadonlyArray<Id>} ordered
 * @param {SelectionState<Id>} [state] - Keeps the anchor.
 * @returns {SelectionState<Id>}
 */
export function selectEvery(ordered, state) {
  return {
    selected: [...ordered],
    anchor: state?.anchor ?? ordered[0] ?? null,
  };
}

/**
 * Drop ids that are no longer in the list, such as after a delete, a move
 * or a change of folder.
 * @template [Id=string]
 * @param {SelectionState<Id>} state
 * @param {{ has(id: Id): boolean }} present
 * @returns {SelectionState<Id>}
 */
export function pruneSelection(state, present) {
  const selected = state.selected.filter((id) => present.has(id));
  const anchor =
    state.anchor !== null && present.has(state.anchor) ? state.anchor : null;
  return selected.length === state.selected.length && anchor === state.anchor
    ? state
    : { selected, anchor };
}
