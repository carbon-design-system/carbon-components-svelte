// @ts-check
import { defaultTranslate } from "./query-text.js";

/**
 * @typedef {import("./QueryBuilder.svelte").QueryField} QueryField
 * @typedef {import("./QueryBuilder.svelte").QueryCondition} QueryCondition
 * @typedef {import("./QueryBuilder.svelte").QueryGroup} QueryGroup
 * @typedef {import("./QueryBuilder.svelte").QueryFieldKind} QueryFieldKind
 * @typedef {import("./query-text.js").QueryOperator} QueryOperator
 * @typedef {import("./query-text.js").QueryTextId} QueryTextId
 * @typedef {(id: QueryTextId, values?: Record<string, string | number>) => string} Translate
 * @typedef {"none" | "one" | "two" | "many"} QueryArity
 * @typedef {"field" | "operator" | "required" | "range" | "bounds"} QueryErrorCode
 */

/** @type {Record<QueryFieldKind, readonly QueryOperator[]>} */
export const QUERY_OPERATORS = {
  text: [
    "is",
    "isNot",
    "contains",
    "notContains",
    "startsWith",
    "endsWith",
    "isEmpty",
    "isNotEmpty",
  ],
  number: [
    "eq",
    "neq",
    "gt",
    "gte",
    "lt",
    "lte",
    "between",
    "isEmpty",
    "isNotEmpty",
  ],
  date: [
    "is",
    "isNot",
    "before",
    "after",
    "onOrBefore",
    "onOrAfter",
    "between",
    "isEmpty",
    "isNotEmpty",
  ],
  option: ["is", "isNot", "isAnyOf", "isNoneOf", "isEmpty", "isNotEmpty"],
  boolean: ["is"],
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Operators a field offers, in order: its own `operators` list when set,
 * else every operator of its kind.
 * @param {QueryField} field
 * @returns {readonly QueryOperator[]}
 */
export function operatorsFor(field) {
  const all = QUERY_OPERATORS[field.kind] ?? [];
  if (!field.operators) return all;
  return field.operators.filter((operator) => all.includes(operator));
}

/**
 * How many values an operator takes: none (`isEmpty`), one, two (`between`)
 * or a list (`isAnyOf`).
 * @param {string} operator
 * @returns {QueryArity}
 */
export function valueArity(operator) {
  if (operator === "isEmpty" || operator === "isNotEmpty") return "none";
  if (operator === "between") return "two";
  if (operator === "isAnyOf" || operator === "isNoneOf") return "many";
  return "one";
}

/**
 * The empty value for a field and operator.
 * @param {QueryField} field
 * @param {string} operator
 * @returns {unknown}
 */
export function emptyValue(field, operator) {
  const arity = valueArity(operator);
  if (arity === "none") return null;
  if (field.kind === "boolean") return true;
  if (arity === "many") return [];
  if (arity === "two") return field.kind === "date" ? ["", ""] : [null, null];
  return field.kind === "text" || field.kind === "date" ? "" : null;
}

/**
 * Carry a value across an operator change when its shape still fits.
 * @param {QueryField} field
 * @param {string} from
 * @param {string} to
 * @param {unknown} value
 * @returns {unknown}
 */
export function carryValue(field, from, to, value) {
  const before = valueArity(from);
  const after = valueArity(to);
  if (before === after) return value;
  if (after === "none" || before === "none" || field.kind === "boolean") {
    return emptyValue(field, to);
  }
  const empty = emptyValue(field, "eq");
  const first = Array.isArray(value) ? (value[0] ?? empty) : value;
  if (after === "one") return first;
  if (after === "two") return emptyValue(field, to);
  return first === empty || first == null ? [] : [first];
}

/**
 * @param {unknown} value
 * @returns {value is number}
 */
function isNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * @param {unknown} value
 * @returns {value is string}
 */
function isIsoDate(value) {
  return typeof value === "string" && ISO_DATE.test(value);
}

/**
 * @param {QueryField} field
 * @param {unknown} id
 */
function knowsOption(field, id) {
  if (!field.options) return id != null && id !== "";
  return field.options.some((option) => String(option.id) === String(id));
}

/**
 * Why a condition is incomplete or wrong, or `null` when it can run.
 * @param {QueryCondition} condition
 * @param {QueryField | undefined} field
 * @returns {QueryErrorCode | null}
 */
export function validateCondition(condition, field) {
  if (!field) return "field";
  if (!operatorsFor(field).includes(/** @type {any} */ (condition.operator))) {
    return "operator";
  }
  const arity = valueArity(condition.operator);
  const value = condition.value;
  if (arity === "none") return null;

  if (field.kind === "boolean") {
    return typeof value === "boolean" ? null : "required";
  }

  if (arity === "many") {
    return Array.isArray(value) &&
      value.length > 0 &&
      value.every((id) => knowsOption(field, id))
      ? null
      : "required";
  }

  if (arity === "two") {
    if (!Array.isArray(value) || value.length !== 2) return "required";
    const [start, end] = value;
    if (field.kind === "number") {
      if (!isNumber(start) || !isNumber(end)) return "required";
      if (outOfBounds(field, start, end)) return "bounds";
      return start > end ? "range" : null;
    }
    if (!isIsoDate(start) || !isIsoDate(end)) return "required";
    return start > end ? "range" : null;
  }

  switch (field.kind) {
    case "text":
      return typeof value === "string" && value.trim() !== ""
        ? null
        : "required";
    case "number":
      if (!isNumber(value)) return "required";
      return outOfBounds(field, value) ? "bounds" : null;
    case "date":
      return isIsoDate(value) ? null : "required";
    case "option":
      return knowsOption(field, value) ? null : "required";
    default:
      return "field";
  }
}

/**
 * @param {QueryField} field
 * @param {...number} values
 */
function outOfBounds(field, ...values) {
  return values.some(
    (value) =>
      (field.min != null && value < field.min) ||
      (field.max != null && value > field.max),
  );
}

/**
 * @param {unknown} node
 * @returns {node is QueryGroup}
 */
export function isQueryGroup(node) {
  return (
    typeof node === "object" &&
    node !== null &&
    Array.isArray(/** @type {any} */ (node).conditions)
  );
}

/**
 * @param {ReadonlyArray<QueryField>} fields
 * @returns {Map<string, QueryField>}
 */
export function indexFields(fields) {
  return new Map(fields.map((field) => [field.id, field]));
}

/**
 * Check every condition of a tree. Errors are keyed by the node `id`, or by
 * its index path ("0.2") when it has none.
 * @param {QueryGroup} query
 * @param {ReadonlyArray<QueryField> | Map<string, QueryField>} fields
 * @returns {{ valid: boolean; errors: Record<string, QueryErrorCode> }}
 */
export function validateQuery(query, fields) {
  const byId = fields instanceof Map ? fields : indexFields(fields);
  /** @type {Record<string, QueryErrorCode>} */
  const errors = {};

  /**
   * @param {QueryGroup} group
   * @param {string} path
   */
  function walk(group, path) {
    group.conditions.forEach((node, index) => {
      const key = node.id ?? (path ? `${path}.${index}` : String(index));
      if (isQueryGroup(node)) {
        walk(node, key);
        return;
      }
      const code = validateCondition(node, byId.get(node.field));
      if (code) errors[key] = code;
    });
  }

  walk(query, "");
  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * Number of conditions in a tree, groups not counted.
 * @param {QueryGroup} query
 * @returns {number}
 */
export function countConditions(query) {
  let count = 0;
  for (const node of query.conditions) {
    count += isQueryGroup(node) ? countConditions(node) : 1;
  }
  return count;
}

/** @param {unknown} value */
function isBlank(value) {
  return (
    value == null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  );
}

/**
 * Calendar day of a row value: an ISO string's first ten characters, or a
 * `Date`'s UTC day.
 * @param {unknown} value
 * @returns {string}
 */
function toDay(value) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "" : value.toISOString();
  }
  return typeof value === "string" ? value : "";
}

/**
 * Whether a row passes one condition. Text compares without case.
 * @param {QueryCondition} condition
 * @param {QueryField} field
 * @param {unknown} actual - The row's value for the field
 * @returns {boolean}
 */
function matches(condition, field, actual) {
  const { operator, value } = condition;
  if (operator === "isEmpty") return isBlank(actual);
  if (operator === "isNotEmpty") return !isBlank(actual);

  switch (field.kind) {
    case "boolean":
      return Boolean(actual) === value;
    case "text": {
      const text = String(actual ?? "").toLowerCase();
      const needle = String(value).toLowerCase();
      switch (operator) {
        case "is":
          return text === needle;
        case "isNot":
          return text !== needle;
        case "contains":
          return text.includes(needle);
        case "notContains":
          return !text.includes(needle);
        case "startsWith":
          return text.startsWith(needle);
        case "endsWith":
          return text.endsWith(needle);
        default:
          return false;
      }
    }
    case "number": {
      const number = typeof actual === "number" ? actual : Number(actual);
      if (actual == null || actual === "" || Number.isNaN(number)) {
        return operator === "neq";
      }
      return compare(operator, number, value);
    }
    case "date": {
      const day = toDay(actual).slice(0, 10);
      if (!day) return operator === "isNot";
      return compare(operator, day, value);
    }
    case "option": {
      const actuals = (Array.isArray(actual) ? actual : [actual]).map(String);
      const wanted = (Array.isArray(value) ? value : [value]).map(String);
      const hit = actuals.some((id) => wanted.includes(id));
      return operator === "isNot" || operator === "isNoneOf" ? !hit : hit;
    }
    default:
      return false;
  }
}

/**
 * @template {number | string} T
 * @param {string} operator
 * @param {T} actual
 * @param {any} value
 * @returns {boolean}
 */
function compare(operator, actual, value) {
  switch (operator) {
    case "is":
    case "eq":
      return actual === value;
    case "isNot":
    case "neq":
      return actual !== value;
    case "gt":
    case "after":
      return actual > value;
    case "gte":
    case "onOrAfter":
      return actual >= value;
    case "lt":
    case "before":
      return actual < value;
    case "lte":
    case "onOrBefore":
      return actual <= value;
    case "between":
      return actual >= value[0] && actual <= value[1];
    default:
      return false;
  }
}

/**
 * Test a row against a query. Incomplete conditions are skipped, so a half-
 * built query filters by what is done so far; a group with nothing complete
 * matches every row.
 * @template Row
 * @param {QueryGroup} query
 * @param {Row} row
 * @param {ReadonlyArray<QueryField> | Map<string, QueryField>} fields
 * @returns {boolean}
 */
export function evaluateQuery(query, row, fields) {
  const byId = fields instanceof Map ? fields : indexFields(fields);

  /** @param {QueryGroup} group */
  function evaluateGroup(group) {
    let decided = false;
    for (const node of group.conditions) {
      /** @type {boolean | undefined} */
      let outcome;
      if (isQueryGroup(node)) {
        if (hasComplete(node, byId)) outcome = evaluateGroup(node);
      } else {
        const field = byId.get(node.field);
        if (field && validateCondition(node, field) === null) {
          const actual = field.getValue
            ? field.getValue(row)
            : /** @type {any} */ (row)?.[field.id];
          outcome = matches(node, field, actual);
        }
      }
      if (outcome === undefined) continue;
      decided = true;
      if (group.operator === "and") {
        if (!outcome) return false;
      } else if (outcome) {
        return true;
      }
    }
    // An "and" that never failed holds; an "or" that never hit does not.
    return decided ? group.operator === "and" : true;
  }

  return evaluateGroup(query);
}

/**
 * @param {QueryGroup} group
 * @param {Map<string, QueryField>} byId
 * @returns {boolean}
 */
function hasComplete(group, byId) {
  return group.conditions.some((node) =>
    isQueryGroup(node)
      ? hasComplete(node, byId)
      : validateCondition(node, byId.get(node.field)) === null,
  );
}

/**
 * @param {QueryField} field
 * @param {unknown} value
 * @param {Translate} translate
 */
function valueToText(field, value, translate) {
  switch (field.kind) {
    case "text":
      return translate("quote", { value: String(value) });
    case "boolean":
      return translate(value ? "true" : "false");
    case "option": {
      const option = field.options?.find(
        (candidate) => String(candidate.id) === String(value),
      );
      return option?.text ?? String(value);
    }
    default:
      return String(value);
  }
}

/**
 * One condition as words: "Priority is at least 2". Returns "" for a
 * condition that is not complete.
 * @param {QueryCondition} condition
 * @param {QueryField | undefined} field
 * @param {Translate} [translate]
 * @returns {string}
 */
export function conditionToText(
  condition,
  field,
  translate = defaultTranslate,
) {
  if (!field || validateCondition(condition, field) !== null) return "";
  const operator = translate(
    /** @type {QueryTextId} */ (`op.${condition.operator}`),
  );
  const arity = valueArity(condition.operator);
  const value = condition.value;
  let tail = "";
  if (arity === "one") tail = valueToText(field, value, translate);
  else if (arity === "two") {
    const [from, to] = /** @type {unknown[]} */ (value);
    tail = translate("range", {
      from: valueToText(field, from, translate),
      to: valueToText(field, to, translate),
    });
  } else if (arity === "many") {
    tail = /** @type {unknown[]} */ (value)
      .map((item) => valueToText(field, item, translate))
      .join(", ");
  }
  return [field.text, operator, tail].filter(Boolean).join(" ");
}

/**
 * Read a query as one sentence: "Status is any of Open, Blocked and
 * (Priority is at least 2 or Owner is empty)". Skips incomplete conditions.
 * @param {QueryGroup} query
 * @param {ReadonlyArray<QueryField> | Map<string, QueryField>} fields
 * @param {Translate} [translate]
 * @returns {string}
 */
export function queryToText(query, fields, translate = defaultTranslate) {
  const byId = fields instanceof Map ? fields : indexFields(fields);

  /**
   * @param {QueryGroup} group
   * @returns {string}
   */
  function groupToText(group) {
    /** @type {string[]} */
    const parts = [];
    for (const node of group.conditions) {
      if (isQueryGroup(node)) {
        const inner = groupToText(node);
        if (!inner) continue;
        parts.push(countParts(node, byId) > 1 ? `(${inner})` : inner);
      } else {
        const text = conditionToText(node, byId.get(node.field), translate);
        if (text) parts.push(text);
      }
    }
    return parts.join(` ${translate(group.operator)} `);
  }

  return groupToText(query);
}

/**
 * @param {QueryGroup} group
 * @param {Map<string, QueryField>} byId
 * @returns {number}
 */
function countParts(group, byId) {
  let count = 0;
  for (const node of group.conditions) {
    if (isQueryGroup(node)) count += countParts(node, byId) > 0 ? 1 : 0;
    else if (validateCondition(node, byId.get(node.field)) === null) count++;
  }
  return count;
}

/**
 * Serialize a query to JSON. Node ids are dropped unless `ids` is true, so
 * the same query always yields the same string.
 * @param {QueryGroup} query
 * @param {{ ids?: boolean; space?: number }} [options]
 * @returns {string}
 */
export function queryToJSON(query, { ids = false, space } = {}) {
  return JSON.stringify(
    query,
    (key, value) => (key === "id" && !ids ? undefined : value),
    space,
  );
}

/**
 * Read a query from a JSON string or a plain object. Throws a `TypeError`
 * naming the path of the first node that is not a group or condition.
 * @param {string | object} input
 * @returns {QueryGroup}
 */
export function queryFromJSON(input) {
  const data = typeof input === "string" ? JSON.parse(input) : input;

  /**
   * @param {any} node
   * @param {string} path
   * @returns {QueryGroup}
   */
  function readGroup(node, path) {
    if (
      !isQueryGroup(node) ||
      (node.operator !== "and" && node.operator !== "or")
    ) {
      throw new TypeError(
        `Expected a group with an "and" or "or" operator at ${path}`,
      );
    }
    return {
      ...(typeof node.id === "string" ? { id: node.id } : {}),
      operator: node.operator,
      conditions: node.conditions.map(
        /** @param {any} child @param {number} index */ (child, index) => {
          const childPath = `${path}.conditions[${index}]`;
          if (isQueryGroup(child)) return readGroup(child, childPath);
          if (
            typeof child?.field !== "string" ||
            typeof child?.operator !== "string"
          ) {
            throw new TypeError(
              `Expected a condition with a field and operator at ${childPath}`,
            );
          }
          return {
            ...(typeof child.id === "string" ? { id: child.id } : {}),
            field: child.field,
            operator: child.operator,
            value: child.value ?? null,
          };
        },
      ),
    };
  }

  return readGroup(data, "query");
}
