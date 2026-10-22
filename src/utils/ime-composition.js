// @ts-check

/**
 * True when a keydown belongs to an IME composition (an Escape that cancels it, an
 * Enter that commits it). Safari ends the composition before that keydown, so
 * `isComposing` is false there and only `keyCode` 229 gives it away.
 *
 * @param {KeyboardEvent} event
 * @returns {boolean}
 */
export function isImeComposition(event) {
  return event.isComposing || event.keyCode === 229;
}
