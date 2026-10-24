<script>
  /**
   * @event click:outside
   * @property {HTMLElement} target
   */

  /**
   * @event close
   * @type {object}
   * @property {"outside-click" | "escape-key"} trigger
   */

  /**
   * Set to `true` to display the popover.
   * @bindable writable
   */
  export let open = false;

  /** Set to `true` to close the popover on an outside click */
  export let closeOnOutsideClick = false;

  /** Set to `true` to close the popover on the Escape key */
  export let closeOnEscape = false;

  /** Set to `true` render a caret */
  export let caret = false;

  /**
   * Specify the alignment of the caret.
   * Prefer the Carbon v11 names (`"top-start"`, `"left-end"`, and so on).
   * On the top and bottom, `start` and `end` name inline sides, so they swap
   * under `dir="rtl"`. The older names (`"top-left"`, `"left-bottom"`, and so
   * on) still work and name physical sides, so they keep their place in RTL.
   * @type {"top" | "top-start" | "top-end" | "bottom" | "bottom-start" | "bottom-end" | "left" | "left-start" | "left-end" | "right" | "right-start" | "right-end" | "top-left" | "top-right" | "bottom-left" | "bottom-right" | "left-bottom" | "left-top" | "right-bottom" | "right-top"}
   */
  export let align = "top";

  /** Set to `false` to remove the drop shadow */
  export let dropShadow = true;

  /** Set to `true` to draw a 1px border around the popover and its caret */
  export let border = false;

  /** Set to `true` to enable the high contrast variant */
  export let highContrast = false;

  /** Set to `true` to use a relative position */
  export let relative = false;

  import { createEventDispatcher } from "svelte";
  import { dismiss } from "../utils/dismiss.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import { isInlineAlign, popoverPlacement } from "../utils/inline-align.js";
  import { isOutsideClick } from "../utils/is-outside-click.js";
  import {
    getLayoutDirection,
    resolveLayoutDirection,
  } from "../utils/layout-direction.js";

  const dispatch = createEventDispatcher();
  const layoutDirection = getLayoutDirection();

  let popoverRef = null;

  // Read when the popover opens: nothing reports a `dir` change. A
  // `bind:this` ref in `$:` would re-run it on every update, so a function
  // reads `popoverRef`.
  $: rtl = open && isInlineAlign(align) && readRtl($layoutDirection);

  /** @param {"ltr" | "rtl" | undefined} contextDirection */
  function readRtl(contextDirection) {
    return resolveLayoutDirection(contextDirection, popoverRef) === "rtl";
  }
  $: alignClass = popoverPlacement(align, rtl);

  // A DatePicker nested in this popover may portal its flatpickr calendar to
  // `document.body` (outside `popoverRef`), so a click on it looks like an outside
  // click. Flatpickr stamps the input with `_flatpickr`; walk the popover's
  // own inputs to check whether the clicked calendar belongs to one of them.
  function isDatePickerCalendarClick(target) {
    if (!popoverRef || !(target instanceof Element)) return false;
    const calendar = target.closest(".bx--date-picker__calendar");
    if (!calendar) return false;
    for (const input of popoverRef.querySelectorAll("input")) {
      if (
        /** @type {any} */ (input)._flatpickr?.calendarContainer === calendar
      ) {
        return true;
      }
    }
    return false;
  }

  function handleOutsideClick(event) {
    if (
      open &&
      isOutsideClick(event, popoverRef) &&
      !isDatePickerCalendarClick(event.target)
    ) {
      dispatch("click:outside", { target: event.target });
      if (closeOnOutsideClick) {
        open = false;
        dispatch("close", { trigger: "outside-click" });
      }
    }
  }

  // Escape is listened for on `window` (via `dismiss`) rather than on the
  // popover itself because focus is often on the trigger, not inside the
  // popover content. Does not `stopPropagation`: other layers (e.g. `Modal`)
  // rely on Escape bubbling to their own handlers.
  function handleEscape(event) {
    if (open && closeOnEscape && event.key === "Escape") {
      // Escape that cancels an IME composition is not a close.
      if (isImeComposition(event)) return;
      open = false;
      dispatch("close", { trigger: "escape-key" });
    }
  }
</script>

<div
  bind:this={popoverRef}
  use:dismiss={{
    enabled: open,
    listeners: [
      { type: "click", handler: handleOutsideClick },
      { type: "keydown", handler: handleEscape },
    ],
  }}
  class:bx--popover={true}
  class:bx--popover--caret={caret}
  class:bx--popover--high-contrast={highContrast}
  class:bx--popover--drop-shadow={dropShadow}
  class:bx--popover--border={border}
  class:bx--popover--top={alignClass === "top"}
  class:bx--popover--top-left={alignClass === "top-left"}
  class:bx--popover--top-right={alignClass === "top-right"}
  class:bx--popover--bottom={alignClass === "bottom"}
  class:bx--popover--bottom-left={alignClass === "bottom-left"}
  class:bx--popover--bottom-right={alignClass === "bottom-right"}
  class:bx--popover--left={alignClass === "left"}
  class:bx--popover--left-bottom={alignClass === "left-bottom"}
  class:bx--popover--left-top={alignClass === "left-top"}
  class:bx--popover--right={alignClass === "right"}
  class:bx--popover--right-bottom={alignClass === "right-bottom"}
  class:bx--popover--right-top={alignClass === "right-top"}
  class:bx--popover--open={open}
  class:bx--popover--relative={relative}
  style:position={relative ? "relative" : undefined}
  {...$$restProps}
>
  <div class:bx--popover-contents={true}><slot /></div>
</div>
