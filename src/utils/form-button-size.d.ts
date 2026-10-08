/**
 * Map a `Form` field size to the button size of the same height.
 */

/**
 * Button size whose height matches a `Form` field size: `xs` is 24px,
 * `sm` is 32px, and `xl` is 48px. Returns `undefined` for an unset or
 * unknown size.
 */
export function formButtonSize(
  formSize: string | undefined,
): "xs" | "small" | "default" | undefined;
