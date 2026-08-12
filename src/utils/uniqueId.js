// @ts-check

/**
 * Generate a random id string, e.g. `ccs-4f2k9x1z`.
 * Not cryptographically secure; intended for DOM ids (aria-* pairing, label `for`, etc.).
 * @param {string} [prefix]
 * @returns {string}
 */
export function uniqueId(prefix = "ccs") {
  return `${prefix}-${Math.random().toString(36).slice(2)}`;
}
