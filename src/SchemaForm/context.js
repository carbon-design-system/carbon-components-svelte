// @ts-check

/** Set by `SchemaForm`; read by `SchemaNode`. */
export const SCHEMA_FORM_CONTEXT_KEY = "carbon:SchemaForm";

/**
 * @typedef {Object} SchemaFormLabels
 * @property {string} submit
 * @property {string} reset
 * @property {string} optional
 * @property {string} add
 * @property {string} remove
 * @property {string} moveUp
 * @property {string} moveDown
 * @property {(position: number) => string} row
 * @property {(count: number) => string} summaryTitle
 * @property {(row: string, count: number) => string} added
 * @property {(row: string, count: number) => string} removed
 * @property {(row: string, position: number, count: number) => string} moved
 */

/**
 * @typedef {Object} SchemaFormContext
 * @property {import("./create-form.js").SchemaFormStore} form
 * @property {Record<string, import("svelte").ComponentType>} widgets
 * @property {SchemaFormLabels} labels
 * @property {boolean} optionalMark
 * @property {(message: string) => void} announce
 */

/** @type {SchemaFormLabels} */
export const DEFAULT_LABELS = {
  submit: "Submit",
  reset: "Reset",
  optional: "(optional)",
  add: "Add item",
  remove: "Remove",
  moveUp: "Move up",
  moveDown: "Move down",
  row: (position) => `Item ${position}`,
  summaryTitle: (count) =>
    count === 1 ? "There is 1 problem" : `There are ${count} problems`,
  added: (row, count) => `${row} added. ${count} items.`,
  removed: (row, count) => `${row} removed. ${count} items.`,
  moved: (row, position, count) =>
    `${row} moved to position ${position} of ${count}.`,
};
