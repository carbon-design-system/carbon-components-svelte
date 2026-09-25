/**
 * Whether to show the invalid/warn visual + ARIA state for a form
 * field. Warn is suppressed by invalid; both are suppressed by
 * `disabled`/`readonly`.
 */
export function resolveValidationVisibility(options: {
  invalid: boolean;
  warn: boolean;
  disabled?: boolean;
  readonly?: boolean;
}): { showInvalid: boolean; showWarn: boolean };

/**
 * Build the `helper-`/`error-`/`warn-`/`readonly-` id quartet derived
 * from a field's `id`. When `id` is falsy, `fallback` ids are used
 * instead (for components, like CheckboxGroup/RadioButtonGroup, that
 * still need stable ids when no `id` prop was passed).
 */
export function buildFieldIds(
  id?: string,
  fallback?: {
    helperId: string;
    errorId: string;
    warnId: string;
    readonlyId: string;
  },
): {
  helperId: string | undefined;
  errorId: string | undefined;
  warnId: string | undefined;
  readonlyId: string | undefined;
};

/**
 * Space-join the truthy `aria-describedby` ids from a field's readonly
 * description, selection description, and validation/helper status id,
 * so callers can spread the result straight into `aria-describedby`
 * without hand-rolling `.filter(Boolean).join(" ") || undefined`.
 */
export function joinDescribedBy(
  ...ids: Array<string | null | undefined | false>
): string | undefined;

/**
 * Resolve the single id that a field's `aria-describedby` (or
 * equivalent) should point to, prioritizing invalid text, then warn
 * text, then helper text.
 */
export function resolveStatusDescribedBy(options: {
  showInvalid: boolean;
  showWarn: boolean;
  helperText?: unknown;
  invalidText?: unknown;
  warnText?: unknown;
  /**
   * Fluid mode renders the helper text inline, so it is not also
   * pointed at from `aria-describedby`.
   */
  isFluid?: boolean;
  errorId: string;
  warnId: string;
  helperId?: string;
  /**
   * `false` when the invalid message is instead surfaced via
   * `aria-errormessage`; the resolver then skips straight past the
   * invalid tier.
   */
  includeErrorId?: boolean;
  requireInvalidText?: boolean;
  requireWarnText?: boolean;
  /**
   * Some fields (TextArea) also suppress the warn id while fluid,
   * not just the helper id.
   */
  hideWarnWhenFluid?: boolean;
}): string | undefined;
