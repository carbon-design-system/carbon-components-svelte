// @ts-check
// The URL is the catalog's one state: `q`, one parameter per facet value,
// `sort`, `view` and `page`. Nothing else is kept, so a link, a reload and the
// back button all mean the same thing. A parameter the catalog does not own
// (a theme, a campaign tag) is left alone.

import {
  fromSearchParams,
  toSearchParams,
} from "../../../src/FilterPanel/filter-model.js";
import { FACETS, SORTS } from "./catalog-data.js";

/** Most pages one URL may ask the first load to cover. */
export const MAX_PAGES = 100;

/** @type {import("./catalog-url.js").CatalogState} */
export const DEFAULT_STATE = Object.freeze({
  q: "",
  filters: {},
  sort: "relevance",
  view: "grid",
  pages: 1,
});

const OWNED = ["q", "sort", "view", "page", ...FACETS.map((facet) => facet.id)];

/**
 * @param {string | URLSearchParams} search
 * @returns {import("./catalog-url.js").CatalogState}
 */
export function parseCatalogUrl(search) {
  const params =
    typeof search === "string" ? new URLSearchParams(search) : search;
  const sort = params.get("sort") ?? "";
  const page = Number.parseInt(params.get("page") ?? "1", 10);
  return {
    q: (params.get("q") ?? "").trim().slice(0, 200),
    filters: fromSearchParams(FACETS, params),
    sort: SORTS.some((s) => s.id === sort) ? sort : DEFAULT_STATE.sort,
    view: params.get("view") === "list" ? "list" : "grid",
    pages: Number.isFinite(page) && page > 1 ? Math.min(page, MAX_PAGES) : 1,
  };
}

/**
 * The query string for a state, `""` when it is the default. Parameters the
 * catalog does not own are carried over from `current`.
 *
 * @param {import("./catalog-url.js").CatalogState} state
 * @param {string | URLSearchParams} [current]
 */
export function formatCatalogUrl(state, current = "") {
  const params = new URLSearchParams(current);
  for (const key of OWNED) params.delete(key);
  if (state.q.trim()) params.set("q", state.q.trim());
  for (const [key, value] of toSearchParams(FACETS, state.filters)) {
    params.append(key, value);
  }
  if (state.sort !== DEFAULT_STATE.sort) params.set("sort", state.sort);
  if (state.view !== DEFAULT_STATE.view) params.set("view", state.view);
  if (state.pages > 1) params.set("page", String(state.pages));
  const text = params.toString();
  return text ? `?${text}` : "";
}

/**
 * Whether two states ask for the same results, whatever depth they show.
 * @param {import("./catalog-url.js").CatalogState} a
 * @param {import("./catalog-url.js").CatalogState} b
 */
export function sameQuery(a, b) {
  return (
    formatCatalogUrl({ ...a, pages: 1, view: "grid" }) ===
    formatCatalogUrl({ ...b, pages: 1, view: "grid" })
  );
}
