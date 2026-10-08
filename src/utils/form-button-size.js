// @ts-check
// Map a `Form` field size to the button size of the same height.

/** @type {Record<string, "xs" | "small" | "default">} */
const BUTTON_SIZE_BY_FORM_SIZE = {
  xs: "xs",
  sm: "small",
  xl: "default",
};

/**
 * Button size whose height matches a `Form` field size: `xs` is 24px,
 * `sm` is 32px, and `xl` is 48px. Returns `undefined` for an unset or
 * unknown size.
 *
 * @param {string | undefined} formSize
 * @returns {"xs" | "small" | "default" | undefined}
 */
export function formButtonSize(formSize) {
  return formSize ? BUTTON_SIZE_BY_FORM_SIZE[formSize] : undefined;
}
