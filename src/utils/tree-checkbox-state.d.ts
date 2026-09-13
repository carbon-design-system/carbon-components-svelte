type NodeLike = {
  id: string | number;
  disabled?: boolean;
  nodes?: NodeLike[];
  [key: string]: unknown;
};

type TreeCheckboxOptions = {
  /**
   * Propagate checks to descendants and derive ancestor state.
   * @default true
   */
  cascade?: boolean;
};

type TreeCheckboxState<Id extends string | number> = {
  checkedIds: Id[];
  indeterminateIds: Id[];
};

/** Derive the checked and indeterminate ids of a tree from a set of checked ids. */
export function resolveCheckboxState<T extends NodeLike>(
  nodes: readonly T[],
  checkedIds: readonly T["id"][],
  options?: TreeCheckboxOptions,
): TreeCheckboxState<T["id"]>;

/**
 * Next seed of checked ids after toggling one node.
 * Pass through `resolveCheckboxState` before use; this does not derive
 * ancestor checked or indeterminate state.
 */
export function toggleCheckboxNode<T extends NodeLike>(
  nodes: readonly T[],
  checkedIds: readonly T["id"][],
  id: T["id"],
  checked: boolean,
  options?: TreeCheckboxOptions,
): T["id"][];
