// @ts-check
// Converts a token query to and from the condition tree of `QueryBuilder`
// (draft #5214), so a text query can open in the form editor and back. The
// types below copy the tree's shape; nothing is imported. A token query is a
// flat "and" of filters, so the conversion covers that subset: filters whose
// values a field can hold, with `or` groups where a comma list has no
// single operator. What does not fit is returned in `skipped`, never lost
// silently.

import {
  findKey,
  formatQuery,
  parseQuery,
  toTokenValue,
} from "./token-query.js";

/**
 * @typedef {import("./token-query.js").TokenKey} TokenKey
 * @typedef {import("./token-query.js").TokenFilter} TokenFilter
 * @typedef {import("./token-query.js").TokenQuery} TokenQuery
 */

/**
 * A leaf of the tree.
 * @typedef {Object} QueryConditionLike
 * @property {string} [id]
 * @property {string} field
 * @property {string} operator
 * @property {unknown} value
 */

/**
 * A group of the tree: `and` or `or`.
 * @typedef {Object} QueryGroupLike
 * @property {string} [id]
 * @property {"and" | "or"} operator
 * @property {Array<QueryConditionLike | QueryGroupLike>} conditions
 */

/**
 * @typedef {Object} QueryFieldLike
 * @property {string} id
 * @property {string} label
 * @property {"text" | "number" | "date" | "option"} kind
 * @property {Array<{ id: string, text: string }>} [options]
 */

/**
 * Whether a key is an option in the tree: an enum, or a user key with a
 * fixed list. Other user keys are free text there.
 * @param {TokenKey | undefined} def
 */
function isOption(def) {
  return def?.type === "enum" || (def?.type === "user" && !!def.values?.length);
}

/** @param {TokenKey | undefined} def */
function kindOf(def) {
  if (isOption(def)) return "option";
  if (def?.type === "number" || def?.type === "date") return def.type;
  return "text";
}

/**
 * The fields a `QueryBuilder` needs to edit what `keys` describe.
 * @param {ReadonlyArray<TokenKey>} keys
 * @returns {QueryFieldLike[]}
 */
export function keysToQueryFields(keys) {
  return keys.map((def) => {
    /** @type {QueryFieldLike} */
    const field = {
      id: def.key,
      label: def.label ?? def.key,
      kind: kindOf(def),
    };
    if (field.kind === "option") {
      field.options = (def.values ?? []).map((entry) => {
        const item = toTokenValue(entry);
        return { id: item.value, text: item.label ?? item.value };
      });
    }
    return field;
  });
}

/** @type {Record<string, { pos: string, neg: string }>} */
const EQ = {
  option: { pos: "is", neg: "isNot" },
  text: { pos: "contains", neg: "notContains" },
  number: { pos: "eq", neg: "neq" },
  date: { pos: "is", neg: "isNot" },
};

/** @type {Record<string, Record<string, string>>} */
const COMPARE = {
  number: { gt: "gt", gte: "gte", lt: "lt", lte: "lte" },
  date: { gt: "after", gte: "onOrAfter", lt: "before", lte: "onOrBefore" },
};

/** @type {Record<string, string>} */
const INVERSE = { gt: "lte", gte: "lt", lt: "gte", lte: "gt" };

/**
 * @param {string} kind
 * @param {string} value
 */
function typed(kind, value) {
  return kind === "number" ? Number(value) : value;
}

/**
 * One filter as a node of the tree, or `null` when it does not fit.
 * @param {TokenFilter} filter
 * @param {TokenKey | undefined} def
 * @returns {QueryConditionLike | QueryGroupLike | null}
 */
function filterToNode(filter, def) {
  const kind = kindOf(def);
  const field = filter.key;
  const { negated, values } = filter;
  const leaf = (
    /** @type {string} */ operator,
    /** @type {unknown} */ value,
  ) => ({
    field,
    operator,
    value,
  });

  if (filter.op === "eq") {
    if (values.length === 0) return null;
    if (kind === "option" && values.length > 1) {
      return leaf(negated ? "isNoneOf" : "isAnyOf", values);
    }
    const operator = negated ? EQ[kind].neg : EQ[kind].pos;
    if (values.length === 1) return leaf(operator, typed(kind, values[0]));
    // A list with no "any of" operator is an "or" of single tests, or an
    // "and" of single negated tests.
    return {
      operator: negated ? "and" : "or",
      conditions: values.map((value) => leaf(operator, typed(kind, value))),
    };
  }

  if (kind !== "number" && kind !== "date") return null;

  if (filter.op === "between") {
    const [from, to] = values;
    if (from && to) {
      if (!negated)
        return leaf("between", [typed(kind, from), typed(kind, to)]);
      return {
        operator: "or",
        conditions: [
          leaf(COMPARE[kind].lt, typed(kind, from)),
          leaf(COMPARE[kind].gt, typed(kind, to)),
        ],
      };
    }
    // An open end is a comparison.
    const op = from ? "gte" : "lte";
    const value = from || to;
    if (!value) return null;
    return leaf(COMPARE[kind][negated ? INVERSE[op] : op], typed(kind, value));
  }

  if (!values[0]) return null;
  const op = negated ? INVERSE[filter.op] : filter.op;
  return leaf(COMPARE[kind][op], typed(kind, values[0]));
}

/**
 * Convert a query to a condition tree: an "and" group of its filters. Free
 * text has no place in the tree, so it comes back as `text`. A filter that
 * has an error, names a key the schema lacks, or holds a comparison its
 * field cannot take is returned in `skipped`.
 * @param {TokenQuery} query
 * @param {ReadonlyArray<TokenKey>} keys
 * @returns {{ group: QueryGroupLike, text: string, skipped: TokenFilter[] }}
 */
export function queryToConditions(query, keys) {
  /** @type {TokenFilter[]} */
  const skipped = [];
  /** @type {Array<QueryConditionLike | QueryGroupLike>} */
  const conditions = [];
  for (const filter of query.filters) {
    const def = findKey(keys, filter.key);
    const failed = query.errors.some(
      (error) =>
        filter.start !== undefined &&
        error.start >= filter.start &&
        error.end <= (filter.end ?? Number.POSITIVE_INFINITY),
    );
    const node = def && !failed ? filterToNode(filter, def) : null;
    if (node) conditions.push(node);
    else skipped.push(filter);
  }
  return { group: { operator: "and", conditions }, text: query.text, skipped };
}

/** @type {Record<string, { op: TokenFilter["op"], negated: boolean }>} */
const FROM_OPERATOR = {
  is: { op: "eq", negated: false },
  eq: { op: "eq", negated: false },
  contains: { op: "eq", negated: false },
  isAnyOf: { op: "eq", negated: false },
  isNot: { op: "eq", negated: true },
  neq: { op: "eq", negated: true },
  notContains: { op: "eq", negated: true },
  isNoneOf: { op: "eq", negated: true },
  gt: { op: "gt", negated: false },
  after: { op: "gt", negated: false },
  gte: { op: "gte", negated: false },
  onOrAfter: { op: "gte", negated: false },
  lt: { op: "lt", negated: false },
  before: { op: "lt", negated: false },
  lte: { op: "lte", negated: false },
  onOrBefore: { op: "lte", negated: false },
  between: { op: "between", negated: false },
};

/** @param {unknown} node @returns {node is QueryGroupLike} */
function isGroup(node) {
  return (
    typeof node === "object" &&
    node !== null &&
    Array.isArray(/** @type {any} */ (node).conditions)
  );
}

/**
 * A leaf as a filter, or `null` when no filter says the same.
 * @param {QueryConditionLike} leaf
 * @param {ReadonlyArray<TokenKey>} keys
 * @returns {TokenFilter | null}
 */
function leafToFilter(leaf, keys) {
  const def = findKey(keys, leaf.field);
  const map = FROM_OPERATOR[leaf.operator];
  if (!def || !map) return null;
  const { value } = leaf;
  if (leaf.operator === "between") {
    if (!Array.isArray(value) || value.length !== 2) return null;
    return {
      key: def.key,
      op: "between",
      values: value.map((entry) => String(entry ?? "")),
      negated: false,
    };
  }
  const list = Array.isArray(value) ? value : [value];
  const values = list
    .filter((entry) => entry !== null && entry !== undefined && entry !== "")
    .map(String);
  if (values.length === 0) return null;
  return { key: def.key, op: map.op, values, negated: map.negated };
}

/**
 * A group as one filter: an "or" of positive tests on one field, or an
 * "and" of negated tests on one field, is a comma list; an "or" of
 * `< a` and `> b` is a negated range.
 * @param {QueryGroupLike} group
 * @param {ReadonlyArray<TokenKey>} keys
 * @returns {TokenFilter | null}
 */
function groupToFilter(group, keys) {
  const leaves = group.conditions;
  if (leaves.length === 0 || !leaves.every((node) => !isGroup(node))) {
    return null;
  }
  const filters = leaves.map((node) =>
    leafToFilter(/** @type {QueryConditionLike} */ (node), keys),
  );
  if (filters.some((filter) => !filter)) return null;
  const parts = /** @type {TokenFilter[]} */ (filters);
  const first = parts[0];
  if (parts.length === 1) return first;
  if (parts.some((part) => part.key !== first.key)) return null;

  const wantNegated = group.operator === "and";
  if (parts.every((part) => part.op === "eq" && part.negated === wantNegated)) {
    return {
      key: first.key,
      op: "eq",
      values: parts.flatMap((part) => part.values),
      negated: wantNegated,
    };
  }
  if (
    group.operator === "or" &&
    parts.length === 2 &&
    parts[0].op === "lt" &&
    parts[1].op === "gt" &&
    !parts[0].negated &&
    !parts[1].negated
  ) {
    return {
      key: first.key,
      op: "between",
      values: [parts[0].values[0], parts[1].values[0]],
      negated: true,
    };
  }
  return null;
}

/**
 * Convert a condition tree to a query. The root, and any "and" group in it,
 * is read as a list of filters. What a filter cannot say (`startsWith`,
 * `isEmpty`, an "or" across fields, a field the schema lacks) is returned in
 * `skipped` and left out of `value`.
 * @param {QueryGroupLike | QueryConditionLike} root
 * @param {ReadonlyArray<TokenKey>} keys
 * @param {{ text?: string }} [options] Free text to write after the filters.
 * @returns {{ value: string, query: TokenQuery, skipped: Array<QueryConditionLike | QueryGroupLike> }}
 */
export function conditionsToQuery(root, keys, options = {}) {
  /** @type {TokenFilter[]} */
  const filters = [];
  /** @type {Array<QueryConditionLike | QueryGroupLike>} */
  const skipped = [];

  /** @param {QueryConditionLike | QueryGroupLike} node */
  function visit(node) {
    if (isGroup(node)) {
      if (node.operator === "and" || node.conditions.length === 1) {
        // A nested "and" is a flat list, unless it is negated tests of one
        // field, which read as one comma list.
        const merged =
          node.operator === "and" ? groupToFilter(node, keys) : null;
        const allNegatedEq =
          merged?.negated && merged.op === "eq" && merged.values.length > 1;
        if (allNegatedEq && merged) filters.push(merged);
        else for (const child of node.conditions) visit(child);
        return;
      }
      const filter = groupToFilter(node, keys);
      if (filter) filters.push(filter);
      else skipped.push(node);
      return;
    }
    const filter = leafToFilter(node, keys);
    if (filter) filters.push(filter);
    else skipped.push(node);
  }
  visit(root);

  // Free text goes last: a term without a position sorts after the filters.
  const terms = parseQuery(options.text ?? "").terms.map(
    ({ text, phrase, negated }) => ({ text, phrase, negated }),
  );
  const query = parseQuery(formatQuery({ filters, terms }), { keys });
  return { value: formatQuery(query), query, skipped };
}
