export type QueryOperator =
  | "is"
  | "isNot"
  | "contains"
  | "notContains"
  | "startsWith"
  | "endsWith"
  | "isEmpty"
  | "isNotEmpty"
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "between"
  | "before"
  | "after"
  | "onOrBefore"
  | "onOrAfter"
  | "isAnyOf"
  | "isNoneOf";

export type QueryTextId =
  | "conditions"
  | "where"
  | "and"
  | "or"
  | "connectorAnd"
  | "connectorOr"
  | "matchAll"
  | "matchAny"
  | "groupLogic"
  | "field"
  | "operator"
  | "value"
  | "valueFrom"
  | "valueTo"
  | "chooseField"
  | "chooseOption"
  | "chooseOptions"
  | "datePlaceholder"
  | "true"
  | "false"
  | "addCondition"
  | "addGroup"
  | "removeCondition"
  | "removeGroup"
  | "moveUp"
  | "moveDown"
  | "moveGroupUp"
  | "moveGroupDown"
  | "groupActions"
  | "conditionActions"
  | "emptyGroup"
  | "conditionLabel"
  | "groupLabel"
  | "summaryLabel"
  | "summary"
  | "summaryEmpty"
  | "quote"
  | "range"
  | "announceConditionAdded"
  | "announceGroupAdded"
  | "announceConditionRemoved"
  | "announceGroupRemoved"
  | "announceMoved"
  | "error.field"
  | "error.operator"
  | "error.required"
  | "error.range"
  | "error.bounds"
  | `op.${QueryOperator}`;

/** Default English strings. Every id is also a `translateWithId` id. */
export const DEFAULT_TEXT: { readonly [Id in QueryTextId]: string };

/**
 * Look up a string and fill its `{name}` placeholders.
 */
export function defaultTranslate(
  id: QueryTextId,
  values?: Record<string, string | number>,
): string;

/**
 * Wrap a consumer's translate function so an id it leaves out (it returns
 * nothing or an empty string) falls back to the English default.
 */
export function withFallback(
  translate: (
    id: QueryTextId,
    values?: Record<string, string | number>,
  ) => string | undefined,
): (id: QueryTextId, values?: Record<string, string | number>) => string;
