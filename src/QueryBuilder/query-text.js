// @ts-check

/** Default English strings. Every id is also a `translateWithId` id. */
export const DEFAULT_TEXT = {
  conditions: "Conditions",
  where: "Where",
  and: "and",
  or: "or",
  connectorAnd: "And",
  connectorOr: "Or",
  matchAll: "All of the following",
  matchAny: "Any of the following",
  groupLogic: "Match",
  field: "Field",
  operator: "Operator",
  value: "Value",
  valueFrom: "From",
  valueTo: "To",
  chooseField: "Choose a field",
  chooseOption: "Choose an option",
  chooseOptions: "Choose options",
  datePlaceholder: "yyyy-mm-dd",
  true: "Yes",
  false: "No",
  addCondition: "Add condition",
  addGroup: "Add group",
  removeCondition: "Remove condition {n}",
  removeGroup: "Remove group {n}",
  moveUp: "Move condition {n} up",
  moveDown: "Move condition {n} down",
  moveGroupUp: "Move group {n} up",
  moveGroupDown: "Move group {n} down",
  groupActions: "Group {n} options",
  conditionActions: "Condition {n} actions",
  emptyGroup: "No conditions yet.",
  conditionLabel: "Condition {n} of {total}: {text}",
  groupLabel: "Group, level {level}: {logic}, {count} items",
  summaryLabel: "Read as text",
  summary: "Where {text}",
  summaryEmpty: "No conditions",
  quote: "“{value}”",
  range: "{from} and {to}",
  announceConditionAdded: "Condition added",
  announceGroupAdded: "Group added",
  announceConditionRemoved: "Condition removed",
  announceGroupRemoved: "Group removed",
  announceMoved: "Condition moved to position {n} of {total}",
  "error.field": "Choose a field",
  "error.operator": "Choose an operator",
  "error.required": "Enter a value",
  "error.range": "The start must not be after the end",
  "error.bounds": "Enter a value from {min} to {max}",
  "op.is": "is",
  "op.isNot": "is not",
  "op.contains": "contains",
  "op.notContains": "does not contain",
  "op.startsWith": "starts with",
  "op.endsWith": "ends with",
  "op.isEmpty": "is empty",
  "op.isNotEmpty": "is not empty",
  "op.eq": "equals",
  "op.neq": "does not equal",
  "op.gt": "is greater than",
  "op.gte": "is at least",
  "op.lt": "is less than",
  "op.lte": "is at most",
  "op.between": "is between",
  "op.before": "is before",
  "op.after": "is after",
  "op.onOrBefore": "is on or before",
  "op.onOrAfter": "is on or after",
  "op.isAnyOf": "is any of",
  "op.isNoneOf": "is none of",
};

/**
 * Look up a string and fill its `{name}` placeholders.
 * @param {keyof typeof DEFAULT_TEXT} id
 * @param {Record<string, string | number>} [values]
 * @returns {string}
 */
export function defaultTranslate(id, values) {
  const template = DEFAULT_TEXT[id] ?? id;
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    key in values ? String(values[key]) : match,
  );
}

/**
 * Wrap a consumer's translate function so an id it leaves out (it returns
 * nothing or an empty string) falls back to the English default.
 * @param {(id: keyof typeof DEFAULT_TEXT, values?: Record<string, string | number>) => string | undefined} translate
 * @returns {(id: keyof typeof DEFAULT_TEXT, values?: Record<string, string | number>) => string}
 */
export function withFallback(translate) {
  if (translate === defaultTranslate) return defaultTranslate;
  return (id, values) => translate(id, values) || defaultTranslate(id, values);
}
