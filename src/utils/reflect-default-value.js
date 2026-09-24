// @ts-check

/**
 * Svelte action: keep an input's `value` attribute (its `defaultValue`) on
 * `value`. A form reset restores inputs to that attribute, so a control that
 * always holds a value (a slider, a number field that cannot be empty) keeps
 * its current value instead of blanking. Svelte writes `value` only as a DOM
 * property, which a reset ignores.
 *
 * Pass `undefined` to leave the attribute alone, for example when the field
 * may be empty and should follow the browser's reset instead.
 *
 * @param {HTMLInputElement} node
 * @param {null | number | string | undefined} value
 * @returns {{ update: (value: null | number | string | undefined) => void }}
 */
export function reflectDefaultValue(node, value) {
  /** @param {null | number | string | undefined} next */
  function apply(next) {
    if (next === undefined) return;
    node.defaultValue = next === null ? "" : String(next);
  }

  apply(value);

  return { update: apply };
}
