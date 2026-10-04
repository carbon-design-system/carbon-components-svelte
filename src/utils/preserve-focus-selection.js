// @ts-check

/**
 * Svelte action: keep a select-on-focus selection after a click in WebKit.
 *
 * A click focuses the field on mousedown, so a `select()` made while handling
 * focus (directly or after `tick()`) runs before mouseup. WebKit's default
 * mouseup handling then collapses that selection to the caret; Chromium and
 * Firefox keep it. After a pointer-initiated focus, this cancels that one
 * mouseup while the full value is still selected. A drag that changed the
 * selection is left alone. Input types without a selection API (`number`)
 * can't report a drag, so their mouseup is always cancelled.
 *
 * The action does not select anything itself; the component keeps its own
 * select-on-focus logic and timing.
 *
 * @param {HTMLInputElement | HTMLTextAreaElement} node
 * @param {boolean} enabled
 * @returns {{ update: (enabled: boolean) => void, destroy: () => void }}
 */
export function preserveFocusSelection(node, enabled) {
  let active = enabled;
  let pointerFocus = false;

  function handleMousedown() {
    pointerFocus = node.ownerDocument.activeElement !== node;
  }

  /** @param {Event} event */
  function handleMouseup(event) {
    if (!pointerFocus) return;
    pointerFocus = false;
    if (!active || node.ownerDocument.activeElement !== node) return;
    const { selectionStart, selectionEnd } = node;
    if (
      selectionStart === null ||
      (selectionStart === 0 && selectionEnd === node.value.length)
    ) {
      event.preventDefault();
    }
  }

  function handleBlur() {
    pointerFocus = false;
  }

  node.addEventListener("mousedown", handleMousedown);
  node.addEventListener("mouseup", handleMouseup);
  node.addEventListener("blur", handleBlur);

  return {
    update(next) {
      active = next;
    },
    destroy() {
      node.removeEventListener("mousedown", handleMousedown);
      node.removeEventListener("mouseup", handleMouseup);
      node.removeEventListener("blur", handleBlur);
    },
  };
}
