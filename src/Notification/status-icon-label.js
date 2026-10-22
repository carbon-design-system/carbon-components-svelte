// @ts-check
// Default screen reader labels for the notification status icons.

const LABELS = {
  error: "Error",
  info: "Information",
  "info-square": "Information",
  success: "Success",
  warning: "Warning",
  "warning-alt": "Warning",
};

/**
 * Return the default label of a notification's status icon, such as
 * "Warning" for both `warning` and `warning-alt`. Returns `undefined`
 * for an unknown kind.
 *
 * @param {string} kind
 * @returns {string | undefined}
 */
export function statusIconLabel(kind) {
  return LABELS[/** @type {keyof typeof LABELS} */ (kind)];
}
