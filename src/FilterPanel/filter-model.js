// @ts-check
// The model behind `FilterPanel`: facet schemas, filter state, counts, and the
// conversions to TokenSearch queries, QueryBuilder trees and URL parameters.
// Everything here is pure and DOM-free, so a server can count, filter and
// parse a URL with it.

/**
 * @typedef {string | number} OptionId
 *
 * @typedef {Object} FilterOption
 * @property {OptionId} id
 * @property {string} [label] Defaults to `String(id)`.
 * @property {ReadonlyArray<FilterOption>} [children] Child options of a `tree` facet.
 *
 * @typedef {Object} FacetBase
 * @property {string} id Names the facet in `FilterState`, in URLs and in conversions.
 * @property {string} label
 * @property {string} [field] The record property to read. Defaults to `id`.
 * @property {(record: any) => unknown} [getValue] Read a record's value
 *   instead. For a `checkbox` or `tree` facet it may return an array.
 * @property {boolean} [collapsed] Start the facet's group collapsed.
 *
 * @typedef {FacetBase & {
 *   type: "checkbox",
 *   options?: ReadonlyArray<FilterOption>,
 *   match?: "any" | "all",
 *   searchable?: boolean,
 *   limit?: number,
 * }} CheckboxFacet
 * @typedef {FacetBase & { type: "radio", options: ReadonlyArray<FilterOption> }} RadioFacet
 * @typedef {FacetBase & {
 *   type: "range",
 *   min: number,
 *   max: number,
 *   step?: number,
 *   format?: (value: number) => string,
 * }} RangeFacet
 * @typedef {FacetBase & { type: "date", min?: string, max?: string }} DateFacet
 * @typedef {FacetBase & { type: "toggle", toggleLabel?: string }} ToggleFacet
 * @typedef {FacetBase & { type: "tree", options: ReadonlyArray<FilterOption> }} TreeFacet
 * @typedef {CheckboxFacet | RadioFacet | RangeFacet | DateFacet | ToggleFacet | TreeFacet} Facet
 *
 * @typedef {Record<string, unknown>} FilterState
 *   A value per facet id: `OptionId[]` (checkbox, tree), `OptionId` (radio),
 *   `[number | null, number | null]` (range), `[string | null, string | null]`
 *   (date, `YYYY-MM-DD`), `true` (toggle). A facet with no filter has no key.
 *
 * @typedef {Object} Filter
 * @property {string} key The facet id.
 * @property {"eq" | "gt" | "gte" | "lt" | "lte" | "between"} op
 * @property {string[]} values
 * @property {boolean} negated
 *
 * @typedef {Record<string, Record<string, number>>} FacetCounts
 */

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** @type {Record<string, true>} */
const OPTION_TYPES = {
  checkbox: true,
  radio: true,
  toggle: true,
  tree: true,
};

/** @param {Facet} facet */
function isOptionFacet(facet) {
  return OPTION_TYPES[facet.type] === true;
}

/**
 * @param {OptionId} id
 * @returns {string}
 */
function key(id) {
  return typeof id === "string" ? id : String(id);
}

/**
 * The record property reader for a facet.
 * @param {Facet} facet
 * @returns {(record: any) => unknown}
 */
function reader(facet) {
  if (facet.getValue) return facet.getValue;
  const field = facet.field ?? facet.id;
  return (record) => (record == null ? undefined : record[field]);
}

/**
 * Return the facets as written. The `.d.ts` types the call so a facet's
 * `type` keeps its literal value.
 * @template {ReadonlyArray<Facet>} F
 * @param {F} facets
 * @returns {F}
 */
export function defineFacets(facets) {
  return facets;
}

/**
 * Walk a `tree` facet's options once: id to ancestors-and-self, id to
 * children, and every leaf.
 * @typedef {{ up: Map<string, string[]>, down: Map<string, string[]>, leaves: string[], labels: Map<string, string> }} TreeIndex
 * @type {WeakMap<object, TreeIndex>}
 */
const treeIndexes = new WeakMap();

/**
 * @param {{ options: ReadonlyArray<FilterOption> }} facet
 * @returns {TreeIndex}
 */
export function treeIndex(facet) {
  const cached = treeIndexes.get(facet);
  if (cached) return cached;
  /** @type {TreeIndex} */
  const index = {
    up: new Map(),
    down: new Map(),
    leaves: [],
    labels: new Map(),
  };
  /**
   * @param {ReadonlyArray<FilterOption>} nodes
   * @param {string[]} path
   */
  function walk(nodes, path) {
    for (const node of nodes) {
      const id = key(node.id);
      const chain = [...path, id];
      index.up.set(id, chain);
      index.labels.set(id, node.label ?? id);
      if (node.children && node.children.length > 0) {
        /** @type {string[]} */
        const leaves = [];
        index.down.set(id, leaves);
        walk(node.children, chain);
        for (const child of node.children) {
          const childId = key(child.id);
          const below = index.down.get(childId);
          if (below) leaves.push(...below);
          else leaves.push(childId);
        }
      } else {
        index.leaves.push(id);
      }
    }
  }
  walk(facet.options ?? [], []);
  treeIndexes.set(facet, index);
  return index;
}

/**
 * Every id a tree selection covers: the nodes and their descendants.
 * @param {TreeFacet} facet
 * @param {OptionId[]} ids
 * @returns {string[]}
 */
export function expandTreeIds(facet, ids) {
  const { down } = treeIndex(facet);
  /** @type {Set<string>} */
  const out = new Set();
  for (const id of ids) {
    const k = key(id);
    out.add(k);
    for (const leaf of down.get(k) ?? []) out.add(leaf);
  }
  return [...out];
}

/**
 * The leaves a tree selection covers, the form `toFilters` and
 * `toConditions` carry.
 * @param {TreeFacet} facet
 * @param {OptionId[]} ids
 * @returns {string[]}
 */
function treeLeaves(facet, ids) {
  const { down } = treeIndex(facet);
  /** @type {Set<string>} */
  const out = new Set();
  for (const id of ids) {
    const k = key(id);
    const below = down.get(k);
    if (below) for (const leaf of below) out.add(leaf);
    else out.add(k);
  }
  return [...out];
}

/**
 * The topmost nodes of a checked set: a node whose descendants are all
 * checked stands for them. `TreeView` reports every checked node, the state
 * keeps the short form.
 * @param {TreeFacet} facet
 * @param {OptionId[]} checked
 * @returns {string[]}
 */
export function compactTreeIds(facet, checked) {
  const { up, down } = treeIndex(facet);
  const set = new Set(checked.map(key));
  // A node stands for its subtree only when every leaf below it is checked,
  // whether or not the node itself was reported: all of `phones` and
  // `tablets` checked is `mobile`.
  /** @type {Set<string>} */
  const complete = new Set();
  for (const id of up.keys()) {
    const below = down.get(id);
    if (below ? below.every((leaf) => set.has(leaf)) : set.has(id)) {
      complete.add(id);
    }
  }
  /** @type {string[]} */
  const out = [];
  for (const id of complete) {
    const covered = (up.get(id) ?? [])
      .slice(0, -1)
      .some((ancestor) => complete.has(ancestor));
    if (!covered) out.push(id);
  }
  return out;
}

/**
 * Whether a value is an empty selection for the facet.
 * @param {Facet} facet
 * @param {unknown} value
 */
export function isFilterActive(facet, value) {
  switch (facet.type) {
    case "checkbox":
    case "tree":
      return Array.isArray(value) && value.length > 0;
    case "radio":
      return value !== undefined && value !== null && value !== "";
    case "range":
    case "date":
      return Array.isArray(value) && (value[0] != null || value[1] != null);
    case "toggle":
      return value === true;
    default:
      return false;
  }
}

/**
 * @param {unknown} value
 * @returns {number | null}
 */
function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {unknown} value
 * @returns {string | null}
 */
function toDate(value) {
  if (typeof value !== "string" || !DATE.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
    ? value
    : null;
}

/**
 * Coerce a value to the facet's shape, or `undefined` when it filters
 * nothing. Reversed range ends are swapped.
 * @param {Facet} facet
 * @param {unknown} value
 * @returns {unknown}
 */
export function normalizeFacetValue(facet, value) {
  switch (facet.type) {
    case "checkbox":
    case "tree": {
      if (!Array.isArray(value)) return undefined;
      const seen = new Set();
      const out = [];
      for (const v of value) {
        if ((typeof v !== "string" && typeof v !== "number") || v === "") {
          continue;
        }
        const k = key(v);
        if (seen.has(k)) continue;
        seen.add(k);
        out.push(v);
      }
      return out.length > 0 ? out : undefined;
    }
    case "radio":
      return typeof value === "string" || typeof value === "number"
        ? value === ""
          ? undefined
          : value
        : undefined;
    case "range": {
      if (!Array.isArray(value)) return undefined;
      let lo = toNumber(value[0]);
      let hi = toNumber(value[1]);
      if (lo === null && hi === null) return undefined;
      if (lo !== null && hi !== null && lo > hi) [lo, hi] = [hi, lo];
      return [lo, hi];
    }
    case "date": {
      if (!Array.isArray(value)) return undefined;
      let lo = toDate(value[0]);
      let hi = toDate(value[1]);
      if (lo === null && hi === null) return undefined;
      if (lo !== null && hi !== null && lo > hi) [lo, hi] = [hi, lo];
      return [lo, hi];
    }
    case "toggle":
      return value === true ? true : undefined;
    default:
      return undefined;
  }
}

/**
 * Keep only the schema's facets and drop what filters nothing, so two states
 * that mean the same compare deeply equal.
 * @param {Facet[]} facets
 * @param {FilterState | null | undefined} state
 * @returns {FilterState}
 */
export function normalizeFilterState(facets, state) {
  /** @type {FilterState} */
  const out = {};
  if (!state || typeof state !== "object") return out;
  const own = new Set(Object.keys(state));
  for (const facet of facets) {
    if (!own.has(facet.id)) continue;
    const value = normalizeFacetValue(facet, state[facet.id]);
    if (value !== undefined) out[facet.id] = value;
  }
  return out;
}

/**
 * The number of applied selections: one per checked option, one per range,
 * radio, date range or toggle.
 * @param {Facet[]} facets
 * @param {FilterState} state
 */
export function countFilters(facets, state) {
  let n = 0;
  for (const facet of facets) {
    const value = state[facet.id];
    if (!isFilterActive(facet, value)) continue;
    n += Array.isArray(value) && isOptionFacet(facet) ? value.length : 1;
  }
  return n;
}

/**
 * A compiled test for one facet, over the value its reader returned.
 * @param {Facet} facet
 * @param {unknown} value A normalized value.
 * @returns {(raw: unknown) => boolean}
 */
function compile(facet, value) {
  switch (facet.type) {
    case "checkbox": {
      const wanted = new Set(/** @type {OptionId[]} */ (value).map(key));
      if (facet.match === "all") {
        return (raw) => {
          if (!Array.isArray(raw))
            return (
              wanted.size === 1 &&
              wanted.has(key(/** @type {OptionId} */ (raw)))
            );
          let found = 0;
          for (const v of raw) if (wanted.has(key(v))) found++;
          return found >= wanted.size;
        };
      }
      return (raw) => {
        if (Array.isArray(raw)) {
          for (const v of raw) if (wanted.has(key(v))) return true;
          return false;
        }
        return raw != null && wanted.has(key(/** @type {OptionId} */ (raw)));
      };
    }
    case "tree": {
      const wanted = new Set(
        expandTreeIds(facet, /** @type {OptionId[]} */ (value)),
      );
      return (raw) => {
        if (Array.isArray(raw)) {
          for (const v of raw) if (wanted.has(key(v))) return true;
          return false;
        }
        return raw != null && wanted.has(key(/** @type {OptionId} */ (raw)));
      };
    }
    case "radio": {
      const wanted = key(/** @type {OptionId} */ (value));
      return (raw) =>
        raw != null && key(/** @type {OptionId} */ (raw)) === wanted;
    }
    case "toggle":
      return (raw) => Boolean(raw);
    case "range": {
      const [lo, hi] = /** @type {[number | null, number | null]} */ (value);
      return (raw) => {
        if (raw == null || raw === "") return false;
        const n = typeof raw === "number" ? raw : Number(raw);
        return (lo === null || n >= lo) && (hi === null || n <= hi);
      };
    }
    case "date": {
      const [lo, hi] = /** @type {[string | null, string | null]} */ (value);
      return (raw) => {
        if (raw == null || raw === "") return false;
        const day =
          raw instanceof Date
            ? raw.toISOString().slice(0, 10)
            : String(raw).slice(0, 10);
        return (lo === null || day >= lo) && (hi === null || day <= hi);
      };
    }
    default:
      return () => true;
  }
}

/**
 * Compile the active facets of a state.
 * @param {Facet[]} facets
 * @param {FilterState} state
 * @returns {Array<((raw: unknown) => boolean) | null>}
 */
function compileState(facets, state) {
  return facets.map((facet) => {
    const value = normalizeFacetValue(facet, state[facet.id]);
    return value === undefined ? null : compile(facet, value);
  });
}

/**
 * The records every active facet accepts.
 * @template T
 * @param {T[]} records
 * @param {Facet[]} facets
 * @param {FilterState} state
 * @returns {T[]}
 */
export function filterRecords(records, facets, state) {
  const tests = compileState(facets, state);
  /** @type {Array<{ read: (record: any) => unknown, test: (raw: unknown) => boolean }>} */
  const active = [];
  for (let i = 0; i < facets.length; i++) {
    const test = tests[i];
    if (test) active.push({ read: reader(facets[i]), test });
  }
  if (active.length === 0) return records;
  const out = [];
  outer: for (const record of records) {
    for (const { read, test } of active) {
      if (!test(read(record))) continue outer;
    }
    out.push(record);
  }
  return out;
}

/**
 * The count of records each option would show, and how many records match.
 *
 * The count is disjunctive: a facet's own selection does not shrink its own
 * counts, so an option beside a checked one shows what checking it too would
 * add. A `checkbox` facet with `match: "all"` is conjunctive and counts under
 * its own selection too. A `tree` facet counts every node, its descendants
 * included. A `range` or `date` facet has no counts.
 *
 * One pass: each record fails zero, one or several facets. Passing all is a
 * match and counts for every facet. Failing exactly one counts for that
 * facet only, which is what "all the other filters" means. That costs one
 * test per active facet per record, however many facets there are.
 *
 * @param {any[]} records
 * @param {Facet[]} facets
 * @param {FilterState} state
 * @returns {{ total: number, counts: FacetCounts }}
 */
export function facetCounts(records, facets, state) {
  const n = facets.length;
  const tests = compileState(facets, state);
  const readers = facets.map(reader);
  /** @type {Array<Map<string, number> | null>} */
  const tallies = facets.map((facet) =>
    isOptionFacet(facet) ? new Map() : null,
  );
  /** @type {Array<Map<string, string[]> | null>} */
  const ancestors = facets.map((facet) =>
    facet.type === "tree" ? treeIndex(facet).up : null,
  );
  const conjunctive = facets.map(
    (facet) => facet.type === "checkbox" && facet.match === "all",
  );
  /** @type {unknown[]} */
  const values = new Array(n);
  let total = 0;

  for (let r = 0; r < records.length; r++) {
    const record = records[r];
    let fails = 0;
    let failed = -1;
    for (let i = 0; i < n; i++) {
      const raw = readers[i](record);
      values[i] = raw;
      const test = tests[i];
      if (test !== null && !test(raw)) {
        fails++;
        failed = i;
      }
    }
    if (fails > 1) continue;
    if (fails === 0) total++;
    for (let i = 0; i < n; i++) {
      const tally = tallies[i];
      if (tally === null) continue;
      if (fails === 1 && (failed !== i || conjunctive[i])) continue;
      const raw = values[i];
      if (raw == null || raw === "") continue;
      const up = ancestors[i];
      if (Array.isArray(raw)) {
        /** @type {Set<string> | null} */
        const seen = raw.length > 1 ? new Set() : null;
        for (const v of raw) {
          const k = key(v);
          if (up === null) {
            if (seen !== null) {
              if (seen.has(k)) continue;
              seen.add(k);
            }
            tally.set(k, (tally.get(k) ?? 0) + 1);
          } else {
            for (const a of up.get(k) ?? []) {
              if (seen !== null) {
                if (seen.has(a)) continue;
                seen.add(a);
              }
              tally.set(a, (tally.get(a) ?? 0) + 1);
            }
          }
        }
      } else if (facets[i].type === "toggle") {
        if (raw) tally.set("true", (tally.get("true") ?? 0) + 1);
      } else {
        const k = key(/** @type {OptionId} */ (raw));
        if (up === null) tally.set(k, (tally.get(k) ?? 0) + 1);
        else
          for (const a of up.get(k) ?? [])
            tally.set(a, (tally.get(a) ?? 0) + 1);
      }
    }
  }

  /** @type {FacetCounts} */
  const counts = {};
  for (let i = 0; i < n; i++) {
    const tally = tallies[i];
    if (tally !== null) counts[facets[i].id] = Object.fromEntries(tally);
  }
  return { total, counts };
}

/**
 * The options of a `checkbox` or `radio` facet that has none: every distinct
 * value in the records, the most common first, then by label.
 * @param {any[]} records
 * @param {Facet} facet
 * @returns {FilterOption[]}
 */
export function deriveOptions(records, facet) {
  const read = reader(facet);
  /** @type {Map<string, { id: OptionId, count: number }>} */
  const seen = new Map();
  for (const record of records) {
    const raw = read(record);
    if (raw == null || raw === "") continue;
    for (const v of Array.isArray(raw) ? raw : [raw]) {
      const k = key(v);
      const entry = seen.get(k);
      if (entry) entry.count++;
      else seen.set(k, { id: v, count: 1 });
    }
  }
  return [...seen.values()]
    .sort((a, b) => b.count - a.count || key(a.id).localeCompare(key(b.id)))
    .map(({ id }) => ({ id, label: key(id) }));
}

/**
 * The facets with `options` read from the records wherever a `checkbox` or
 * `radio` facet has none. Run it once per data set, not per change: it walks
 * every record.
 * @param {any[]} records
 * @param {Facet[]} facets
 * @returns {Facet[]}
 */
export function deriveFacetOptions(records, facets) {
  return facets.map((facet) => {
    if (facet.type !== "checkbox" && facet.type !== "radio") return facet;
    if (facet.options && facet.options.length > 0) return facet;
    return { ...facet, options: deriveOptions(records, facet) };
  });
}

/**
 * The smallest and largest value of a `range` or `date` facet.
 * @param {any[]} records
 * @param {Facet} facet
 * @returns {{ min: number | string, max: number | string } | null}
 */
export function facetDomain(records, facet) {
  const read = reader(facet);
  /** @type {any} */
  let min = null;
  /** @type {any} */
  let max = null;
  for (const record of records) {
    /** @type {any} */
    let raw = read(record);
    if (raw == null || raw === "") continue;
    raw = facet.type === "date" ? String(raw).slice(0, 10) : Number(raw);
    if (min === null || raw < min) min = raw;
    if (max === null || raw > max) max = raw;
  }
  return min === null ? null : { min, max };
}

/**
 * The labels of a facet's options, by id. A `tree` facet's include its
 * descendants'.
 * @param {Facet} facet
 * @returns {Map<string, string>}
 */
export function optionLabels(facet) {
  if (facet.type === "tree") return treeIndex(facet).labels;
  /** @type {Map<string, string>} */
  const labels = new Map();
  if ("options" in facet && facet.options) {
    for (const option of facet.options) {
      labels.set(key(option.id), option.label ?? key(option.id));
    }
  }
  return labels;
}

/**
 * One dismissible chip per applied selection, for the summary bar.
 * @typedef {Object} AppliedFilter
 * @property {string} facetId
 * @property {string} facetLabel
 * @property {OptionId | null} optionId Set for an option; `null` removes the facet.
 * @property {string} text The value, as shown: `Acme`, `10 to 50`.
 * @property {string} label The chip's text: `Brand: Acme`. A toggle is its own label.
 *
 * @param {Facet[]} facets
 * @param {FilterState} state
 * @param {{ range?: (facet: RangeFacet, lo: number | null, hi: number | null) => string }} [options]
 * @returns {AppliedFilter[]}
 */
export function appliedFilters(facets, state, options = {}) {
  /** @type {AppliedFilter[]} */
  const out = [];
  for (const facet of facets) {
    const value = state[facet.id];
    if (!isFilterActive(facet, value)) continue;
    const first = out.length;
    const base = { facetId: facet.id, facetLabel: facet.label, label: "" };
    switch (facet.type) {
      case "checkbox":
      case "tree": {
        const labels = optionLabels(facet);
        for (const id of /** @type {OptionId[]} */ (value)) {
          out.push({
            ...base,
            optionId: id,
            text: labels.get(key(id)) ?? key(id),
          });
        }
        break;
      }
      case "radio": {
        const id = /** @type {OptionId} */ (value);
        out.push({
          ...base,
          optionId: id,
          text: optionLabels(facet).get(key(id)) ?? key(id),
        });
        break;
      }
      case "range": {
        const [lo, hi] = /** @type {[number | null, number | null]} */ (value);
        const format = facet.format ?? String;
        out.push({
          ...base,
          optionId: null,
          text: options.range
            ? options.range(facet, lo, hi)
            : rangeText(
                lo === null ? null : format(lo),
                hi === null ? null : format(hi),
              ),
        });
        break;
      }
      case "date": {
        const [lo, hi] = /** @type {[string | null, string | null]} */ (value);
        out.push({ ...base, optionId: null, text: rangeText(lo, hi) });
        break;
      }
      case "toggle":
        out.push({
          ...base,
          optionId: null,
          text: facet.toggleLabel ?? facet.label,
        });
        break;
    }
    for (let i = first; i < out.length; i++) {
      out[i].label =
        facet.type === "toggle"
          ? out[i].text
          : `${facet.label}: ${out[i].text}`;
    }
  }
  return out;
}

/**
 * @param {string | null} lo
 * @param {string | null} hi
 */
function rangeText(lo, hi) {
  if (lo !== null && hi !== null) return `${lo} to ${hi}`;
  if (lo !== null) return `from ${lo}`;
  return `up to ${hi}`;
}

/**
 * The state without one chip's selection.
 * @param {Facet[]} facets
 * @param {FilterState} state
 * @param {AppliedFilter} chip
 * @returns {FilterState}
 */
export function removeApplied(facets, state, chip) {
  const next = { ...state };
  const value = next[chip.facetId];
  if (chip.optionId !== null && Array.isArray(value)) {
    const rest = value.filter((v) => key(v) !== key(chip.optionId ?? ""));
    if (rest.length > 0) next[chip.facetId] = rest;
    else delete next[chip.facetId];
  } else {
    delete next[chip.facetId];
  }
  return normalizeFilterState(facets, next);
}

/* Conversions ---------------------------------------------------------- */

/**
 * The state as a flat list of filters, the shape of TokenSearch's
 * `query.filters`: a checkbox's options are one `eq` with several values (any
 * of), a `match: "all"` facet one `eq` per value (a repeated key is "and"), a
 * range `gte`, `lte` or `between`. A tree carries its leaves.
 *
 * @param {Facet[]} facets
 * @param {FilterState} state
 * @returns {Filter[]}
 */
export function toFilters(facets, state) {
  /** @type {Filter[]} */
  const out = [];
  for (const facet of facets) {
    const value = normalizeFacetValue(facet, state[facet.id]);
    if (value === undefined) continue;
    const base = { key: facet.id, negated: false };
    switch (facet.type) {
      case "checkbox": {
        const values = /** @type {OptionId[]} */ (value).map(key);
        if (facet.match === "all") {
          for (const v of values) out.push({ ...base, op: "eq", values: [v] });
        } else {
          out.push({ ...base, op: "eq", values });
        }
        break;
      }
      case "tree":
        out.push({
          ...base,
          op: "eq",
          values: treeLeaves(facet, /** @type {OptionId[]} */ (value)),
        });
        break;
      case "radio":
        out.push({
          ...base,
          op: "eq",
          values: [key(/** @type {OptionId} */ (value))],
        });
        break;
      case "toggle":
        out.push({ ...base, op: "eq", values: ["true"] });
        break;
      case "range":
      case "date": {
        const [lo, hi] = /** @type {Array<number | string | null>} */ (value);
        const [a, b] = [
          lo === null ? null : String(lo),
          hi === null ? null : String(hi),
        ];
        if (a !== null && b !== null)
          out.push({ ...base, op: "between", values: [a, b] });
        else if (a !== null) out.push({ ...base, op: "gte", values: [a] });
        else if (b !== null) out.push({ ...base, op: "lte", values: [b] });
        break;
      }
    }
  }
  return out;
}

/**
 * The state from a list of filters. A filter the facets cannot show (an
 * unknown key, a negation, a `gt` on a range, a value the options lack when
 * `strict`) comes back in `skipped`, never in the state.
 *
 * @param {Facet[]} facets
 * @param {Filter[]} filters
 * @param {{ strict?: boolean }} [options] `strict` (the default) drops values
 *   a facet's `options` do not list.
 * @returns {{ state: FilterState, skipped: Filter[] }}
 */
export function fromFilters(facets, filters, options = {}) {
  const strict = options.strict !== false;
  /** @type {Map<string, Facet>} */
  const byId = new Map(facets.map((facet) => [facet.id, facet]));
  /** @type {Record<string, unknown>} */
  const draft = {};
  /** @type {Filter[]} */
  const skipped = [];

  for (const filter of filters) {
    const facet = byId.get(filter.key);
    if (!facet || filter.negated) {
      skipped.push(filter);
      continue;
    }
    switch (facet.type) {
      case "checkbox":
      case "tree":
      case "radio": {
        if (filter.op !== "eq") {
          skipped.push(filter);
          break;
        }
        const known = strict ? optionLabels(facet) : null;
        const ids = filter.values
          .map((v) => optionFor(facet, v))
          .filter(
            (v) => known === null || known.size === 0 || known.has(key(v)),
          );
        if (ids.length === 0) {
          skipped.push(filter);
          break;
        }
        if (facet.type === "radio") draft[facet.id] = ids[0];
        else {
          const prev =
            /** @type {OptionId[] | undefined} */ (draft[facet.id]) ?? [];
          draft[facet.id] = [...prev, ...ids];
        }
        break;
      }
      case "toggle":
        if (filter.op === "eq" && filter.values[0] === "true")
          draft[facet.id] = true;
        else skipped.push(filter);
        break;
      case "range":
      case "date": {
        const cast = facet.type === "range" ? toNumber : toDate;
        const prev = /** @type {Array<number | string | null>} */ (
          draft[facet.id] ?? [null, null]
        );
        /** @type {Array<number | string | null>} */
        let next;
        if (filter.op === "between" && filter.values.length === 2) {
          next = [cast(filter.values[0]), cast(filter.values[1])];
        } else if (filter.op === "gte" && filter.values.length === 1) {
          next = [cast(filter.values[0]), prev[1]];
        } else if (filter.op === "lte" && filter.values.length === 1) {
          next = [prev[0], cast(filter.values[0])];
        } else {
          skipped.push(filter);
          break;
        }
        draft[facet.id] = next;
        break;
      }
    }
  }

  const state = normalizeFilterState(facets, draft);
  for (const facet of facets) {
    const value = state[facet.id];
    if (facet.type === "tree" && Array.isArray(value)) {
      state[facet.id] = compactTreeIds(facet, expandTreeIds(facet, value));
    }
  }
  return { state, skipped };
}

/**
 * Give a string value its option's id (a facet may use numbers).
 * @param {Facet} facet
 * @param {string} value
 * @returns {OptionId}
 */
function optionFor(facet, value) {
  if (facet.type === "tree")
    return treeIndex(facet).labels.has(value) ? value : value;
  if ("options" in facet && facet.options) {
    for (const option of facet.options)
      if (key(option.id) === value) return option.id;
  }
  return value;
}

/**
 * The state as a TokenSearch query: `{ text, filters }`. Pass free text to
 * keep it beside the filters.
 * @param {Facet[]} facets
 * @param {FilterState} state
 * @param {string} [text]
 * @returns {{ text: string, filters: Filter[] }}
 */
export function toQuery(facets, state, text = "") {
  return { text, filters: toFilters(facets, state) };
}

/**
 * The state from a TokenSearch query. A `filters` entry may omit `negated`.
 * @param {Facet[]} facets
 * @param {{ text?: string, filters?: Array<Partial<Filter> & Pick<Filter, "key" | "op" | "values">> }} query
 * @param {{ strict?: boolean }} [options]
 */
export function fromQuery(facets, query, options) {
  const filters = (query.filters ?? []).map((f) => ({
    negated: false,
    ...f,
  }));
  return { text: query.text ?? "", ...fromFilters(facets, filters, options) };
}

/**
 * @typedef {{ id?: string, field: string, operator: string, value: unknown }} QueryConditionLike
 * @typedef {{ id?: string, operator: "and" | "or", conditions: Array<QueryConditionLike | QueryGroupLike> }} QueryGroupLike
 */

/**
 * The state as a QueryBuilder tree: one `and` group of conditions. The
 * conversion carries the leaf ids of a `tree` facet, so `evaluateQuery` over
 * a record's leaf matches without knowing the hierarchy.
 *
 * | Facet | Condition |
 * | --- | --- |
 * | checkbox (any) | `isAnyOf`, or `is` for one value |
 * | checkbox (all) | one `is` per value |
 * | radio, tree | `is`, `isAnyOf` |
 * | toggle | `is` `true` |
 * | range | `gte`, `lte`, `between` |
 * | date | `onOrAfter`, `onOrBefore`, `between` |
 *
 * @param {Facet[]} facets
 * @param {FilterState} state
 * @returns {QueryGroupLike}
 */
export function toConditions(facets, state) {
  /** @type {QueryConditionLike[]} */
  const conditions = [];
  for (const filter of toFilters(facets, state)) {
    const facet = /** @type {Facet} */ (
      facets.find((f) => f.id === filter.key)
    );
    const field = filter.key;
    switch (facet.type) {
      case "toggle":
        conditions.push({ field, operator: "is", value: true });
        break;
      case "range": {
        const nums = filter.values.map(Number);
        if (filter.op === "between")
          conditions.push({ field, operator: "between", value: nums });
        else conditions.push({ field, operator: filter.op, value: nums[0] });
        break;
      }
      case "date":
        if (filter.op === "between") {
          conditions.push({ field, operator: "between", value: filter.values });
        } else {
          conditions.push({
            field,
            operator: filter.op === "gte" ? "onOrAfter" : "onOrBefore",
            value: filter.values[0],
          });
        }
        break;
      default:
        if (filter.values.length === 1) {
          conditions.push({ field, operator: "is", value: filter.values[0] });
        } else {
          conditions.push({ field, operator: "isAnyOf", value: filter.values });
        }
    }
  }
  return { operator: "and", conditions };
}

/**
 * The state from a QueryBuilder tree. Only an `and` group of the conditions
 * `toConditions` writes reads back; a nested group, an `or`, a negating
 * operator or an unknown field comes back in `skipped`.
 *
 * @param {Facet[]} facets
 * @param {QueryGroupLike} group
 * @param {{ strict?: boolean }} [options]
 * @returns {{ state: FilterState, skipped: Array<QueryConditionLike | QueryGroupLike> }}
 */
export function fromConditions(facets, group, options) {
  /** @type {Filter[]} */
  const filters = [];
  /** @type {Array<QueryConditionLike | QueryGroupLike>} */
  const skipped = [];
  const flat = group.operator === "and";
  for (const node of group.conditions) {
    if (!flat || "conditions" in node) {
      skipped.push(node);
      continue;
    }
    const { field, operator, value } = node;
    /** @type {Filter | null} */
    let filter = null;
    const list = Array.isArray(value) ? value.map(String) : [String(value)];
    switch (operator) {
      case "is":
      case "isAnyOf":
        filter = { key: field, op: "eq", values: list, negated: false };
        break;
      case "gte":
      case "onOrAfter":
        filter = { key: field, op: "gte", values: list, negated: false };
        break;
      case "lte":
      case "onOrBefore":
        filter = { key: field, op: "lte", values: list, negated: false };
        break;
      case "between":
        filter = { key: field, op: "between", values: list, negated: false };
        break;
    }
    if (filter === null) skipped.push(node);
    else filters.push(filter);
  }
  const read = fromFilters(facets, filters, options);
  for (const filter of read.skipped) {
    skipped.push({
      field: filter.key,
      operator: filter.op,
      value: filter.values,
    });
  }
  return { state: read.state, skipped };
}

/**
 * Test a record against a QueryBuilder `and` group of the conditions
 * `toConditions` writes. It exists so the conversion can be checked
 * against `filterRecords`; use QueryBuilder's `evaluateQuery` in an app.
 * @param {Facet[]} facets
 * @param {QueryGroupLike} group
 * @param {any} record
 */
export function matchesConditions(facets, group, record) {
  return group.conditions.every((node) => {
    if ("conditions" in node) return false;
    const facet = facets.find((f) => f.id === node.field);
    if (!facet) return false;
    const raw = reader(facet)(record);
    const values = Array.isArray(raw) ? raw : [raw];
    const { operator, value } = node;
    if (operator === "is")
      return values.some(
        (v) =>
          key(v) === key(/** @type {OptionId} */ (value)) ||
          (facet.type === "toggle" && Boolean(v)),
      );
    if (operator === "isAnyOf") {
      const wanted = new Set(/** @type {OptionId[]} */ (value).map(key));
      return values.some((v) => v != null && wanted.has(key(v)));
    }
    const v = values[0];
    if (v == null) return false;
    const cmp = facet.type === "date" ? String(v).slice(0, 10) : Number(v);
    if (operator === "gte" || operator === "onOrAfter")
      return cmp >= /** @type {any} */ (value);
    if (operator === "lte" || operator === "onOrBefore")
      return cmp <= /** @type {any} */ (value);
    if (operator === "between") {
      const [lo, hi] = /** @type {any[]} */ (value);
      return cmp >= lo && cmp <= hi;
    }
    return false;
  });
}

/* URL ------------------------------------------------------------------ */

/**
 * The state as query parameters. A checkbox or tree writes one parameter per
 * value (`brand=a&brand=b`), so a value may hold a comma. A range or date
 * writes `10..50`, `10..` or `..50`. A toggle writes `true`.
 * @param {Facet[]} facets
 * @param {FilterState} state
 * @param {{ prefix?: string }} [options] `prefix` keeps the names clear of
 *   other parameters (`f.brand`).
 * @returns {URLSearchParams}
 */
export function toSearchParams(facets, state, options = {}) {
  const prefix = options.prefix ?? "";
  const params = new URLSearchParams();
  for (const facet of facets) {
    const value = normalizeFacetValue(facet, state[facet.id]);
    if (value === undefined) continue;
    const name = prefix + facet.id;
    switch (facet.type) {
      case "checkbox":
      case "tree":
        for (const v of /** @type {OptionId[]} */ (value))
          params.append(name, key(v));
        break;
      case "radio":
        params.set(name, key(/** @type {OptionId} */ (value)));
        break;
      case "toggle":
        params.set(name, "true");
        break;
      case "range":
      case "date": {
        const [lo, hi] = /** @type {Array<number | string | null>} */ (value);
        params.set(name, `${lo ?? ""}..${hi ?? ""}`);
        break;
      }
    }
  }
  return params;
}

/**
 * The state from query parameters. It reads only the schema's names, drops a
 * value that does not parse, and with `strict` (the default) a value a
 * facet's `options` do not list, so a hand-edited URL never reaches a facet
 * as something it cannot show.
 * @param {Facet[]} facets
 * @param {URLSearchParams | string} params
 * @param {{ prefix?: string, strict?: boolean }} [options]
 * @returns {FilterState}
 */
export function fromSearchParams(facets, params, options = {}) {
  const prefix = options.prefix ?? "";
  const search =
    typeof params === "string" ? new URLSearchParams(params) : params;
  /** @type {Record<string, unknown>} */
  const draft = {};
  for (const facet of facets) {
    const name = prefix + facet.id;
    const raw = search.getAll(name);
    if (raw.length === 0) continue;
    switch (facet.type) {
      case "checkbox":
      case "tree":
        draft[facet.id] = raw.map((v) => optionFor(facet, v));
        break;
      case "radio":
        draft[facet.id] = optionFor(facet, raw[0]);
        break;
      case "toggle":
        if (raw[0] === "true") draft[facet.id] = true;
        break;
      case "range":
      case "date": {
        const at = raw[0].indexOf("..");
        if (at < 0) break;
        const lo = raw[0].slice(0, at);
        const hi = raw[0].slice(at + 2);
        draft[facet.id] =
          facet.type === "range"
            ? [toNumber(lo), toNumber(hi)]
            : [toDate(lo), toDate(hi)];
        break;
      }
    }
  }
  const state = normalizeFilterState(facets, draft);
  if (options.strict === false) return state;
  for (const facet of facets) {
    const value = state[facet.id];
    if (!Array.isArray(value) && facet.type !== "radio") continue;
    if (
      facet.type !== "checkbox" &&
      facet.type !== "radio" &&
      facet.type !== "tree"
    )
      continue;
    const known = optionLabels(facet);
    if (known.size === 0) continue;
    if (facet.type === "radio") {
      if (!known.has(key(/** @type {OptionId} */ (value))))
        delete state[facet.id];
    } else {
      const kept = /** @type {OptionId[]} */ (value).filter((v) =>
        known.has(key(v)),
      );
      if (kept.length > 0) state[facet.id] = kept;
      else delete state[facet.id];
    }
  }
  return state;
}
