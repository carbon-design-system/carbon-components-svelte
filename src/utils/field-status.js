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
 * Build the `helper-`/`error-`/`warn-` id triple derived from a
 * field's `id`. When `id` is falsy, `fallback` ids are used instead
 * (for components, like CheckboxGroup/RadioButtonGroup, that still
 * need stable ids when no `id` prop was passed).
 *
 * @param {string} [id]
 * @param {{
 *   helperId: string,
 *   errorId: string,
 *   warnId: string,
 * }} [fallback]
 * @returns {{
 *   helperId: string | undefined,
 *   errorId: string | undefined,
 *   warnId: string | undefined,
 * }}
 */
export function buildFieldIds(id, fallback) {
  if (!id) {
    return {
      helperId: fallback?.helperId,
      errorId: fallback?.errorId,
      warnId: fallback?.warnId,
    };
  }
  return {
    helperId: `helper-${id}`,
    errorId: `error-${id}`,
    warnId: `warn-${id}`,
  };
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
 * @param {boolean} [options.isFluid=false] - fluid mode renders the
 *   helper text inline, so it is not also pointed at from
 *   `aria-describedby`.
 * @param {string} options.errorId
 * @param {string} options.warnId
 * @param {string} [options.helperId]
 * @param {boolean} [options.includeErrorId=true] - `false` when the
 *   invalid message is instead surfaced via `aria-errormessage`; the
 *   resolver then skips straight past the invalid tier.
 * @param {boolean} [options.requireInvalidText=false]
 * @param {boolean} [options.requireWarnText=false]
 * @param {boolean} [options.hideWarnWhenFluid=false] - some fields
 *   (TextArea) also suppress the warn id while fluid, not just the
 *   helper id.
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
  requireInvalidText = false,
  requireWarnText = false,
  hideWarnWhenFluid = false,
}) {
  if (showInvalid && includeErrorId && (!requireInvalidText || invalidText)) {
    return errorId;
  }
  if (
    showWarn &&
    !(hideWarnWhenFluid && isFluid) &&
    (!requireWarnText || warnText)
  ) {
    return warnId;
  }
  if (!showInvalid && !showWarn && !isFluid && helperText) {
    return helperId;
  }
  return undefined;
}
