// @ts-check
import { derived, get, writable } from "svelte/store";
import { isImeComposition } from "./ime-composition.js";
import { createTooltipHandoff } from "./tooltip-handoff.js";

/**
 * Hover and focus state for a tooltip anchored to an element that has no
 * tooltip of its own, such as clipped text. Opens like an icon-only
 * `Button`'s tooltip: after the group's enter delay on hover, at once on
 * focus, one at a time page-wide.
 *
 * Activating the anchor hides the tooltip, as does Escape. Either keeps it
 * hidden until the next pointer enter or focus.
 *
 * @param {object} [options]
 * @param {import("./tooltip-group.js").TooltipGroup} [options.group]
 * @param {() => boolean} [options.enabled] Return `false` to ignore hover
 *   and focus, for example while the text fits.
 * @param {boolean} [options.passEscapeWhenFocused] Let Escape reach the
 *   focused anchor's own handlers after it hides the tooltip. Set it for an
 *   anchor that is a control with its own Escape behavior.
 */
export function createAnchoredTooltip({
  group,
  enabled = () => true,
  passEscapeWhenFocused = false,
} = {}) {
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
   * Escape hides an open tooltip and stops there, so an ancestor such as a
   * `Modal` waits for the next Escape. With `passEscapeWhenFocused`, a
   * focused anchor still gets the key.
   * @param {KeyboardEvent} event
   */
  function handleKeydown(event) {
    if (event.key !== "Escape" || !get(open)) return;
    if (isImeComposition(event)) return;
    if (!(passEscapeWhenFocused && get(focused))) event.stopPropagation();
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
