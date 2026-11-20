// @ts-check
import { fromFilters, toFilters } from "../FilterPanel/filter-model.js";
import {
  formatFilter,
  formatQuery,
  parseQuery,
} from "../TokenSearch/token-query.js";

/**
 * @typedef {import("./audit-state.js").AuditField} AuditField
 * @typedef {import("./audit-state.js").AuditViewState} AuditViewState
 * @typedef {import("./audit-state.js").TimeRangeState} TimeRangeState
 */

/** The relative windows, in milliseconds. */
export const RANGE_PRESETS = Object.freeze({
  "15m": 15 * 60_000,
  "1h": 3_600_000,
  "24h": 86_400_000,
  "7d": 7 * 86_400_000,
  "30d": 30 * 86_400_000,
});

export const DEFAULT_RANGE = "7d";

/** `YYYY-MM-DDTHH:mm`, UTC, as the URL and the inputs write a custom bound. */
const CUSTOM_BOUND = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

/**
 * Whether `text` is a real UTC minute.
 * @param {string} text
 */
function isBound(text) {
  return CUSTOM_BOUND.test(text) && !Number.isNaN(Date.parse(`${text}:00Z`));
}

/**
 * The instants a range stands for. A preset is relative to `now` and has an
 * open end; a custom range runs from the start of its first minute to the end
 * of its last.
 *
 * @param {TimeRangeState} range
 * @param {number} [now]
 * @returns {import("./audit-source.js").AuditRange}
 */
export function resolveRange(range, now = Date.now()) {
  if ("preset" in range) {
    return {
      from: new Date(now - RANGE_PRESETS[range.preset]).toISOString(),
      to: null,
    };
  }
  return {
    from: range.from ? new Date(`${range.from}:00Z`).toISOString() : null,
    to: range.to ? new Date(`${range.to}:59.999Z`).toISOString() : null,
  };
}

/**
 * The view state in a URL: `q`, then either `range` (a preset) or `from` and
 * `to` (a custom window), then `live`. Defaults are left out so a shared link
 * is short.
 *
 * @param {AuditViewState} state
 * @returns {URLSearchParams}
 */
export function toSearchParams(state) {
  const params = new URLSearchParams();
  if (state.q) params.set("q", state.q);
  if ("preset" in state.range) {
    if (state.range.preset !== DEFAULT_RANGE)
      params.set("range", state.range.preset);
  } else {
    if (state.range.from) params.set("from", state.range.from);
    if (state.range.to) params.set("to", state.range.to);
  }
  if (state.live) params.set("live", "1");
  return params;
}

/**
 * The view state from a URL. Anything that does not parse falls back to the
 * default, so a hand-edited link never throws.
 *
 * @param {string | URLSearchParams | URL | null | undefined} input
 * @returns {AuditViewState}
 */
export function fromSearchParams(input) {
  const params =
    input instanceof URLSearchParams
      ? input
      : input instanceof URL
        ? input.searchParams
        : new URLSearchParams(input ?? "");
  const q = (params.get("q") ?? "").slice(0, 2000);
  const preset = params.get("range");
  const from = params.get("from");
  const to = params.get("to");
  /** @type {TimeRangeState} */
  let range = { preset: DEFAULT_RANGE };
  if (preset && Object.keys(RANGE_PRESETS).includes(preset)) {
    range = { preset: /** @type {keyof typeof RANGE_PRESETS} */ (preset) };
  } else if ((from && isBound(from)) || (to && isBound(to))) {
    range = {
      from: from && isBound(from) ? from : "",
      to: to && isBound(to) ? to : "",
    };
  }
  return { q, range, live: params.get("live") === "1" };
}

/**
 * The schema twice: the keys `TokenSearch` accepts and the facets
 * `FilterPanel` draws, from one list of fields.
 *
 * @param {ReadonlyArray<AuditField>} fields
 * @param {Record<string, ReadonlyArray<string>>} [options] The values of a
 *   faceted field, by field, such as the keys of a server's counts.
 */
export function schemaFromFields(fields, options = {}) {
  const keys = fields.map((field) => {
    const values = options[field.key] ?? field.values ?? [];
    return {
      key: field.key,
      label: field.label,
      description: field.description,
      type: field.facet
        ? /** @type {const} */ ("enum")
        : /** @type {const} */ ("text"),
      ...(field.facet ? { values: [...values] } : {}),
    };
  });
  const facets = fields
    .filter((field) => field.facet)
    .map((field) => ({
      id: field.key,
      label: field.label,
      type: /** @type {const} */ ("checkbox"),
      options: (options[field.key] ?? field.values ?? []).map((id) => ({
        id,
        label: field.valueLabels?.[id] ?? id,
      })),
    }));
  return { keys, facets };
}

/**
 * Grow a facet's option list from counts without ever reordering it: the
 * options already listed keep their places, new values follow in count order,
 * and a selected value stays even when a count drops it.
 *
 * @param {ReadonlyArray<string>} listed
 * @param {Record<string, number> | undefined} counts
 * @param {ReadonlyArray<string>} selected
 * @returns {string[]}
 */
export function mergeOptions(listed, counts, selected) {
  const seen = new Set(listed);
  const added = Object.entries(counts ?? {})
    .filter(([id]) => !seen.has(id))
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
    .map(([id]) => id);
  const kept = [...listed, ...added];
  for (const id of selected) if (!kept.includes(id)) kept.push(id);
  return kept.length === listed.length
    ? /** @type {string[]} */ (listed)
    : kept;
}

/**
 * Whether a parsed filter is one the facets show. A repeated key is "and" in
 * a query and "any of" in a facet, so a key with two filters is left in the
 * text (`FilterPanel`'s `fromFilters` would merge them into one "any of").
 *
 * @param {import("./audit-state.js").FacetLike[]} facets
 * @param {import("../TokenSearch/token-query.js").TokenFilter[]} filters
 * @returns {Set<import("../TokenSearch/token-query.js").TokenFilter>}
 */
function coveredFilters(facets, filters) {
  const ids = new Set(facets.map((facet) => facet.id));
  /** @type {Map<string, number>} */
  const perKey = new Map();
  for (const filter of filters) {
    perKey.set(filter.key, (perKey.get(filter.key) ?? 0) + 1);
  }
  return new Set(
    filters.filter((filter) => {
      const facet = facets.find((f) => f.id === filter.key);
      if (!facet || !ids.has(filter.key)) return false;
      if (filter.op !== "eq" || filter.negated) return false;
      if (perKey.get(filter.key) !== 1 && facet.match !== "all") return false;
      // A value the facet has no option for stays in the text, flagged, as the user typed it.
      const known = facet.options?.map((option) => String(option.id));
      return !known?.length || filter.values.every((v) => known.includes(v));
    }),
  );
}

/**
 * The facet state a query text shows, and the filters it can not show.
 *
 * @param {string} text
 * @param {import("./audit-state.js").FacetLike[]} facets
 * @param {ReadonlyArray<import("../TokenSearch/token-query.js").TokenKey>} keys
 */
export function facetsFromText(text, facets, keys) {
  const query = parseQuery(text, { keys });
  const covered = coveredFilters(facets, query.filters);
  const mine = query.filters.filter((filter) => covered.has(filter));
  const { state, skipped } = fromFilters(
    /** @type {any} */ (facets),
    mine.map(({ key, op, values, negated }) => ({ key, op, values, negated })),
  );
  return {
    query,
    state,
    /** Filters the facets cannot show, in the text order. */
    rest: query.filters.filter((filter) => !covered.has(filter)),
    /** Filters a facet had to refuse (a value it has no option for). */
    refused: skipped,
  };
}

/**
 * Write a facet change into the text by splicing: the qualifier a facet holds
 * is replaced in place, a qualifier it no longer holds is cut out, a new one
 * is appended, and everything else the user typed stays byte for byte (free
 * text, other qualifiers, a half-typed qualifier the parser flagged).
 * Re-formatting the parsed query would drop what the parser rejected.
 *
 * @param {string} text
 * @param {import("./audit-state.js").FacetLike[]} facets
 * @param {import("../FilterPanel/filter-model.js").FilterState} next
 * @param {ReadonlyArray<import("../TokenSearch/token-query.js").TokenKey>} keys
 * @returns {string}
 */
export function textWithFacets(text, facets, next, keys) {
  const query = parseQuery(text, { keys });
  const covered = coveredFilters(facets, query.filters);
  const fresh = new Map(
    toFilters(/** @type {any} */ (facets), next).map((filter) => [
      filter.key,
      formatFilter(/** @type {any} */ (filter)),
    ]),
  );
  /** @type {Array<{ start: number, end: number, text: string }>} */
  const edits = [];
  for (const filter of query.filters) {
    if (!covered.has(filter)) continue;
    const start = filter.start ?? 0;
    const end = filter.end ?? start;
    const replacement = fresh.get(filter.key);
    fresh.delete(filter.key);
    if (replacement === undefined) {
      // Cut the qualifier and the space that followed it, or the one before it at the end.
      let cutEnd = end;
      while (text[cutEnd] === " ") cutEnd++;
      let cutStart = start;
      if (cutEnd === text.length)
        while (cutStart > 0 && text[cutStart - 1] === " ") cutStart--;
      edits.push({ start: cutStart, end: cutEnd, text: "" });
    } else edits.push({ start, end, text: replacement });
  }
  let out = text;
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    out = out.slice(0, edit.start) + edit.text + out.slice(edit.end);
  }
  for (const added of fresh.values()) {
    out = out.trimEnd();
    out = out ? `${out} ${added}` : added;
  }
  return out;
}

/**
 * The structured part of a query for a source: the free text, and every
 * filter, whichever control wrote it.
 *
 * @param {import("../TokenSearch/token-query.js").TokenQuery} query
 * @returns {Pick<import("./audit-source.js").AuditQuery, "q" | "filters">}
 */
export function toAuditQuery(query) {
  // The parser keeps a filter it also flagged (`action:>x` is an `eq` of
  // ">x"). Sending it would answer a question nobody asked, so it waits
  // until the user fixes it.
  const flagged = (/** @type {{ start?: number, end?: number }} */ filter) =>
    query.errors.some(
      (error) =>
        error.start < (filter.end ?? Number.POSITIVE_INFINITY) &&
        error.end > (filter.start ?? 0),
    );
  return {
    q: formatQuery({ terms: query.terms, filters: [] }),
    filters: query.filters
      .filter((filter) => !flagged(filter))
      .map(({ key, op, values, negated }) => ({
        key,
        op,
        values,
        negated,
      })),
  };
}
