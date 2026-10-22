// @ts-check
import { derived, get, writable } from "svelte/store";
import { isImeComposition } from "../utils/ime-composition.js";
import { createTooltipHandoff } from "../utils/tooltip-handoff.js";

/**
 * Hover and focus state for a tooltip anchored to a tag, or to a tag's
 * close button. Opens like an icon-only `Button`'s tooltip: after the
 * group's enter delay on hover, at once on focus, one at a time page-wide.
 *
 * Activating the anchor hides the tooltip, as does Escape. Either keeps it
 * hidden until the next pointer enter or focus.
 *
 * @param {object} [options]
 * @param {import("../utils/tooltip-group.js").TooltipGroup} [options.group]
 * @param {() => boolean} [options.enabled] Return `false` to ignore hover
 *   and focus, for example while the label fits or the tag is disabled.
 */
export function createTagTooltip({ group, enabled = () => true } = {}) {
  const handoff = createTooltipHandoff({ group });
  const hovered = writable(false);
  const focused = writable(false);
  const dismissed = writable(false);

  /** `true` while the tooltip shows. */
  const open = derived(
    [hovered, focused, dismissed, handoff.active],
    ([$hovered, $focused, $dismissed, $active]) =>
      !$dismissed && ($hovered || $focused) && $active,
  );

  function handleMouseenter() {
    if (!enabled()) return;
    dismissed.set(false);
    handoff.scheduleEnter(() => hovered.set(true));
  }

  function handleMouseleave() {
    handoff.scheduleLeave(() => {
      hovered.set(false);
      if (!get(focused)) handoff.release();
    });
  }

  function handleFocus() {
    if (!enabled()) return;
    focused.set(true);
    dismissed.set(false);
    handoff.claim({ instant: true });
  }

  function handleBlur() {
    focused.set(false);
    if (!get(hovered)) handoff.release();
  }

  /** Hide until the next pointer enter or focus. */
  function dismiss() {
    handoff.cancel();
    dismissed.set(true);
    handoff.release();
  }

  /**
   * Escape hides an open tooltip. When the anchor has focus, the key goes
   * on to the anchor's own handlers too: a `TagInput` returns to its field,
   * an `OperationalTag` closes its popover. Opened by hover alone, the
   * tooltip keeps the key, so an ancestor such as a `Modal` doesn't also
   * see it.
   * @param {KeyboardEvent} event
   */
  function handleKeydown(event) {
    if (event.key !== "Escape" || !get(open)) return;
    // Escape that cancels an IME composition is not a dismissal.
    if (isImeComposition(event)) return;
    if (!get(focused)) event.stopPropagation();
    dismiss();
  }

  /** Close at once and forget hover and focus. */
  function hide() {
    handoff.cancel();
    hovered.set(false);
    focused.set(false);
    handoff.release();
  }

  /**
   * Listen for hover, focus and activation on `node`.
   * @param {HTMLElement} node
   * @returns {() => void} Removes the listeners.
   */
  function attach(node) {
    /** @type {Array<[string, () => void]>} */
    const listeners = [
      ["mouseenter", handleMouseenter],
      ["mouseleave", handleMouseleave],
      ["focus", handleFocus],
      ["blur", handleBlur],
      ["click", dismiss],
    ];
    for (const [type, listener] of listeners) {
      node.addEventListener(type, listener);
    }
    return () => {
      for (const [type, listener] of listeners) {
        node.removeEventListener(type, listener);
      }
    };
  }

  return { open, attach, handleKeydown, dismiss, hide, destroy: hide };
}
