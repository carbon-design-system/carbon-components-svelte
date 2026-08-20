// @ts-check

/**
 * Drag-aware outside-click dismissal for dialog surfaces (Modal, ComposedModal).
 *
 * A plain `click` handler on the backdrop dismisses the dialog even when a text
 * selection that *began inside* the dialog is released outside it. To avoid that,
 * track whether the pointer was pressed inside the dialog on `mousedown` and only
 * dismiss on `mouseup` when it was not.
 *
 * A native `<select>` inside the dialog fires an unpaired `mouseup` on its host
 * element when its (browser-native, not in the DOM) options popup is dismissed,
 * with no corresponding `mousedown`. `pressedInside` is therefore only cleared by
 * an explicit outside `mousedown` (`pressOutside`), not by every `release`, so
 * that orphaned `mouseup` doesn't read as an outside click.
 *
 * @param {() => void} onDismiss Called on a press-and-release that began outside the dialog.
 * @returns {{ pressInside: () => void, pressOutside: () => void, release: () => void }}
 */
export function createOutsideDismiss(onDismiss) {
  let pressedInside = false;

  return {
    /** Wire to the dialog container's `on:mousedown`. */
    pressInside() {
      pressedInside = true;
    },
    /** Wire to the backdrop's `on:mousedown`, guarded to `event.target === event.currentTarget`. */
    pressOutside() {
      pressedInside = false;
    },
    /** Wire to the surface's `on:mouseup`; dismisses only if the press began outside. */
    release() {
      if (!pressedInside) onDismiss();
    },
  };
}
