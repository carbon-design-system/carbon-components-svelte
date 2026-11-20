// @ts-check
// Moves a field between the areas of a pivot config (rows, columns, values,
// filters, and the unplaced fields). Pure: it returns a new config and never
// edits the one it is given. The field list drives it from a drag and from a
// menu, so both reach the same result.

/**
 * @typedef {import("./pivot.js").PivotConfig} PivotConfig
 * @typedef {import("./pivot.js").PivotDimension} PivotDimension
 * @typedef {import("./pivot.js").PivotValue} PivotValue
 * @typedef {import("./pivot.js").PivotFilter} PivotFilter
 */

/** @typedef {"available" | "rows" | "columns" | "values" | "filters"} PivotZone */

/**
 * @typedef {object} PivotField
 * @property {string} key - The record field.
 * @property {string} [label] - Defaults to the key.
 * @property {"string" | "number" | "date" | "boolean"} [type] - A `"number"` field is summed when it first joins the values; any other is counted.
 */

/** @type {PivotZone[]} */
export const PIVOT_ZONES = [
  "available",
  "rows",
  "columns",
  "values",
  "filters",
];

/**
 * @param {string | PivotDimension | PivotValue | PivotFilter} entry
 * @returns {string | undefined}
 */
export function fieldOf(entry) {
  return typeof entry === "string" ? entry : entry.field;
}

/**
 * The entries of a zone in order. `available` lists the fields that are in
 * no dimension zone, so a field can be a value and still be offered.
 * @param {PivotConfig} config
 * @param {ReadonlyArray<PivotField>} fields
 * @param {PivotZone} zone
 * @returns {{ field: string, entry: any }[]}
 */
export function zoneEntries(config, fields, zone) {
  if (zone === "available") {
    const placed = new Set(
      ["rows", "columns", "filters"].flatMap((z) =>
        zoneEntries(config, fields, /** @type {PivotZone} */ (z)).map(
          (e) => e.field,
        ),
      ),
    );
    return fields
      .filter((f) => !placed.has(f.key))
      .map((f) => ({ field: f.key, entry: f.key }));
  }
  const list = config[zone] ?? [];
  return list.map((entry) => ({ field: fieldOf(entry) ?? "", entry }));
}

/**
 * @typedef {object} PivotMove
 * @property {string} field
 * @property {PivotZone} from
 * @property {PivotZone} to
 * @property {number} [fromIndex] - The index in `from`. Needed to take one of several values.
 * @property {number} [toIndex] - The gap to insert at in `to`, counted before the field is taken out. Defaults to the end.
 */

/**
 * Move a field to another zone, or to another place in its zone. A row,
 * column or filter field sits in one of the three at a time; a value can
 * repeat. The entry keeps what it carries (a dimension's sort, a value's
 * aggregate) while it moves between zones that hold the same kind.
 * @param {PivotConfig} config
 * @param {PivotMove} move
 * @param {ReadonlyArray<PivotField>} [fields]
 * @returns {PivotConfig}
 */
export function moveField(config, move, fields = []) {
  const { field, from, to } = move;
  let rows = config.rows ?? [];
  let columns = config.columns ?? [];
  let values = config.values ?? [];
  let filters = config.filters ?? [];
  /** @type {any} */
  let carried;

  const isField = (/** @type {any} */ e) => fieldOf(e) === field;
  if (from === "rows") {
    carried = rows.find(isField);
    rows = rows.filter((e) => !isField(e));
  } else if (from === "columns") {
    carried = columns.find(isField);
    columns = columns.filter((e) => !isField(e));
  } else if (from === "filters") {
    carried = filters.find(isField);
    filters = filters.filter((e) => !isField(e));
  } else if (from === "values") {
    const at =
      move.fromIndex !== undefined && values[move.fromIndex]?.field === field
        ? move.fromIndex
        : values.findIndex(isField);
    if (at >= 0) {
      carried = values[at];
      values = values.filter((_, i) => i !== at);
    }
  }

  let toIndex = move.toIndex;
  if (
    from === to &&
    toIndex !== undefined &&
    move.fromIndex !== undefined &&
    move.fromIndex < toIndex
  ) {
    toIndex--;
  }
  /**
   * @template T
   * @param {T[]} list
   * @param {T} item
   * @returns {T[]}
   */
  const insert = (list, item) => {
    const next = [...list];
    const at =
      toIndex === undefined
        ? next.length
        : Math.max(0, Math.min(toIndex, next.length));
    next.splice(at, 0, item);
    return next;
  };

  if (to === "rows" || to === "columns" || to === "filters") {
    rows = rows.filter((e) => !isField(e));
    columns = columns.filter((e) => !isField(e));
    filters = filters.filter((e) => !isField(e));
  }
  const dimension = from === "rows" || from === "columns" ? carried : undefined;
  if (to === "rows") rows = insert(rows, dimension ?? field);
  if (to === "columns") columns = insert(columns, dimension ?? field);
  if (to === "filters") {
    filters = insert(
      filters,
      (from === "filters" ? carried : undefined) ?? { field },
    );
  }
  if (to === "values") {
    values = insert(
      values,
      (from === "values" ? carried : undefined) ?? defaultValue(field, fields),
    );
  }
  return { ...config, rows, columns, values, filters };
}

/**
 * @param {string} field
 * @param {ReadonlyArray<PivotField>} fields
 * @returns {PivotValue}
 */
function defaultValue(field, fields) {
  const type = fields.find((f) => f.key === field)?.type;
  return { field, aggregate: type === "number" ? "sum" : "count" };
}

/**
 * Swap an entry of a zone with its neighbor.
 * @param {PivotConfig} config
 * @param {Exclude<PivotZone, "available">} zone
 * @param {number} index
 * @param {-1 | 1} step
 * @returns {PivotConfig}
 */
export function shiftEntry(config, zone, index, step) {
  const list = [.../** @type {any[]} */ (config[zone] ?? [])];
  const target = index + step;
  if (target < 0 || target >= list.length) return config;
  [list[index], list[target]] = [list[target], list[index]];
  return { ...config, [zone]: list };
}

/**
 * Set how a value is aggregated.
 * @param {PivotConfig} config
 * @param {number} index
 * @param {PivotValue["aggregate"]} aggregate
 * @returns {PivotConfig}
 */
export function setAggregate(config, index, aggregate) {
  const values = [...(config.values ?? [])];
  if (!values[index]) return config;
  values[index] = { ...values[index], aggregate };
  return { ...config, values };
}

/**
 * Keep the records whose `field` is one of `include`, or all with `undefined`.
 * @param {PivotConfig} config
 * @param {string} field
 * @param {unknown[] | undefined} include
 * @returns {PivotConfig}
 */
export function setFilterInclude(config, field, include) {
  const filters = (config.filters ?? []).map((f) =>
    f.field === field ? { ...f, include } : f,
  );
  return { ...config, filters };
}

/**
 * The distinct values of a field, in first-seen order, up to `limit`.
 * @param {ReadonlyArray<any>} records
 * @param {string} field
 * @param {number} [limit]
 * @returns {{ values: unknown[], blank: boolean, truncated: boolean }}
 */
export function distinctValues(records, field, limit = 100) {
  const seen = new Set();
  let blank = false;
  let truncated = false;
  for (const record of records) {
    const value = record?.[field];
    if (value === null || value === undefined || value === "") {
      blank = true;
    } else if (!seen.has(value)) {
      if (seen.size >= limit) {
        truncated = true;
        break;
      }
      seen.add(value);
    }
  }
  const values = [...seen].sort((a, b) =>
    typeof a === "number" && typeof b === "number"
      ? a - b
      : String(a).localeCompare(String(b), undefined, { numeric: true }),
  );
  return { values, blank, truncated };
}
