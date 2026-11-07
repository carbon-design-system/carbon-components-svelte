// @ts-check
import { hasModifierKey } from "./has-modifier-key.js";

/**
 * Make the horizontal arrow keys follow the page in a right-to-left group of
 * native radios. Chromium and Firefox already do; WebKit moves to the next
 * radio in the DOM on ArrowRight, which is the one on the left. Doing the move
 * here gives every engine the same answer: ArrowRight goes toward the inline
 * start, ArrowLeft toward the inline end.
 *
 * Call it from a `keydown` handler on the element that holds the radios, or
 * on each radio with `scope` set to that element. It wraps at the ends, as
 * native radios do, skips disabled radios, and checks the radio it lands on,
 * which fires its `change` like a click.
 *
 * @param {KeyboardEvent} event
 * @param {boolean} rtl - Whether the group reads right to left.
 * @param {HTMLElement} [scope] - Holds the radios. Defaults to the element the handler is on.
 * @returns {boolean} Whether it moved the focus.
 */
export function moveRadioInRtl(event, rtl, scope) {
  if (!rtl || hasModifierKey(event)) return false;
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return false;

  const target = event.target;
  if (!(target instanceof HTMLInputElement) || target.type !== "radio") {
    return false;
  }

  const group = Array.from(
    (
      scope ?? /** @type {HTMLElement} */ (event.currentTarget)
    ).querySelectorAll('input[type="radio"]'),
  ).filter(
    (radio) =>
      radio instanceof HTMLInputElement &&
      radio.name === target.name &&
      radio.form === target.form &&
      !radio.disabled,
  );
  const index = group.indexOf(target);
  if (index < 0) return false;

  event.preventDefault();
  const step = event.key === "ArrowLeft" ? 1 : -1;
  const next = /** @type {HTMLInputElement} */ (
    group[(index + step + group.length) % group.length]
  );
  next.focus();
  next.click();
  return true;
}
