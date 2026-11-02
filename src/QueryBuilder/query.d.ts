import type {
  QueryCondition,
  QueryField,
  QueryFieldKind,
  QueryGroup,
} from "./QueryBuilder.svelte";
import type { QueryOperator, QueryTextId } from "./query-text.js";

export type QueryArity = "none" | "one" | "two" | "many";

export type QueryErrorCode =
  "field" | "operator" | "required" | "range" | "bounds";

export type QueryTranslate = (
  id: QueryTextId,
  values?: Record<string, string | number>,
) => string;

/** Operators each field kind offers. */
export const QUERY_OPERATORS: Record<QueryFieldKind, readonly QueryOperator[]>;

/**
 * Operators a field offers, in order: its own `operators` list when set,
 * else every operator of its kind.
 */
export function operatorsFor(field: QueryField): readonly QueryOperator[];

/**
 * How many values an operator takes: none (`isEmpty`), one, two (`between`)
 * or a list (`isAnyOf`).
 */
export function valueArity(operator: string): QueryArity;

/** The empty value for a field and operator. */
export function emptyValue(field: QueryField, operator: string): unknown;

/** Carry a value across an operator change when its shape still fits. */
export function carryValue(
  field: QueryField,
  from: string,
  to: string,
  value: unknown,
): unknown;

/** Why a condition is incomplete or wrong, or `null` when it can run. */
export function validateCondition(
  condition: QueryCondition,
  field: QueryField | undefined,
): QueryErrorCode | null;

export function isQueryGroup(node: unknown): node is QueryGroup;

export function indexFields(
  fields: ReadonlyArray<QueryField>,
): Map<string, QueryField>;

/**
 * Check every condition of a tree. Errors are keyed by the node `id`, or by
 * its index path ("0.2") when it has none.
 */
export function validateQuery(
  query: QueryGroup,
  fields: ReadonlyArray<QueryField> | Map<string, QueryField>,
): { valid: boolean; errors: Record<string, QueryErrorCode> };

/** Number of conditions in a tree, groups not counted. */
export function countConditions(query: QueryGroup): number;

/**
 * Test a row against a query. Incomplete conditions are skipped, so a half-
 * built query filters by what is done so far; a group with nothing complete
 * matches every row. Text compares without case.
 */
export function evaluateQuery<Row>(
  query: QueryGroup,
  row: Row,
  fields: ReadonlyArray<QueryField> | Map<string, QueryField>,
): boolean;

/**
 * One condition as words: "Priority is at least 2". Returns "" for a
 * condition that is not complete.
 */
export function conditionToText(
  condition: QueryCondition,
  field: QueryField | undefined,
  translate?: QueryTranslate,
): string;

/**
 * Read a query as one sentence: "Status is any of Open, Blocked and
 * (Priority is at least 2 or Owner is empty)". Skips incomplete conditions.
 */
export function queryToText(
  query: QueryGroup,
  fields: ReadonlyArray<QueryField> | Map<string, QueryField>,
  translate?: QueryTranslate,
): string;

/**
 * Serialize a query to JSON. Node ids are dropped unless `ids` is true, so
 * the same query always yields the same string.
 */
export function queryToJSON(
  query: QueryGroup,
  options?: { ids?: boolean; space?: number },
): string;

/**
 * Read a query from a JSON string or a plain object. Throws a `TypeError`
 * naming the path of the first node that is not a group or condition.
 */
export function queryFromJSON(input: string | object): QueryGroup;
