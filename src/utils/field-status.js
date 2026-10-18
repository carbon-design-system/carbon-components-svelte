// @ts-check

/**
 * Whether to show the invalid/warn visual + ARIA state for a form
 * field. Warn is suppressed by invalid; both are suppressed by
 * `disabled`/`readonly`.
 *
 * @param {Object} options
 * @param {boolean} options.invalid
 * @param {boolean} options.warn
 * @param {boolean} [options.disabled=false]
 * @param {boolean} [options.readonly=false]
 * @returns {{ showInvalid: boolean, showWarn: boolean }}
 */
export function resolveValidationVisibility({
  invalid,
  warn,
  disabled = false,
  readonly = false,
}) {
  const showInvalid = invalid && !disabled && !readonly;
  const showWarn = warn && !invalid && !disabled && !readonly;
  return { showInvalid, showWarn };
}

/**
 * Build the `helper-`/`error-`/`warn-`/`readonly-` id quartet derived
 * from a field's `id`. When `id` is falsy, `fallback` ids are used
 * instead (for components, like CheckboxGroup/RadioButtonGroup, that
 * still need stable ids when no `id` prop was passed).
 *
 * @param {string} [id]
 * @param {{ helperId: string, errorId: string, warnId: string, readonlyId: string }} [fallback]
 * @returns {{
 *   helperId: string | undefined,
 *   errorId: string | undefined,
 *   warnId: string | undefined,
 *   readonlyId: string | undefined,
 * }}
 */
export function buildFieldIds(id, fallback) {
  if (!id) {
    return {
      helperId: fallback?.helperId,
      errorId: fallback?.errorId,
      warnId: fallback?.warnId,
      readonlyId: fallback?.readonlyId,
    };
  }
  return {
    helperId: `helper-${id}`,
    errorId: `error-${id}`,
    warnId: `warn-${id}`,
    readonlyId: `readonly-${id}`,
  };
}

/**
 * Space-join the truthy `aria-describedby` ids from a field's readonly
 * description, selection description, and validation/helper status id,
 * so callers can spread the result straight into `aria-describedby`
 * without hand-rolling `.filter(Boolean).join(" ") || undefined`.
 *
 * @param {...(string | null | undefined | false)} ids
 * @returns {string | undefined}
 */
export function joinDescribedBy(...ids) {
  const joined = ids.filter(Boolean).join(" ");
  return joined || undefined;
}

/**
 * Resolve the single id that a field's `aria-describedby` (or
 * equivalent) should point to, prioritizing invalid text, then warn
 * text, then helper text.
 *
 * @param {Object} options
 * @param {boolean} options.showInvalid
 * @param {boolean} options.showWarn
 * @param {unknown} [options.helperText]
 * @param {unknown} [options.invalidText]
 * @param {unknown} [options.warnText]
 * @param {boolean} [options.isFluid=false] - fluid fields don't render
 *   helper text, so `aria-describedby` doesn't point at it.
 * @param {string} options.errorId
 * @param {string} options.warnId
 * @param {string} [options.helperId]
 * @param {boolean} [options.includeErrorId=true] - `false` when the
 *   invalid message is instead surfaced via `aria-errormessage`; the
 *   resolver then skips straight past the invalid tier.
 * @returns {string | undefined}
 */
export function resolveStatusDescribedBy({
  showInvalid,
  showWarn,
  helperText,
  invalidText,
  warnText,
  isFluid = false,
  errorId,
  warnId,
  helperId,
  includeErrorId = true,
}) {
  // A message renders only when it has text, so only then is it an id
  // worth pointing at.
  if (showInvalid && includeErrorId && invalidText) {
    return errorId;
  }
  if (showWarn && warnText) {
    return warnId;
  }
  if (!showInvalid && !showWarn && !isFluid && helperText) {
    return helperId;
  }
  return undefined;
}
