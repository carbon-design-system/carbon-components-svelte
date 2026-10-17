// @ts-check
// Firefox treats shift+click on a `<label for="...">` as a text-selection gesture and
// never forwards a click to the associated checkbox (no click, no change, no toggle):
// https://bugzilla.mozilla.org/show_bug.cgi?id=559506.

/**
 * Redispatch a shift+click on a label as a click on its `input`, so `on:click` sees
 * consistent behavior, including `shiftKey`, across browsers. Dispatching "click" on a
 * checkbox runs its native pre-click activation (toggle + a follow-up "change"), so the
 * caller must not also toggle `checked` or the activation immediately undoes it.
 *
 * @param {MouseEvent} event
 * @param {HTMLInputElement | null | undefined} input
 * @returns {void}
 */
export function forwardShiftClick(event, input) {
  if (!event.shiftKey || !input || input.disabled) return;
  event.preventDefault();
  input.dispatchEvent(
    new MouseEvent("click", {
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    }),
  );
}
