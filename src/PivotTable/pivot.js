// @ts-check
// A pivot engine: flat records in, a tree of row groups and a tree of column
// groups out, with an aggregate for every pair of nodes (so every subtotal and
// grand total is already computed). Pure and synchronous, with no DOM, so it
// runs on the server.
//
// Cost: one pass over the records to place each in a row leaf and a column
// leaf, one to accumulate into the leaf x leaf cells, then a roll-up of those
// cells into every ancestor row and column. Expanding or collapsing a group
// never calls this again; see `pivot-layout.js`.

/**
 * @typedef {"sum" | "count" | "avg" | "min" | "max" | "countDistinct"} PivotAggregateName
 */

/**
 * @typedef {object} PivotValue
 * @property {string} [field] - The record field to aggregate. Omit it with `aggregate: "count"` to count records.
 * @property {PivotAggregateName | ((values: any[]) => number | null | undefined)} [aggregate] - Defaults to `"sum"`. A function receives the field values (blank ones removed) of every record in the cell, and in a subtotal of every record under it.
 * @property {string} [label] - The header text. Defaults to "Sum of Amount".
 * @property {Intl.NumberFormatOptions} [format] - Passed to `Intl.NumberFormat`.
 */

/**
 * @typedef {object} PivotSort
 * @property {"label" | "value"} [by] - Defaults to `"label"`. `"value"` orders groups by the aggregate across the whole other axis.
 * @property {"asc" | "desc"} [direction] - Defaults to `"asc"`. Blank groups are last either way.
 * @property {number} [value] - The index in `values` that `by: "value"` reads. Defaults to `0`.
 */

/**
 * @typedef {object} PivotDimension
 * @property {string} field - The record field. A dotted path such as `"contact.city"` is resolved.
 * @property {string} [label] - The name of the field in headers.
 * @property {(value: any, record: any) => unknown} [group] - Maps a field value to the value to group by, for example a date to its quarter.
 * @property {(key: any) => string} [formatKey] - Maps a group's value to its label. Defaults to `String(key)`.
 * @property {PivotSort} [sort]
 */

/**
 * @typedef {object} PivotFilter
 * @property {string} field
 * @property {unknown[]} [include] - Keep records whose value is one of these. `null` matches a blank value.
 * @property {unknown[]} [exclude] - Drop records whose value is one of these.
 */

/**
 * @typedef {object} PivotConfig
 * @property {(string | PivotDimension)[]} [rows] - Row fields, outermost first.
 * @property {(string | PivotDimension)[]} [columns] - Column fields, outermost first.
 * @property {PivotValue[]} [values]
 * @property {PivotFilter[]} [filters]
 */

/**
 * @typedef {object} PivotOptions
 * @property {string} [locale] - Orders labels, with numbers numerically.
 * @property {string} [blankLabel] - The label of the group for a missing value. Defaults to `"(blank)"`.
 * @property {Record<string, string>} [labels] - Field labels for headers, by field key. A dimension's or value's own `label` wins.
 * @property {number} [maxCells] - Throw a `RangeError` when row nodes x column nodes x values exceeds this. Defaults to `1000000`.
 */

/**
 * @typedef {object} PivotNode
 * @property {string} id - Stable across data changes: the path of keys from the root. `""` for the grand total.
 * @property {unknown} key - The group value, `null` for blank.
 * @property {string} label
 * @property {boolean} blank
 * @property {string} field - The field this node groups by, `""` for the grand total.
 * @property {number} level - `-1` for the grand total, `0` for the outermost groups.
 * @property {number} index - Position in the result's storage. Not the display order.
 * @property {number} parent - `index` of the parent, `-1` for the grand total.
 * @property {PivotNode[]} children - Empty for a leaf. Sorted.
 * @property {number} count - Records under it.
 * @property {number} lo - First leaf rank under it (inclusive).
 * @property {number} hi - Last leaf rank under it (exclusive).
 */

/**
 * @typedef {object} PivotValueSpec
 * @property {string | undefined} field
 * @property {PivotAggregateName | "custom"} aggregate
 * @property {string} label
 * @property {Intl.NumberFormatOptions | undefined} format
 */

/**
 * @typedef {object} PivotResult
 * @property {PivotNode} rowRoot - The grand total row; its `children` are the outermost row groups.
 * @property {PivotNode} columnRoot
 * @property {PivotNode[]} rowNodes - Every row node by `index`.
 * @property {PivotNode[]} columnNodes
 * @property {{ field: string, label: string }[]} rowFields
 * @property {{ field: string, label: string }[]} columnFields
 * @property {PivotValueSpec[]} values
 * @property {number} recordCount - Records that passed the filters.
 * @property {(row: PivotNode, column: PivotNode, value?: number) => number | null} get - The aggregate, `null` where no record falls.
 * @property {(row: PivotNode, column: PivotNode) => any[]} records - The records behind a cell.
 */

const BLANK = Symbol("blank");

const DEFAULT_MAX_CELLS = 1_000_000;
const SEP = "␟";
const BLANK_ID = "∅";

// Accumulator slots per (row node, column node, value).
const SUM = 0;
const N = 1;
const MIN = 2;
const MAX = 3;
const SLOTS = 4;

const K_SUM = 0;
const K_COUNT = 1;
const K_AVG = 2;
const K_MIN = 3;
const K_MAX = 4;
const K_DISTINCT = 5;
const K_CUSTOM = 6;
const K_RECORDS = 7;

/** @type {Record<string, number>} */
const KINDS = {
  sum: K_SUM,
  count: K_COUNT,
  avg: K_AVG,
  min: K_MIN,
  max: K_MAX,
  countDistinct: K_DISTINCT,
};

/**
 * @param {string} field
 * @returns {(record: any) => unknown}
 */
function accessor(field) {
  if (!field.includes(".")) return (record) => record?.[field];
  const path = field.split(".");
  return (record) => {
    let current = record;
    for (const part of path) {
      if (current == null) return undefined;
      current = current[part];
    }
    return current;
  };
}

/** @param {unknown} value */
function isBlank(value) {
  return (
    value === null ||
    value === undefined ||
    value === "" ||
    (typeof value === "number" && Number.isNaN(value))
  );
}

/**
 * @param {unknown} value
 * @returns {string | number | boolean | typeof BLANK}
 */
function toKey(value) {
  if (isBlank(value)) return BLANK;
  if (typeof value === "string" || typeof value === "number") return value;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? BLANK : value.toISOString();
  }
  return String(value);
}

/**
 * @param {string | PivotDimension} dimension
 * @returns {PivotDimension}
 */
function normalizeDimension(dimension) {
  return typeof dimension === "string" ? { field: dimension } : dimension;
}

/**
 * @param {PivotValue} value
 * @returns {PivotValueSpec & { kind: number, get: ((record: any) => unknown) | undefined, fn: Function | undefined }}
 */
function normalizeValue(
  value,
  labels = /** @type {Record<string, string>} */ ({}),
) {
  const aggregate = value.aggregate ?? "sum";
  const custom = typeof aggregate === "function";
  const name = custom ? "custom" : aggregate;
  let kind = custom ? K_CUSTOM : KINDS[aggregate];
  if (kind === undefined) {
    throw new RangeError(`pivot: unknown aggregate "${aggregate}"`);
  }
  if (!value.field) {
    if (name !== "count") {
      throw new RangeError("pivot: a value without a field must count");
    }
    kind = K_RECORDS;
  }
  const field = value.field;
  const label =
    value.label ??
    (field
      ? `${name === "countDistinct" ? "Distinct count" : name[0].toUpperCase() + name.slice(1)} of ${labels[field] ?? field}`
      : "Count");
  return {
    field: value.field,
    aggregate: name,
    label,
    format: value.format,
    kind,
    get: value.field ? accessor(value.field) : undefined,
    fn: custom ? aggregate : undefined,
  };
}

/**
 * @param {Intl.Collator} collator
 * @param {unknown} a
 * @param {unknown} b
 */
function compareKeys(collator, a, b) {
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "number") return -1;
  if (typeof b === "number") return 1;
  return collator.compare(String(a), String(b));
}

/**
 * Builds the tree of one axis while the records stream by.
 * @param {string} blankLabel
 */
function createAxis(blankLabel) {
  /** @type {PivotNode} */
  const root = {
    id: "",
    key: null,
    label: "",
    blank: false,
    field: "",
    level: -1,
    index: 0,
    parent: -1,
    children: [],
    count: 0,
    lo: 0,
    hi: 0,
  };
  /** @type {PivotNode[]} */
  const nodes = [root];
  /** @type {Map<unknown, number>[]} */
  const lookups = [new Map()];

  /**
   * @param {number} parentIndex
   * @param {string | number | boolean | typeof BLANK} key
   * @param {PivotDimension} dimension
   */
  function child(parentIndex, key, dimension) {
    const lookup = lookups[parentIndex];
    const existing = lookup.get(key);
    if (existing !== undefined) return existing;
    const parent = nodes[parentIndex];
    const blank = key === BLANK;
    const label = blank
      ? blankLabel
      : dimension.formatKey
        ? dimension.formatKey(key)
        : String(key);
    /** @type {PivotNode} */
    const node = {
      id: parent.id + SEP + (blank ? BLANK_ID : String(key)),
      key: blank ? null : key,
      label,
      blank,
      field: dimension.field,
      level: parent.level + 1,
      index: nodes.length,
      parent: parentIndex,
      children: [],
      count: 0,
      lo: 0,
      hi: 0,
    };
    // The root's id is "", so the first segment starts with the separator.
    nodes.push(node);
    lookups.push(new Map());
    parent.children.push(node);
    lookup.set(key, node.index);
    return node.index;
  }

  return { root, nodes, child };
}

/**
 * @param {PivotNode} root
 * @param {PivotNode[]} nodes
 * @param {PivotDimension[]} dimensions
 * @param {Intl.Collator} collator
 * @param {(node: PivotNode, dimension: PivotDimension) => number} measure
 */
function sortAxis(root, nodes, dimensions, collator, measure) {
  for (const parent of nodes) {
    const children = parent.children;
    if (children.length < 2) continue;
    const dimension = dimensions[parent.level + 1];
    const sort = dimension.sort;
    const sign = sort?.direction === "desc" ? -1 : 1;
    if (sort?.by === "value") {
      children.sort((a, b) => {
        if (a.blank !== b.blank) return a.blank ? 1 : -1;
        const x = measure(a, dimension);
        const y = measure(b, dimension);
        const xNaN = Number.isNaN(x);
        const yNaN = Number.isNaN(y);
        if (xNaN || yNaN) return xNaN === yNaN ? 0 : xNaN ? 1 : -1;
        return (x - y) * sign;
      });
    } else {
      children.sort((a, b) => {
        if (a.blank !== b.blank) return a.blank ? 1 : -1;
        return compareKeys(collator, a.key, b.key) * sign;
      });
    }
  }
  // Rank the leaves in display order; every node covers a range of ranks.
  let rank = 0;
  /** @param {PivotNode} node */
  const walk = (node) => {
    node.lo = rank;
    if (node.children.length === 0) rank++;
    else for (const child of node.children) walk(child);
    node.hi = rank;
  };
  walk(root);
}

/**
 * Group `records` by row and column fields and aggregate `values` for every
 * group, subtotal and grand total.
 *
 * @param {ReadonlyArray<any>} records
 * @param {PivotConfig} config
 * @param {PivotOptions} [options]
 * @returns {PivotResult}
 */
export function pivot(records, config, options = {}) {
  const {
    locale,
    blankLabel = "(blank)",
    maxCells = DEFAULT_MAX_CELLS,
    labels = {},
  } = options;
  const rowDimensions = (config.rows ?? []).map(normalizeDimension);
  const columnDimensions = (config.columns ?? []).map(normalizeDimension);
  const specs = (config.values ?? []).map((v) => normalizeValue(v, labels));
  if (specs.length === 0) {
    specs.push(normalizeValue({ aggregate: "count" }));
  }
  const V = specs.length;
  const rowDepth = rowDimensions.length;
  const columnDepth = columnDimensions.length;

  const rowGetters = rowDimensions.map((d) => accessor(d.field));
  const columnGetters = columnDimensions.map((d) => accessor(d.field));

  // Filters become one predicate per field. `null` stands for blank.
  const filters = (config.filters ?? [])
    .filter((f) => f.include || f.exclude)
    .map((filter) => {
      const get = accessor(filter.field);
      const include = filter.include
        ? new Set(filter.include.map((v) => (isBlank(v) ? BLANK : v)))
        : undefined;
      const exclude = filter.exclude
        ? new Set(filter.exclude.map((v) => (isBlank(v) ? BLANK : v)))
        : undefined;
      return { get, include, exclude };
    });

  const rowAxis = createAxis(blankLabel);
  const columnAxis = createAxis(blankLabel);

  const total = records.length;
  const rowLeaf = new Int32Array(total).fill(-1);
  const columnLeaf = new Int32Array(total).fill(-1);
  let recordCount = 0;

  // Pass 1: place every record in a row leaf and a column leaf.
  place: for (let i = 0; i < total; i++) {
    const record = records[i];
    for (let f = 0; f < filters.length; f++) {
      const filter = filters[f];
      const key = toKey(filter.get(record));
      if (filter.include && !filter.include.has(key)) continue place;
      if (filter.exclude?.has(key)) continue place;
    }
    let row = 0;
    for (let d = 0; d < rowDepth; d++) {
      const dimension = rowDimensions[d];
      let value = rowGetters[d](record);
      if (dimension.group) value = dimension.group(value, record);
      row = rowAxis.child(row, toKey(value), dimension);
    }
    let column = 0;
    for (let d = 0; d < columnDepth; d++) {
      const dimension = columnDimensions[d];
      let value = columnGetters[d](record);
      if (dimension.group) value = dimension.group(value, record);
      column = columnAxis.child(column, toKey(value), dimension);
    }
    rowLeaf[i] = row;
    columnLeaf[i] = column;
    recordCount++;
  }

  const rowNodes = rowAxis.nodes;
  const columnNodes = columnAxis.nodes;
  const R = rowNodes.length;
  const C = columnNodes.length;
  if (R * C * V > maxCells) {
    throw new RangeError(
      `pivot: ${R} row groups x ${C} column groups x ${V} values is more than ${maxCells} cells`,
    );
  }

  const acc = new Float64Array(R * C * V * SLOTS);
  // Distinct values and custom aggregates keep their values per cell slot.
  // Both stay empty unless a value asks for them.
  /** @type {Map<number, Set<unknown>>} */
  const sets = new Map();
  /** @type {Map<number, unknown[]>} */
  const lists = new Map();

  // Pass 2: accumulate into the leaf x leaf cells.
  for (let i = 0; i < total; i++) {
    const r = rowLeaf[i];
    if (r < 0) continue;
    const record = records[i];
    const cell = (r * C + columnLeaf[i]) * V;
    rowNodes[r].count++;
    columnNodes[columnLeaf[i]].count++;
    for (let v = 0; v < V; v++) {
      const spec = specs[v];
      const slot = (cell + v) * SLOTS;
      const kind = spec.kind;
      if (kind === K_RECORDS) {
        acc[slot + N]++;
        continue;
      }
      const raw = spec.get?.(record);
      if (isBlank(raw)) continue;
      if (kind === K_COUNT) {
        acc[slot + N]++;
      } else if (kind === K_DISTINCT) {
        let set = sets.get(slot);
        if (!set) {
          set = new Set();
          sets.set(slot, set);
        }
        set.add(raw);
        acc[slot + N] = set.size;
      } else if (kind === K_CUSTOM) {
        let list = lists.get(slot);
        if (!list) {
          list = [];
          lists.set(slot, list);
        }
        list.push(raw);
        acc[slot + N]++;
      } else {
        const x = typeof raw === "number" ? raw : Number(raw);
        if (Number.isNaN(x)) continue;
        const n = acc[slot + N];
        if (n === 0) {
          acc[slot + MIN] = x;
          acc[slot + MAX] = x;
        } else {
          if (x < acc[slot + MIN]) acc[slot + MIN] = x;
          if (x > acc[slot + MAX]) acc[slot + MAX] = x;
        }
        acc[slot + SUM] += x;
        acc[slot + N] = n + 1;
      }
    }
  }
  // Counts above went into leaves of the trie only; add them to ancestors.
  for (const nodes of [rowNodes, columnNodes]) {
    for (let i = nodes.length - 1; i > 0; i--) {
      const node = nodes[i];
      if (node.children.length > 0) continue;
      for (let p = node.parent; p >= 0; p = nodes[p].parent) {
        nodes[p].count += node.count;
      }
    }
  }
  if (rowDepth === 0) rowNodes[0].count = recordCount;
  if (columnDepth === 0) columnNodes[0].count = recordCount;

  /**
   * Fold the accumulator of cell `from` into cell `to`.
   * @param {number} from
   * @param {number} to
   */
  function merge(from, to) {
    for (let v = 0; v < V; v++) {
      const a = (from * V + v) * SLOTS;
      const b = (to * V + v) * SLOTS;
      const n = acc[a + N];
      if (n === 0) continue;
      const kind = specs[v].kind;
      if (kind === K_DISTINCT) {
        const source = sets.get(a) ?? [];
        let set = sets.get(b);
        if (!set) {
          set = new Set();
          sets.set(b, set);
        }
        for (const x of source) set.add(x);
        acc[b + N] = set.size;
        continue;
      }
      if (kind === K_CUSTOM) {
        const source = lists.get(a) ?? [];
        const list = lists.get(b);
        if (list) for (const x of source) list.push(x);
        else lists.set(b, source.slice());
        acc[b + N] += n;
        continue;
      }
      if (
        kind === K_MIN ||
        kind === K_MAX ||
        kind === K_SUM ||
        kind === K_AVG
      ) {
        if (acc[b + N] === 0) {
          acc[b + MIN] = acc[a + MIN];
          acc[b + MAX] = acc[a + MAX];
        } else {
          if (acc[a + MIN] < acc[b + MIN]) acc[b + MIN] = acc[a + MIN];
          if (acc[a + MAX] > acc[b + MAX]) acc[b + MAX] = acc[a + MAX];
        }
        acc[b + SUM] += acc[a + SUM];
      }
      acc[b + N] += n;
    }
  }

  const rowLeaves =
    rowDepth === 0
      ? [rowNodes[0]]
      : rowNodes.filter((n) => n.level === rowDepth - 1);
  const columnLeaves =
    columnDepth === 0
      ? [columnNodes[0]]
      : columnNodes.filter((n) => n.level === columnDepth - 1);

  // Roll up columns: each leaf cell into every ancestor column.
  if (columnDepth > 0) {
    for (const row of rowLeaves) {
      for (const column of columnLeaves) {
        const from = row.index * C + column.index;
        for (let p = column.parent; p >= 0; p = columnNodes[p].parent) {
          merge(from, row.index * C + p);
        }
      }
    }
  }
  // Roll up rows: each row leaf's cells (leaf and ancestor columns alike)
  // into every ancestor row.
  if (rowDepth > 0) {
    for (const row of rowLeaves) {
      for (let c = 0; c < C; c++) {
        const from = row.index * C + c;
        for (let p = row.parent; p >= 0; p = rowNodes[p].parent) {
          merge(from, p * C + c);
        }
      }
    }
  }

  // Finalize into one number per (row, column, value).
  const data = new Float64Array(R * C * V).fill(Number.NaN);
  for (let cell = 0; cell < R * C; cell++) {
    for (let v = 0; v < V; v++) {
      const slot = (cell * V + v) * SLOTS;
      const n = acc[slot + N];
      if (n === 0) continue;
      let result;
      switch (specs[v].kind) {
        case K_SUM:
          result = acc[slot + SUM];
          break;
        case K_AVG:
          result = acc[slot + SUM] / n;
          break;
        case K_MIN:
          result = acc[slot + MIN];
          break;
        case K_MAX:
          result = acc[slot + MAX];
          break;
        case K_CUSTOM:
          result = Number(specs[v].fn?.(lists.get(slot)));
          break;
        default:
          result = n;
      }
      data[cell * V + v] = result;
    }
  }

  const collator = new Intl.Collator(locale, {
    numeric: true,
    sensitivity: "base",
  });
  // Group order by an aggregate reads the total across the other axis.
  sortAxis(
    rowNodes[0],
    rowNodes,
    rowDimensions,
    collator,
    (node, dimension) => {
      const v = dimension.sort?.value ?? 0;
      return data[(node.index * C + 0) * V + v];
    },
  );
  sortAxis(
    columnNodes[0],
    columnNodes,
    columnDimensions,
    collator,
    (node, dimension) => {
      const v = dimension.sort?.value ?? 0;
      return data[(0 * C + node.index) * V + v];
    },
  );

  // Leaf rank of every node's first leaf, for the drill-down range test.
  const rowRank = new Int32Array(R);
  const columnRank = new Int32Array(C);
  for (const node of rowNodes) rowRank[node.index] = node.lo;
  for (const node of columnNodes) columnRank[node.index] = node.lo;

  return {
    rowRoot: rowNodes[0],
    columnRoot: columnNodes[0],
    rowNodes,
    columnNodes,
    rowFields: rowDimensions.map((d) => ({
      field: d.field,
      label: d.label ?? labels[d.field] ?? d.field,
    })),
    columnFields: columnDimensions.map((d) => ({
      field: d.field,
      label: d.label ?? labels[d.field] ?? d.field,
    })),
    values: specs.map(({ field, aggregate, label, format }) => ({
      field,
      aggregate,
      label,
      format,
    })),
    recordCount,
    get(row, column, value = 0) {
      const x = data[(row.index * C + column.index) * V + value];
      return Number.isNaN(x) ? null : x;
    },
    records(row, column) {
      /** @type {any[]} */
      const out = [];
      for (let i = 0; i < total; i++) {
        const r = rowLeaf[i];
        if (r < 0) continue;
        const rr = rowRank[r];
        if (rr < row.lo || rr >= row.hi) continue;
        const cr = columnRank[columnLeaf[i]];
        if (cr < column.lo || cr >= column.hi) continue;
        out.push(records[i]);
      }
      return out;
    },
  };
}
