// @ts-check

/**
 * A `tabindex` prop's value, for an element's `tabindex` attribute. The
 * prop takes a string, as markup passes it (`tabindex="0"`), and the
 * attribute renders the same either way; Svelte's element types take only
 * a number.
 *
 * @param {number | string | null | undefined} value
 * @returns {number | null | undefined}
 */
export function tabindexAttribute(value) {
  return /** @type {number | null | undefined} */ (value);
}
