// @ts-check

/**
 * Keep a click on an inline tooltip from activating its trigger. The
 * tooltip renders inside the trigger, and the pointer can rest on it
 * (WCAG 1.4.13), where it may cover a neighboring control. A click there
 * would press the trigger instead of the control the user aimed for, so
 * it does nothing, as a click on a portalled tooltip does.
 *
 * Svelte action. Listens in the capture phase, so the click reaches none
 * of the trigger's own listeners.
 *
 * @param {HTMLElement} node The trigger.
 * @returns {{ destroy: () => void }}
 */
export function ignoreTooltipClicks(node) {
  /** @param {MouseEvent} event */
  function handleClick(event) {
    const target = event.target;
    if (!(target instanceof Element) || target === node) return;
    const tooltip = target.closest(".bx--assistive-text");
    if (!tooltip || !node.contains(tooltip)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  node.addEventListener("click", handleClick, { capture: true });
  return {
    destroy() {
      node.removeEventListener("click", handleClick, { capture: true });
    },
  };
}
