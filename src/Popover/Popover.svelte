<script>
  /**
   * @event click:outside
   * @property {HTMLElement} target
   */

  /**
   * @event close
   * @type {object}
   * @property {"outside-click"} trigger
   */

  /**
   * Set to `true` to display the popover.
   * @bindable writable
   */
  export let open = false;

  /** Set to `true` to close the popover on an outside click */
  export let closeOnOutsideClick = false;

  /** Set to `true` render a caret */
  export let caret = false;

  /**
   * Specify the alignment of the caret.
   * @type {"top" | "top-left" | "top-right" | "bottom" | "bottom-left" | "bottom-right" | "left" | "left-bottom" | "left-top" | "right" | "right-bottom" | "right-top"}
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
  import { isOutsideClick } from "../utils/isOutsideClick.js";

  const dispatch = createEventDispatcher();

  let ref = null;

  // A DatePicker nested in this popover may portal its flatpickr calendar to
  // `document.body` (outside `ref`), so a click on it looks like an outside
  // click. Flatpickr stamps the input with `_flatpickr`; walk the popover's
  // own inputs to check whether the clicked calendar belongs to one of them.
  function isDatePickerCalendarClick(target) {
    if (!ref || !(target instanceof Element)) return false;
    const calendar = target.closest(".flatpickr-calendar");
    if (!calendar) return false;
    for (const input of ref.querySelectorAll("input")) {
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
      isOutsideClick(event, ref) &&
      !isDatePickerCalendarClick(event.target)
    ) {
      dispatch("click:outside", { target: event.target });
      if (closeOnOutsideClick) {
        open = false;
        dispatch("close", { trigger: "outside-click" });
      }
    }
  }
</script>

<div
  bind:this={ref}
  use:dismiss={{ enabled: open, type: "click", handler: handleOutsideClick }}
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
