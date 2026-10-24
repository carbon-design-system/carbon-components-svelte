// @ts-check

const CONTROL_ROLES = [
  "button",
  "checkbox",
  "combobox",
  "link",
  "menuitem",
  "menuitemcheckbox",
  "menuitemradio",
  "option",
  "radio",
  "searchbox",
  "slider",
  "spinbutton",
  "switch",
  "tab",
  "textbox",
  "treeitem",
];

/**
 * Elements a click acts on. A disabled form control is not one: a click
 * on it does nothing, so a tooltip over it can stay.
 */
const CONTROL_SELECTOR = [
  "a[href]",
  "area[href]",
  "button:not(:disabled)",
  'input:not(:disabled):not([type="hidden"])',
  "select:not(:disabled)",
  "textarea:not(:disabled)",
  "summary",
  "label",
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]:not([tabindex="-1"])',
  ...CONTROL_ROLES.map((role) => `[role="${role}"]`),
].join(", ");

/** An inline tooltip's text (with its hover bridge), or a portalled tooltip. */
const TOOLTIP_SELECTOR = ".bx--assistive-text, .bx--tooltip-portal";

/**
 * Find the control under a tooltip at a viewport point: the control the
 * pointer would reach there without the tooltip. The tooltip, the elements
 * that hold it (an inline tooltip's trigger) and the trigger itself don't
 * count, and nor does a control that holds the trigger, such as a
 * clickable tile.
 *
 * @param {Element} tooltip
 * @param {number} x
 * @param {number} y
 * @param {Element | null} [trigger] The element that shows the tooltip.
 * @returns {Element | null}
 */
export function findCoveredControl(tooltip, x, y, trigger = null) {
  for (const element of document.elementsFromPoint(x, y)) {
    if (tooltip.contains(element) || element.contains(tooltip)) continue;
    const control = element.closest(CONTROL_SELECTOR);
    if (!control || control.contains(tooltip)) return null;
    if (trigger && (trigger.contains(control) || control.contains(trigger))) {
      return null;
    }
    return control;
  }
  return null;
}

/**
 * @typedef {object} CloseOverControlsParams
 * @property {() => void} onCover Close the tooltip at once.
 * @property {Element | null} [trigger] The element that shows the tooltip.
 *   Needed for a portalled tooltip; an inline tooltip sits inside it.
 */

/**
 * Close a tooltip when the pointer moves onto a part of it that covers
 * another control. The pointer can rest on a tooltip (WCAG 1.4.13), but an
 * icon tooltip often covers a neighbor, as in a row of buttons. A user who
 * moves from one button toward the next aims for that next button, so
 * `onCover` closes the tooltip and the pointer and the next click reach the
 * control under it. Over a part that covers no control, the tooltip
 * stays.
 *
 * Svelte action for a portalled tooltip, or for a trigger with its inline
 * tooltip inside. It checks the first move at once, so a quick move and
 * click doesn't land on the tooltip, then at most once per animation frame,
 * and only while the pointer is on the tooltip. Touch and pen have no hover
 * to rest on the tooltip, so only a mouse counts.
 *
 * @param {HTMLElement} node
 * @param {CloseOverControlsParams} params
 */
export function closeOverControls(node, params) {
  let { onCover, trigger = null } = params;
  /** @type {null | { tooltip: Element, x: number, y: number }} */
  let pending = null;
  let frame = 0;

  /**
   * @param {Element} tooltip
   * @param {number} x
   * @param {number} y
   */
  function check(tooltip, x, y) {
    if (findCoveredControl(tooltip, x, y, trigger)) onCover();
  }

  function flush() {
    frame = 0;
    if (!pending) return;
    const { tooltip, x, y } = pending;
    pending = null;
    if (tooltip.isConnected) check(tooltip, x, y);
  }

  function cancel() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    pending = null;
  }

  /** @param {PointerEvent} event */
  function handlePointermove(event) {
    if (event.pointerType !== "mouse") return;
    const target = event.target;
    const tooltip =
      target instanceof Element ? target.closest(TOOLTIP_SELECTOR) : null;
    if (!tooltip || !node.contains(tooltip)) {
      pending = null;
      return;
    }
    if (frame) {
      pending = { tooltip, x: event.clientX, y: event.clientY };
      return;
    }
    check(tooltip, event.clientX, event.clientY);
    frame = requestAnimationFrame(flush);
  }

  node.addEventListener("pointermove", handlePointermove);
  node.addEventListener("pointerleave", cancel);

  return {
    /** @param {CloseOverControlsParams} next */
    update(next) {
      ({ onCover, trigger = null } = next);
    },
    destroy() {
      cancel();
      node.removeEventListener("pointermove", handlePointermove);
      node.removeEventListener("pointerleave", cancel);
    },
  };
}
