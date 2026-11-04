// @ts-check

/**
 * Select-like Carbon fields identify an option by a string, while a field's
 * option values can be numbers. These map between the two.
 */

/**
 * @typedef {import("../create-form.js").FieldOption} FieldOption
 */

/**
 * The id of the option holding `value`, or `undefined` for no selection.
 * @param {unknown} value
 * @returns {string | undefined}
 */
export function toId(value) {
  return value === "" || value == null ? undefined : String(value);
}

/**
 * The value of the option with `id`, or `""` for no selection.
 * @param {FieldOption[] | undefined} options
 * @param {string | undefined} id
 * @returns {string | number}
 */
export function fromId(options, id) {
  if (id == null) return "";
  const option = options?.find((o) => String(o.value) === id);
  return option ? option.value : "";
}

/**
 * @param {unknown} values
 * @returns {string[]}
 */
export function toIds(values) {
  return Array.isArray(values) ? values.map(String) : [];
}

/**
 * @param {FieldOption[] | undefined} options
 * @param {readonly string[]} ids
 * @returns {Array<string | number>}
 */
export function fromIds(options, ids) {
  return ids
    .map((id) => options?.find((o) => String(o.value) === id))
    .filter((o) => o !== undefined)
    .map((o) => /** @type {FieldOption} */ (o).value);
}
