// @ts-check
// What a page of charts shares beyond one chart's sync channel: the filters
// a click on one chart puts on all of them, and the series the legend has
// hidden. A store, so any layout can read it, and pure helpers to apply it
// to rows.

import { get, writable } from "svelte/store";
import { toAccessor } from "./accessor.js";

/**
 * @param {import("./dashboard.d.ts").DashboardOptions} [options]
 * @returns {import("./dashboard.d.ts").Dashboard}
 */
export function createDashboard(options = {}) {
  const store = writable(
    /** @type {import("./dashboard.d.ts").DashboardValue} */ ({
      filters: [],
      hidden: [],
    }),
  );
  const { range } = options;

  /** @param {(value: import("./dashboard.d.ts").DashboardValue) => import("./dashboard.d.ts").DashboardValue} fn */
  const update = (fn) => store.update(fn);
  /**
   * @param {import("./dashboard.d.ts").DashboardFilter} a
   * @param {import("./dashboard.d.ts").DashboardFilter} b
   */
  const same = (a, b) => a.dimension === b.dimension && a.value === b.value;

  return {
    subscribe: store.subscribe,
    range,
    filter(dimension, value) {
      update((current) =>
        current.filters.some((f) => same(f, { dimension, value }))
          ? current
          : { ...current, filters: [...current.filters, { dimension, value }] },
      );
    },
    unfilter(dimension, value) {
      update((current) => ({
        ...current,
        filters: current.filters.filter(
          (f) =>
            f.dimension !== dimension ||
            (value !== undefined && f.value !== value),
        ),
      }));
    },
    toggleFilter(dimension, value) {
      const has = get(store).filters.some((f) => same(f, { dimension, value }));
      if (has) this.unfilter(dimension, value);
      else this.filter(dimension, value);
    },
    clearFilters() {
      update((current) =>
        current.filters.length === 0 ? current : { ...current, filters: [] },
      );
    },
    setHidden(hidden) {
      update((current) => ({ ...current, hidden: [...hidden] }));
    },
  };
}

/**
 * The rows a dashboard's filters keep: each filter's dimension, read as a
 * property or through `accessors`, must equal its value. Rows with no
 * filters on their dimensions pass.
 *
 * @template T
 * @param {ReadonlyArray<T>} rows
 * @param {ReadonlyArray<import("./dashboard.d.ts").DashboardFilter>} filters
 * @param {Record<string, import("./accessor.js").Accessor<T, unknown>>} [accessors]
 * @returns {T[]}
 */
export function filterRows(rows, filters, accessors = {}) {
  if (filters.length === 0) return [...rows];
  /** @type {Map<string, Set<unknown>>} */
  const wanted = new Map();
  for (const { dimension, value } of filters) {
    let set = wanted.get(dimension);
    if (!set) {
      set = new Set();
      wanted.set(dimension, set);
    }
    set.add(value);
  }
  const readers = [...wanted].map(([dimension, values]) => ({
    read: toAccessor(/** @type {any} */ (accessors[dimension] ?? dimension)),
    values,
  }));
  return rows.filter((row, i) =>
    readers.every(({ read, values }) => values.has(read(row, i))),
  );
}

/**
 * The rows whose x falls inside a time range, both ends included.
 *
 * @template T
 * @param {ReadonlyArray<T>} rows
 * @param {import("./accessor.js").Accessor<T, Date | number>} x
 * @param {{ from: Date | number; to: Date | number }} range
 * @returns {T[]}
 */
export function withinRange(rows, x, range) {
  const read = toAccessor(x);
  const from = new Date(range.from).getTime();
  const to = new Date(range.to).getTime();
  return rows.filter((row, i) => {
    const value = new Date(read(row, i)).getTime();
    return value >= from && value <= to;
  });
}
