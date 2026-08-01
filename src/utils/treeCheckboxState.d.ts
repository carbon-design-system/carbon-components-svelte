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
  conduct?: boolean;
};

type TreeCheckboxState<Id extends string | number> = {
  selectedIds: Id[];
  indeterminateIds: Id[];
};

/** Derive the selected and indeterminate ids of a tree from a set of selected ids. */
export function resolveCheckboxState<T extends NodeLike>(
  nodes: readonly T[],
  selectedIds: readonly T["id"][],
  options?: TreeCheckboxOptions,
): TreeCheckboxState<T["id"]>;

/** Compute the next selection after checking or unchecking one node. */
export function toggleCheckboxNode<T extends NodeLike>(
  nodes: readonly T[],
  selectedIds: readonly T["id"][],
  id: T["id"],
  checked: boolean,
  options?: TreeCheckboxOptions,
): T["id"][];
