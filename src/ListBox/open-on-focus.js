/**
 * Decides whether a focus on a list box's text input should open its menu,
 * for `openOnFocus`. Only focus that arrives from outside the list box
 * counts: the list box moves focus back to its input itself (after the
 * clear button, or a click in its menu), and opening then would reopen a
 * menu the user just closed.
 *
 * Switching windows or tabs blurs the input and focuses it again on
 * return without the user moving focus, so that return doesn't count
 * either.
 *
 * @param {(node: Node) => boolean} isInside Whether `node` is part of the
 *   list box, its portalled menu included.
 * @returns {{ focus: (event: FocusEvent) => boolean; blur: (event: FocusEvent) => void }}
 *   `focus` returns `true` when the menu should open; call `blur` from the
 *   input's blur handler.
 */
export function createFocusOpener(isInside) {
  let leftWithWindow = false;
  return {
    focus(event) {
      const returning = leftWithWindow;
      leftWithWindow = false;
      if (returning) return false;
      const from = event.relatedTarget;
      return !(from instanceof Node && isInside(from));
    },
    blur(event) {
      const target = /** @type {Node | null} */ (event.target);
      leftWithWindow =
        event.relatedTarget === null &&
        !(target?.ownerDocument ?? document).hasFocus();
    },
  };
}
