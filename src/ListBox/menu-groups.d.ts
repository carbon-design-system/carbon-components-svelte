export type Groupable = { group?: string };

export type GroupHeaderRow<Item extends Groupable> = {
  /** Stable key for a keyed `{#each}`. A symbol cannot collide with an item id. */
  id: symbol;
  group: string;
  /** The group's items, in row order. */
  items: Item[];
};

export type GroupRows<Item extends Groupable> = {
  /** Items with a header row before each group's first item. */
  rows: Array<Item | GroupHeaderRow<Item>>;
  /** Item index for each row, `-1` for a header. */
  itemIndexByRow: number[];
  /** Row index for each item. */
  rowIndexByItem: number[];
  /** Index into `headers` for each row, `-1` when ungrouped. */
  groupIndexByRow: number[];
  headers: GroupHeaderRow<Item>[];
};

/**
 * Reorder `entries` so each group is contiguous: ungrouped entries first, then
 * groups in order of first appearance. `compare` sorts within each group,
 * never across groups. An empty group label counts as ungrouped.
 *
 * Returns a new array; `entries` is not mutated.
 */
export declare function orderByGroup<T>(
  entries: ReadonlyArray<T>,
  getGroup: (entry: T) => string | undefined,
  compare?: (a: T, b: T) => number,
): T[];

/**
 * Move the items matching `predicate` to the top of their group, keeping
 * relative order otherwise. A group is a run of adjacent items with the same
 * `group`, so ungrouped input is one run.
 */
export declare function hoistWithinGroups<Item extends Groupable>(
  items: ReadonlyArray<Item>,
  predicate: (item: Item) => boolean,
): Item[];

/**
 * Build the rows a grouped listbox menu renders: a header row before the
 * first item of each run of same-group items, plus the index maps between
 * item positions and row positions.
 *
 * Header keys are cached per label across calls so a keyed `{#each}` keeps
 * the same header node when the list rebuilds.
 */
export declare function createGroupRows<Item extends Groupable>(): (
  items: ReadonlyArray<Item>,
) => GroupRows<Item>;

export type GroupRun = {
  /** Stable key for a keyed `{#each}`. */
  key: unknown;
  /** Row index of the run's first row. */
  start: number;
  rows: unknown[];
  /** Index into `headers`, `-1` when ungrouped. */
  groupIndex: number;
};

/**
 * Split the rows a menu renders into runs of the same group, so each group's
 * rows can sit inside one `role="group"` element. A virtualized window can
 * start or end partway through a group; its run still gets the group.
 *
 * Without `groupRows`, the whole window is one ungrouped run.
 */
export declare function splitGroupRuns(
  rows: ReadonlyArray<unknown>,
  start: number,
  groupRows: GroupRows<Groupable> | null,
): GroupRun[];
