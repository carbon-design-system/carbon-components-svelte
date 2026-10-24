<script context="module">
  // Carbon v11 names map to the placement classes of the older names.
  const ALIGN_CLASS = {
    "top-start": "top-left",
    "top-end": "top-right",
    "bottom-start": "bottom-left",
    "bottom-end": "bottom-right",
    "left-start": "left-top",
    "left-end": "left-bottom",
    "right-start": "right-top",
    "right-end": "right-bottom",
  };
</script>

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
   * The older names (`"top-left"`, `"left-bottom"`, and so on) still work and
   * give the same placement.
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

  /**
   * Set to `true` to render the popover in a portal, so a box around it (a
   * scrolling panel, an `overflow: hidden` card, a Modal's body) can't cut
   * it off, or `false` to keep it in place. Left unset, it renders in place
   * and moves to a portal for an open only when such a box would cut it off.
   * @type {boolean | undefined}
   */
  export let portalPopover = undefined;

  import { createEventDispatcher, tick } from "svelte";
  import FloatingPortal from "../Portal/FloatingPortal.svelte";
  import { clippedBy } from "../utils/clipped-by.js";
  import { dismiss } from "../utils/dismiss.js";
  import { fitPopoverAlign } from "../utils/fit-popover-align.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import { isOutsideClick } from "../utils/is-outside-click.js";

  const dispatch = createEventDispatcher();

  let popoverRef = null;

  /** Marks the popover's place while it's portalled; its parent anchors it. */
  let markerRef = null;

  $: alignClass = ALIGN_CLASS[align] ?? align;

  // The align an open popover settles on: `align`, unless it runs past the
  // window there and fits better on the other side or edge.
  /** @type {null | string} */
  let fittedAlign = null;
  $: placement = fittedAlign ?? alignClass;

  // Set for one open when the in-place popover turns out to be cut off by a
  // box around it: it moves to a portal instead. Only when `portalPopover`
  // is left unset.
  let portalWhenClipped = false;
  $: portalled =
    !relative &&
    (portalPopover === undefined ? portalWhenClipped : portalPopover);

  $: if (!open) {
    fittedAlign = null;
    portalWhenClipped = false;
  }

  $: if (open && !portalled && !relative) {
    void alignClass;
    tick().then(fit);
  }

  async function fit() {
    if (!(open && popoverRef?.parentElement) || portalled) return;
    const mayPortal = portalPopover === undefined;
    if (mayPortal && clippedBy(popoverRef)) {
      portalWhenClipped = true;
      return;
    }
    const next = fitPopoverAlign(
      popoverRef,
      popoverRef.parentElement,
      alignClass,
    );
    if (next === placement) return;
    fittedAlign = next;
    await tick();
    if (mayPortal && open && popoverRef && clippedBy(popoverRef)) {
      portalWhenClipped = true;
    }
  }

  // FloatingPortal places by side and by start/center/end along it.
  $: [side, edge = ""] = placement.split("-");
  $: intrinsicAlign =
    edge === "left" || edge === "top"
      ? "start"
      : edge === "right" || edge === "bottom"
        ? "end"
        : "center";
  $: gap = caret ? 8 : 0;

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

{#if portalled}
  <span bind:this={markerRef} hidden></span>
  {#if open && markerRef?.parentElement}
    <FloatingPortal
      anchor={markerRef.parentElement}
      direction={side}
      {open}
      intrinsicWidth
      {intrinsicAlign}
      gapTop={gap}
      gapBottom={gap}
      horizontalGapLeft={gap}
      horizontalGapRight={gap}
      let:direction={portalSide}
    >
      <div
        bind:this={popoverRef}
        use:dismiss={{
          enabled: open,
          listeners: [
            { type: "click", handler: handleOutsideClick },
            { type: "keydown", handler: handleEscape },
          ],
        }}
        class="bx--popover bx--popover--portal bx--popover--open bx--popover--{edge
          ? `${portalSide}-${edge}`
          : portalSide}"
        class:bx--popover--caret={caret}
        class:bx--popover--high-contrast={highContrast}
        class:bx--popover--drop-shadow={dropShadow}
        class:bx--popover--border={border}
        {...$$restProps}
      >
        <div class:bx--popover-contents={true}><slot /></div>
      </div>
    </FloatingPortal>
  {/if}
{:else}
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
    class:bx--popover--top={placement === "top"}
    class:bx--popover--top-left={placement === "top-left"}
    class:bx--popover--top-right={placement === "top-right"}
    class:bx--popover--bottom={placement === "bottom"}
    class:bx--popover--bottom-left={placement === "bottom-left"}
    class:bx--popover--bottom-right={placement === "bottom-right"}
    class:bx--popover--left={placement === "left"}
    class:bx--popover--left-bottom={placement === "left-bottom"}
    class:bx--popover--left-top={placement === "left-top"}
    class:bx--popover--right={placement === "right"}
    class:bx--popover--right-bottom={placement === "right-bottom"}
    class:bx--popover--right-top={placement === "right-top"}
    class:bx--popover--open={open}
    class:bx--popover--relative={relative}
    style:position={relative ? "relative" : undefined}
    {...$$restProps}
  >
    <div class:bx--popover-contents={true}><slot /></div>
  </div>
{/if}
