// @ts-check
// Set intersections: which combinations of sets the rows fall in, and how
// many in each, for an UpSet plot. Every row is counted once, in exactly the
// combination of sets it belongs to.

/**
 * Count rows by the exact combination of sets they belong to. A row in
 * sets A and B counts toward "A and B", not toward A or B alone. Sets not
 * in `sets` are ignored. Combinations come out largest first, or by how
 * many sets they involve with `sort: "degree"`, and empty ones are left
 * out unless `showEmpty`.
 *
 * @template T
 * @param {ReadonlyArray<T>} rows
 * @param {import("./upset.d.ts").UpSetOptions<T>} options
 * @returns {import("./upset.d.ts").UpSet<T>}
 */
export function upset(rows, options) {
  const {
    sets,
    membership,
    sort = "size",
    showEmpty = false,
    maxCombinations,
  } = options;
  const order = sets.map((set) => String(set.id));
  const index = new Map(order.map((id, i) => [id, i]));

  /** @type {Map<string, { ids: string[]; rows: T[] }>} */
  const groups = new Map();
  const totals = new Array(order.length).fill(0);
  for (let i = 0; i < rows.length; i++) {
    const raw = membership(rows[i], i);
    const members = Array.isArray(raw) ? raw : [];
    /** @type {boolean[]} */
    const flags = new Array(order.length).fill(false);
    for (const member of members) {
      const at = index.get(String(member));
      if (at !== undefined) flags[at] = true;
    }
    const ids = order.filter((_, k) => flags[k]);
    if (ids.length === 0) continue;
    for (const id of ids) totals[/** @type {number} */ (index.get(id))]++;
    const key = ids.join("+");
    const group = groups.get(key);
    if (group) group.rows.push(rows[i]);
    else groups.set(key, { ids, rows: [rows[i]] });
  }

  if (showEmpty) {
    // Every non-empty subset, in binary order, so nothing is missed.
    const count = 2 ** order.length;
    for (let mask = 1; mask < count; mask++) {
      const ids = order.filter((_, k) => mask & (1 << k));
      const key = ids.join("+");
      if (!groups.has(key)) groups.set(key, { ids, rows: [] });
    }
  }

  const counted = rows.length;
  let combinations = [...groups.entries()].map(([key, group]) => ({
    key,
    ids: group.ids,
    degree: group.ids.length,
    size: group.rows.length,
    share: counted > 0 ? group.rows.length / counted : 0,
    rows: group.rows,
  }));
  combinations.sort((a, b) =>
    sort === "degree"
      ? a.degree - b.degree || b.size - a.size || a.key.localeCompare(b.key)
      : b.size - a.size || a.degree - b.degree || a.key.localeCompare(b.key),
  );
  if (maxCombinations !== undefined && maxCombinations >= 0) {
    combinations = combinations.slice(0, maxCombinations);
  }
  const largest = Math.max(0, ...combinations.map((entry) => entry.size));
  const largestTotal = Math.max(0, ...totals);

  return {
    sets: sets.map((set, k) => ({
      id: order[k],
      label: set.label ?? order[k],
      total: totals[k],
      pct: largestTotal > 0 ? (totals[k] / largestTotal) * 100 : 0,
    })),
    combinations: combinations.map((entry) => ({
      ...entry,
      pct: largest > 0 ? (entry.size / largest) * 100 : 0,
    })),
    counted,
  };
}
