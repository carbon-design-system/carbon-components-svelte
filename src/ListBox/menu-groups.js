// @ts-check

/**
 * @typedef {{ group?: string }} Groupable
 */

/**
 * @template {Groupable} Item
 * @typedef {Object} GroupHeaderRow
 * @property {symbol} id Stable key for a keyed `{#each}`. A symbol cannot
 * collide with an item id.
 * @property {string} group
 * @property {Item[]} items The group's items, in row order.
 */

/**
 * @template {Groupable} Item
 * @typedef {Object} GroupRows
 * @property {Array<Item | GroupHeaderRow<Item>>} rows Items with a header
 * row before each group's first item.
 * @property {number[]} itemIndexByRow Item index for each row, `-1` for a
 * header.
 * @property {number[]} rowIndexByItem Row index for each item.
 * @property {number[]} groupIndexByRow Index into `headers` for each row,
 * `-1` when ungrouped.
 * @property {GroupHeaderRow<Item>[]} headers
 */

/**
 * Reorder `entries` so each group is contiguous: ungrouped entries first, then
 * groups in order of first appearance. `compare` sorts within each group,
 * never across groups. An empty group label counts as ungrouped.
 *
 * Returns a new array; `entries` is not mutated.
 *
 * @template T
 * @param {ReadonlyArray<T>} entries
 * @param {(entry: T) => string | undefined} getGroup
 * @param {(a: T, b: T) => number} [compare]
 * @returns {T[]}
 */
export function orderByGroup(entries, getGroup, compare) {
  /** @type {T[]} */
  const ungrouped = [];
  /** @type {Map<string, T[]>} */
  const groups = new Map();

  for (const entry of entries) {
    const group = getGroup(entry);
    if (!group) {
      ungrouped.push(entry);
      continue;
    }
    const bucket = groups.get(group);
    if (bucket) bucket.push(entry);
    else groups.set(group, [entry]);
  }

  if (compare) ungrouped.sort(compare);
  const ordered = ungrouped;
  for (const bucket of groups.values()) {
    if (compare) bucket.sort(compare);
    for (const entry of bucket) ordered.push(entry);
  }
  return ordered;
}

/**
 * Move the items matching `predicate` to the top of their group, keeping
 * relative order otherwise. A group is a run of adjacent items with the same
 * `group`, so ungrouped input is one run.
 *
 * @template {Groupable} Item
 * @param {ReadonlyArray<Item>} items
 * @param {(item: Item) => boolean} predicate
 * @returns {Item[]}
 */
export function hoistWithinGroups(items, predicate) {
  /** @type {Item[]} */
  const result = [];
  /** @type {Item[]} */
  let rest = [];
  let runGroup = items.length > 0 ? items[0].group || "" : "";

  for (const item of items) {
    const group = item.group || "";
    if (group !== runGroup) {
      for (const entry of rest) result.push(entry);
      rest = [];
      runGroup = group;
    }
    if (predicate(item)) result.push(item);
    else rest.push(item);
  }

  for (const entry of rest) result.push(entry);
  return result;
}

/**
 * Build the rows a grouped listbox menu renders: a header row before the
 * first item of each run of same-group items, plus the index maps between
 * item positions and row positions.
 *
 * Header keys are cached per label across calls so a keyed `{#each}` keeps
 * the same header node when the list rebuilds.
 *
 * @template {Groupable} Item
 * @returns {(items: ReadonlyArray<Item>) => GroupRows<Item>}
 */
export function createGroupRows() {
  /** @type {Map<string, symbol>} */
  const headerKeys = new Map();

  return function buildGroupRows(items) {
    /** @type {Array<Item | GroupHeaderRow<Item>>} */
    const rows = [];
    /** @type {number[]} */
    const itemIndexByRow = [];
    /** @type {number[]} */
    const rowIndexByItem = [];
    /** @type {number[]} */
    const groupIndexByRow = [];
    /** @type {GroupHeaderRow<Item>[]} */
    const headers = [];
    /** @type {Set<string>} */
    const seen = new Set();
    let prevGroup = "";

    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      const group = item.group || "";

      if (group && group !== prevGroup) {
        // A label split into two runs needs a second key, or the keyed
        // `{#each}` would see a duplicate.
        let key = seen.has(group) ? undefined : headerKeys.get(group);
        if (!key) {
          key = Symbol(group);
          if (!seen.has(group)) headerKeys.set(group, key);
        }
        seen.add(group);

        const header = { id: key, group, items: [] };
        headers.push(header);
        rows.push(header);
        itemIndexByRow.push(-1);
        groupIndexByRow.push(headers.length - 1);
      }

      if (group) headers[headers.length - 1].items.push(item);

      rowIndexByItem.push(rows.length);
      rows.push(item);
      itemIndexByRow.push(index);
      groupIndexByRow.push(group ? headers.length - 1 : -1);
      prevGroup = group;
    }

    return { rows, itemIndexByRow, rowIndexByItem, groupIndexByRow, headers };
  };
}

/**
 * @typedef {Object} GroupRun
 * @property {unknown} key Stable key for a keyed `{#each}`.
 * @property {number} start Row index of the run's first row.
 * @property {unknown[]} rows
 * @property {number} groupIndex Index into `headers`, `-1` when ungrouped.
 */

/**
 * Split the rows a menu renders into runs of the same group, so each group's
 * rows can sit inside one `role="group"` element. A virtualized window can
 * start or end partway through a group; its run still gets the group.
 *
 * Without `groupRows`, the whole window is one ungrouped run.
 *
 * @param {ReadonlyArray<unknown>} rows The rendered rows.
 * @param {number} start Row index of `rows[0]`.
 * @param {GroupRows<Groupable> | null} groupRows
 * @returns {GroupRun[]}
 */
export function splitGroupRuns(rows, start, groupRows) {
  if (!groupRows) {
    return [
      {
        key: "rows",
        start,
        rows: /** @type {unknown[]} */ (rows),
        groupIndex: -1,
      },
    ];
  }

  /** @type {GroupRun[]} */
  const runs = [];
  for (let offset = 0; offset < rows.length; offset++) {
    const groupIndex = groupRows.groupIndexByRow[start + offset];
    const run = runs[runs.length - 1];
    if (run && run.groupIndex === groupIndex) {
      run.rows.push(rows[offset]);
      continue;
    }
    runs.push({
      // Ungrouped runs key by position, since more than one can exist.
      key:
        groupIndex > -1
          ? groupRows.headers[groupIndex].id
          : `ungrouped-${start + offset}`,
      start: start + offset,
      rows: [rows[offset]],
      groupIndex,
    });
  }
  return runs;
}
