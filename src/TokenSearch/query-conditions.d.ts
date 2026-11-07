import type { TokenFilter, TokenKey, TokenQuery } from "./token-query.js";

/** A leaf of the condition tree: the shape of a `QueryBuilder` condition. */
export type QueryConditionLike = {
  id?: string;
  field: string;
  operator: string;
  value: unknown;
};

/** A group of the condition tree: `and` or `or`. */
export type QueryGroupLike = {
  id?: string;
  operator: "and" | "or";
  conditions: Array<QueryConditionLike | QueryGroupLike>;
};

/** The shape of a `QueryBuilder` field. */
export type QueryFieldLike = {
  id: string;
  label: string;
  kind: "text" | "number" | "date" | "option";
  options?: Array<{ id: string; text: string }>;
};

/** The fields a `QueryBuilder` needs to edit what `keys` describe. */
export function keysToQueryFields(
  keys: ReadonlyArray<TokenKey>,
): QueryFieldLike[];

/**
 * Convert a query to a condition tree: an "and" group of its filters. Free
 * text comes back as `text`. A filter that has an error, names a key the
 * schema lacks, or holds a comparison its field cannot take is returned in
 * `skipped`.
 */
export function queryToConditions(
  query: TokenQuery,
  keys: ReadonlyArray<TokenKey>,
): { group: QueryGroupLike; text: string; skipped: TokenFilter[] };

/**
 * Convert a condition tree to a query. What a filter cannot say is returned
 * in `skipped` and left out of `value`.
 */
export function conditionsToQuery(
  root: QueryGroupLike | QueryConditionLike,
  keys: ReadonlyArray<TokenKey>,
  options?: { text?: string },
): {
  value: string;
  query: TokenQuery;
  skipped: Array<QueryConditionLike | QueryGroupLike>;
};
