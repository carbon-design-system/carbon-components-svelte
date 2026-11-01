// @ts-check
import { derived, get, writable } from "svelte/store";
import { dismiss as windowListener } from "./dismiss.js";
import { isPointerFocus } from "./focus.js";
import { isImeComposition } from "./ime-composition.js";
import { ignoreTooltipClicks } from "./tooltip-clicks.js";
import { closeOverControls } from "./tooltip-cover.js";
import { createTooltipHandoff } from "./tooltip-handoff.js";

/**
 * Hover and focus state for a tooltip anchored to an element, such as an
 * icon-only control's label or clipped text. Opens like an icon-only
 * `Button`'s tooltip: after the group's enter delay on hover, at once on
 * focus, one at a time page-wide.
 *
 * The pointer can move from the anchor onto the tooltip, and the tooltip
 * stays while the pointer is on either. Escape hides it until the next
 * pointer enter or focus, as can activating the anchor (WCAG 1.4.13).
 * Focus the library moves itself, such as a dialog's first focus, does
 * not show it.
 *
 * @param {object} [options]
 * @param {import("./tooltip-group.js").TooltipGroup} [options.group]
 * @param {() => boolean} [options.enabled] Return `false` to ignore hover
 *   and focus, for example while the text fits.
 * @param {boolean} [options.passEscapeWhenFocused] Let Escape reach the
 *   focused anchor's own handlers after it hides the tooltip. Set it for an
 *   anchor that is a control with its own Escape behavior.
 * @param {() => boolean} [options.passEscape] Let Escape go on after it
 *   hides the tooltip while this returns `true`, focused or not. Set it
 *   while something the anchor opened, such as a panel, closes on Escape.
 * @param {boolean} [options.dismissOnClick] Set to `false` to keep the
 *   tooltip open when the anchor is activated. Defaults to `true`.
 * @param {() => number | undefined} [options.enterDelayMs] Overrides the
 *   group's enter delay when it returns a number.
 */
export function createAnchoredTooltip({
  group,
  enabled = () => true,
  passEscapeWhenFocused = false,
  passEscape = () => false,
  dismissOnClick = true,
  enterDelayMs,
} = {}) {
  const handoff = createTooltipHandoff({ group, enterDelayMs });
  // `entered` follows the pointer at once; `hovered` waits out the delay.
  const entered = writable(false);
  const hovered = writable(false);
  const focused = writable(false);
  const dismissed = writable(false);

  /**
   * `true` while the tooltip shows. Another tooltip holds it back while it
   * has the active slot, and lets it show again once it lets go.
   */
  const open = derived(
    [hovered, focused, dismissed, handoff.hidden],
    ([$hovered, $focused, $dismissed, $othersActive]) =>
      !$dismissed && ($hovered || $focused) && !$othersActive,
  );

  /**
   * `true` while the tooltip must not show: another tooltip has the active
   * slot, or the anchor has the pointer or focus but the tooltip is closed
   * (waiting out the delay, or hidden by Escape). A tooltip that CSS shows
   * on `:hover` and `:focus` needs this to stay hidden.
   */
  const hidden = derived(
    [entered, focused, open, handoff.hidden],
    ([$entered, $focused, $open, $othersActive]) =>
      $othersActive || (($entered || $focused) && !$open),
  );

  function handleMouseenter() {
    if (!enabled()) return;
    entered.set(true);
    dismissed.set(false);
    handoff.scheduleEnter(() => hovered.set(true));
  }

  function handleMouseleave() {
    entered.set(false);
    handoff.scheduleLeave(() => {
      hovered.set(false);
      if (!get(focused)) handoff.release();
    });
  }

  /** @param {Event} event */
  function handleFocus(event) {
    if (!enabled()) return;
    const node = /** @type {Element} */ (event.currentTarget);
    // A click's focus leaves the tooltip to the pointer.
    if (isPointerFocus(node)) return;
    focused.set(true);
    dismissed.set(!handoff.claimFocus(node));
  }

  /**
   * The pointer moved onto a portalled tooltip: keep it open. Inline
   * tooltips sit inside the anchor and need no listener.
   */
  function handleTooltipMouseenter() {
    if (!get(open)) return;
    entered.set(true);
    handoff.cancel();
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
   * focused anchor still gets the key, and with `passEscape`, everything
   * does. As with an icon-only `Button`, it
   * also ends the group's skip window, so the next tooltip waits its delay.
   * @param {KeyboardEvent} event
   */
  function handleKeydown(event) {
    if (event.key !== "Escape" || !get(open)) return;
    if (isImeComposition(event)) return;
    const pass = passEscape() || (passEscapeWhenFocused && get(focused));
    if (!pass) event.stopPropagation();
    dismissed.set(true);
    handoff.dismiss();
  }

  /** @param {Event} event */
  function handleWindowKeydown(event) {
    handleKeydown(/** @type {KeyboardEvent} */ (event));
  }

  /**
   * The pointer moved onto a part of a portalled tooltip that covers
   * another control: close at once, so the pointer and the next click
   * reach that control. The pointer is off the anchor, so it no longer
   * counts as entered.
   */
  function handleTooltipCover() {
    entered.set(false);
    dismiss();
  }

  /** Close at once and forget hover and focus. */
  function hide() {
    handoff.cancel();
    entered.set(false);
    hovered.set(false);
    focused.set(false);
    handoff.release();
  }

  /**
   * Listen for hover, focus and activation on `node`, and for Escape on
   * `window` while the tooltip shows. A click on an inline tooltip inside
   * `node` does nothing, and the pointer on a part of it that covers
   * another control closes it at once. The capture phase lets a tooltip
   * opened by hover hide while focus is elsewhere, before an ancestor sees
   * the key.
   * @param {HTMLElement} node
   * @returns {() => void} Removes the listeners.
   */
  function attach(node) {
    /** @type {Array<[string, (event: Event) => void]>} */
    const listeners = [
      ["mouseenter", handleMouseenter],
      ["mouseleave", handleMouseleave],
      ["focus", handleFocus],
      ["blur", handleBlur],
    ];
    if (dismissOnClick) listeners.push(["click", dismiss]);
    for (const [type, listener] of listeners) {
      node.addEventListener(type, listener);
    }
    /** @type {import("./dismiss.js").DismissParams} */
    const escapeOptions = {
      enabled: false,
      type: "keydown",
      handler: handleWindowKeydown,
      options: { capture: true },
    };
    const escapeListener = windowListener(null, escapeOptions);
    const unsubscribe = open.subscribe(($open) => {
      escapeListener.update({ ...escapeOptions, enabled: $open });
    });
    const tooltipClicks = ignoreTooltipClicks(node);
    const tooltipCover = closeOverControls(node, { onCover: dismiss });
    return () => {
      for (const [type, listener] of listeners) {
        node.removeEventListener(type, listener);
      }
      unsubscribe();
      escapeListener.destroy();
      tooltipClicks.destroy();
      tooltipCover.destroy();
    };
  }

  return {
    open,
    hidden,
    instant: handoff.instant,
    attach,
    handleTooltipMouseenter,
    handleTooltipMouseleave: handleMouseleave,
    handleTooltipCover,
    handleKeydown,
    dismiss,
    hide,
    destroy: hide,
  };
}
