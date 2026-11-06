// @ts-check
// A `CatalogSource` is how the page asks for results: server-side search,
// facets and sort, and a cursor. `createMemorySource` is one over a list in
// memory. `loadCatalog` turns "the first N results" into the requests a
// source answers.

import {
  facetCounts,
  filterRecords,
} from "../../../src/FilterPanel/filter-model.js";
import { foldText } from "../../../src/utils/text-match.js";
import { FACETS, generateCatalog } from "./catalog-data.js";

/**
 * @param {number} ms
 * @param {AbortSignal | undefined} signal
 */
function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

/**
 * Words the query asks for, folded the way the haystacks are.
 * @param {string} q
 */
function termsOf(q) {
  return foldText(q.trim()).split(/\s+/).filter(Boolean);
}

/**
 * A source over a list in memory, standing in for a server: it folds and ranks
 * the query, filters by the facets, counts the facets, sorts, and pages by an
 * opaque cursor. It builds its search index on the first query.
 *
 * @param {Object} [options]
 * @param {number} [options.size=5000] Items to generate.
 * @param {import("./catalog-data.js").CatalogItem[]} [options.items] Use these instead.
 * @param {number} [options.latency=0] Milliseconds each query takes.
 * @param {number} [options.maxLimit=200] Most results one query returns.
 * @returns {import("./catalog-source.js").CatalogSource}
 */
export function createMemorySource({
  size = 5000,
  items,
  latency = 0,
  maxLimit = 200,
} = {}) {
  /** @type {import("./catalog-data.js").CatalogItem[] | undefined} */
  let records = items;
  /** @type {Array<{ name: string; provider: string; tags: string; description: string }>} */
  let index = [];
  /** @type {Map<string, number[]>} */
  const orders = new Map();
  /** @type {{ key: string; ids: number[]; scores: Map<number, number>; counts: import("../../../src/FilterPanel/filter-model.js").FacetCounts; total: number } | null} */
  let last = null;

  function build() {
    if (records) return;
    records = generateCatalog(size);
  }

  function buildIndex() {
    if (index.length || !records) return;
    index = records.map((item) => ({
      name: foldText(item.name),
      provider: foldText(item.provider),
      tags: foldText(item.tags.join(" ")),
      description: foldText(item.description),
    }));
  }

  /**
   * The positions of the records in `sort` order, before any filter.
   * @param {string} sort
   */
  function orderFor(sort) {
    const all = /** @type {import("./catalog-data.js").CatalogItem[]} */ (
      records
    );
    const key = sort === "relevance" ? "popular" : sort;
    let order = orders.get(key);
    if (order) return order;
    order = all.map((_, at) => at);
    if (key === "popular")
      order.sort((a, b) => all[b].installs - all[a].installs);
    else if (key === "name")
      order.sort((a, b) => all[a].name.localeCompare(all[b].name));
    else if (key === "newest")
      order.sort((a, b) => all[b].updated.localeCompare(all[a].updated));
    else if (key === "rating")
      order.sort(
        (a, b) =>
          all[b].rating - all[a].rating || all[b].reviews - all[a].reviews,
      );
    orders.set(key, order);
    return order;
  }

  /**
   * @param {import("./catalog-source.js").CatalogQuery} query
   */
  function run({ q, filters, sort }) {
    build();
    buildIndex();
    const all = /** @type {import("./catalog-data.js").CatalogItem[]} */ (
      records
    );
    const key = JSON.stringify([q.trim(), filters, sort]);
    if (last?.key === key) return last;

    const terms = termsOf(q);
    /** @type {Map<number, number>} */
    const scores = new Map();
    const matched = [];
    for (let at = 0; at < all.length; at += 1) {
      if (terms.length === 0) {
        matched.push(at);
        continue;
      }
      const entry = index[at];
      let score = 0;
      let every = true;
      for (const term of terms) {
        let part = 0;
        if (entry.name.startsWith(term)) part = 100;
        else if (entry.name.includes(` ${term}`)) part = 70;
        else if (entry.name.includes(term)) part = 50;
        else if (entry.provider.includes(term)) part = 20;
        else if (entry.tags.includes(term)) part = 10;
        else if (entry.description.includes(term)) part = 5;
        if (part === 0) {
          every = false;
          break;
        }
        score += part;
      }
      if (every) {
        scores.set(at, score);
        matched.push(at);
      }
    }

    // Counts ignore a facet's own choice, so they come from the text matches.
    const { counts } = facetCounts(
      matched.map((at) => all[at]),
      FACETS,
      filters,
    );
    const keep = new Set(
      filterRecords(
        matched.map((at) => all[at]),
        FACETS,
        filters,
      ),
    );
    const survivors = matched.filter((at) => keep.has(all[at]));
    /** @type {number[]} */
    let ids;
    if (sort === "relevance" && terms.length > 0) {
      ids = survivors.sort(
        (a, b) =>
          (scores.get(b) ?? 0) - (scores.get(a) ?? 0) ||
          all[b].installs - all[a].installs,
      );
    } else {
      const rank = new Map(orderFor(sort).map((at, place) => [at, place]));
      ids = survivors.sort((a, b) => (rank.get(a) ?? 0) - (rank.get(b) ?? 0));
    }
    last = { key, ids, scores, counts, total: ids.length };
    return last;
  }

  return {
    maxLimit,
    async query(query) {
      if (latency > 0) await delay(latency, query.signal);
      else if (query.signal?.aborted)
        throw new DOMException("Aborted", "AbortError");
      const found = run(query);
      const all = /** @type {import("./catalog-data.js").CatalogItem[]} */ (
        records
      );
      const start = query.cursor ? Number.parseInt(query.cursor, 36) : 0;
      const limit = Math.max(1, Math.min(query.limit, maxLimit));
      const end = Math.min(start + limit, found.total);
      return {
        items: found.ids.slice(start, end).map((at) => all[at]),
        nextCursor: end < found.total ? end.toString(36) : null,
        total: found.total,
        // Facet counts are one scan of the matches: first page only.
        counts: start === 0 ? found.counts : undefined,
      };
    },
  };
}

/**
 * Load the first `state.pages * pageSize` results: one request when the source
 * allows that many, a chain of cursor requests when it does not. Used to
 * render a page, and to put a reader back where they were.
 *
 * @param {import("./catalog-source.js").CatalogSource} source
 * @param {{ q: string; filters: import("../../../src/FilterPanel/filter-model.js").FilterState; sort: string; pages: number }} state
 * @param {Object} options
 * @param {number} options.pageSize
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<import("./catalog-source.js").CatalogResult>}
 */
export async function loadCatalog(source, state, { pageSize, signal }) {
  const want = Math.max(1, state.pages) * pageSize;
  const cap = source.maxLimit ?? want;
  /** @type {import("./catalog-data.js").CatalogItem[]} */
  const items = [];
  /** @type {string | null} */
  let cursor = null;
  /** @type {import("./catalog-source.js").CatalogResult | undefined} */
  let first;
  do {
    // Each request needs the cursor the one before it returned.
    // eslint-disable-next-line no-await-in-loop
    const result = await source.query({
      q: state.q,
      filters: state.filters,
      sort: state.sort,
      cursor,
      limit: Math.min(want - items.length, cap),
      signal,
    });
    first ??= result;
    items.push(...result.items);
    cursor = result.nextCursor;
  } while (cursor && items.length < want);
  return {
    items,
    nextCursor: cursor,
    total: first.total,
    counts: first.counts,
  };
}
