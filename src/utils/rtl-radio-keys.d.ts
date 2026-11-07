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
 * Returns whether it moved the focus.
 */
export function moveRadioInRtl(
  event: KeyboardEvent,
  rtl: boolean,
  scope?: HTMLElement,
): boolean;
