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
   * @type {"top"
   *   | "top-left"
   *   | "top-right"
   *   | "bottom"
   *   | "bottom-left"
   *   | "bottom-right"
   *   | "left"
   *   | "left-bottom"
   *   | "left-top"
   *   | "right"
   *   | "right-bottom"
   *   | "right-top"}
   */
  export let align = "top";

  /** Set to `true` to enable the light variant */
  export let light = false;

  /** Set to `true` to enable the high contrast variant */
  export let highContrast = false;

  /** Set to `true` to use a relative position */
  export let relative = false;

  import { createEventDispatcher } from "svelte";
  import { dismiss } from "../utils/dismiss.js";
  import { isOutsideClick } from "../utils/is-outside-click.js";

  const dispatch = createEventDispatcher();

  let popoverRef = null;

  // A DatePicker nested in this popover may portal its flatpickr calendar to
  // `document.body` (outside `popoverRef`), so a click on it looks like an outside
  // click. Flatpickr stamps the input with `_flatpickr`; walk the popover's
  // own inputs to check whether the clicked calendar belongs to one of them.
  function isDatePickerCalendarClick(target) {
    if (!popoverRef || !(target instanceof Element)) return false;
    const calendar = target.closest(".flatpickr-calendar");
    if (!calendar) return false;
    for (const input of popoverRef.querySelectorAll("input")) {
      if (
        /**
         * @type {any}
         */ (input)._flatpickr?.calendarContainer === calendar
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
  class:bx--popover--light={light}
  class:bx--popover--high-contrast={highContrast}
  class:bx--popover--top={align === "top"}
  class:bx--popover--top-left={align === "top-left"}
  class:bx--popover--top-right={align === "top-right"}
  class:bx--popover--bottom={align === "bottom"}
  class:bx--popover--bottom-left={align === "bottom-left"}
  class:bx--popover--bottom-right={align === "bottom-right"}
  class:bx--popover--left={align === "left"}
  class:bx--popover--left-bottom={align === "left-bottom"}
  class:bx--popover--left-top={align === "left-top"}
  class:bx--popover--right={align === "right"}
  class:bx--popover--right-bottom={align === "right-bottom"}
  class:bx--popover--right-top={align === "right-top"}
  class:bx--popover--open={open}
  class:bx--popover--relative={relative}
  style:position={relative ? "relative" : undefined}
  {...$$restProps}
>
  <div class:bx--popover-contents={true}><slot /></div>
</div>
