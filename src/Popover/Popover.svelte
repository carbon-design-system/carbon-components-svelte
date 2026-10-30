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

  /**
   * Set to `true` to always render the popover in a portal, or `false` to
   * keep it in place. Left unset, it renders in place and moves to a portal
   * for an open when a box around it (`overflow` other than `visible`) would
   * cut it off. A `relative` popover stays in place.
   * @type {boolean | undefined}
   */
  export let portalPopover = undefined;

  /**
   * Obtain a reference to the popover element.
   * In a portal, this is the portalled element.
   * @bindable readonly
   * @type {null | HTMLDivElement}
   */
  export let ref = null;

  import { createEventDispatcher, onMount, tick } from "svelte";
  import FloatingPortal from "../Portal/FloatingPortal.svelte";
  import { dismiss } from "../utils/dismiss.js";
  import {
    clippedBy,
    fitPopoverAlign,
    sidePlacement,
  } from "../utils/fit-align.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import { isInlineAlign, popoverPlacement } from "../utils/inline-align.js";
  import { isOutsideClick } from "../utils/is-outside-click.js";
  import {
    getLayoutDirection,
    resolveLayoutDirection,
  } from "../utils/layout-direction.js";
  import { rafThrottle } from "../utils/raf-throttle.js";
  import { addPooledListener } from "../utils/window-listener-pool.js";

  const dispatch = createEventDispatcher();
  const layoutDirection = getLayoutDirection();

  // Marks the popover's place while it's portalled. Its parent is the
  // anchor, as it is for the popover in place.
  /** @type {null | HTMLSpanElement} */
  let markerRef = null;

  // Read when the popover opens: nothing reports a `dir` change. A
  // `bind:this` ref in `$:` would re-run it on every update, so a function
  // reads `ref`.
  $: rtl = open && isInlineAlign(align) && readRtl($layoutDirection);

  /** @param {"ltr" | "rtl" | undefined} contextDirection */
  function readRtl(contextDirection) {
    return resolveLayoutDirection(contextDirection, markerRef ?? ref) === "rtl";
  }
  // The physical placement `align` names (`bottom-left`, `left-top`).
  $: alignClass = popoverPlacement(align, rtl);

  // The placement an open popover settles on: `alignClass`, unless it runs
  // past the window or its container there and fits better on the other
  // side or edge. Physical, like `alignClass`. The fit keeps the align it
  // was made for, so a new `align` starts over in the same update.
  /** @type {null | { from: string, to: string }} */
  let fitted = null;
  $: placement = fitted?.from === alignClass ? fitted.to : alignClass;

  // Set for one open when the popover in place turns out to be cut off by a
  // box around it: it moves to a portal instead. Only when `portalPopover`
  // is left unset.
  let portalWhenClipped = false;
  $: portalled =
    !relative &&
    (portalPopover === undefined ? portalWhenClipped : portalPopover);

  $: if (!open) {
    fitted = null;
    portalWhenClipped = false;
  }

  // Fit on open, when the align changes, and once more after a move to a
  // portal. `ref` binds only in the browser, so this never fits during SSR.
  $: if (open && !relative) {
    void alignClass;
    void portalled;
    tick().then(() => fitPlacement());
  }

  // A window resize moves the anchor and changes the room around it, so an
  // open popover fits again, from the placement it has. One listener for
  // every popover, and only while open.
  const refit = rafThrottle(() => void fitPlacement());
  /** @type {null | (() => void)} */
  let stopRefit = null;
  $: if (open && !relative && typeof window !== "undefined") {
    if (!stopRefit) {
      stopRefit = addPooledListener("resize", refit, { passive: true });
    }
  } else {
    stopListening();
  }

  function stopListening() {
    stopRefit?.();
    stopRefit = null;
    refit.cancel();
  }

  onMount(() => stopListening);

  // The anchor's size, for styles that place the popover from its center
  // (Toggletip's caret). In place, 100% of the anchor does that.
  let anchorWidth = 0;
  let anchorHeight = 0;

  // Counts fits, so a fit that waits for the portal gives way to a later
  // one, after a new align or a resize.
  let fits = 0;

  // Measures the popover where it is, at `placement`: `alignClass` on open,
  // the fitted placement on a resize.
  async function fitPlacement(tries = 0) {
    if (!(open && ref)) return;
    const run = ++fits;
    const from = alignClass;
    if (portalled) {
      const anchor = markerRef?.parentElement;
      if (!anchor) return;
      const before = anchor.getBoundingClientRect();
      ({ width: anchorWidth, height: anchorHeight } = before);
      // The portal places its content on the next frame, and once more on
      // the frame after that.
      await twoFrames();
      if (!(open && portalled && ref) || run !== fits) return;
      // The anchor moved while the portal placed the box, as in a resize
      // or the Modal's entrance, so the box may still be where it was.
      // Measure again once the portal has followed. An anchor that never
      // stops gets measured after 10 tries.
      const after = anchor.getBoundingClientRect();
      const moved = after.left !== before.left || after.top !== before.top;
      if (moved && tries < 10) return fitPlacement(tries + 1);
      // The portal picks the side. The edge alignment along it is ours.
      const [, fittedEdge] = fitPopoverAlign(ref, anchor, placement).split("-");
      const next = fittedEdge ? `${side}-${fittedEdge}` : side;
      if (next !== placement) fitted = { from, to: next };
      return;
    }
    const anchor = ref.parentElement;
    if (!anchor) return;
    const next = fitPopoverAlign(ref, anchor, placement);
    if (next !== placement) {
      fitted = { from, to: next };
      await tick();
    }
    if (portalPopover === undefined && open && ref && clippedBy(ref)) {
      portalWhenClipped = true;
    }
  }

  // Two animation frames, or a timeout where there are none (tests).
  function twoFrames() {
    return new Promise((resolve) => {
      if (typeof requestAnimationFrame === "function")
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      else setTimeout(resolve);
    });
  }

  // `FloatingPortal` places by side, and by start, center or end along it.
  $: [side, edge = ""] = placement.split("-");
  /** @type {"start" | "end" | "center"} */
  $: intrinsicAlign =
    edge === "left" || edge === "top"
      ? "start"
      : edge === "right" || edge === "bottom"
        ? "end"
        : "center";

  /**
   * The class list of a portalled popover. A consumer `class` is kept: in
   * Svelte 3 and 4, a `class` in `$$restProps` would replace a static one.
   * The placement class names where the portal put the box, so the caret
   * points at the anchor. Each input is a parameter, so Svelte updates the
   * class when any of them changes.
   * @param {"top" | "bottom" | "left" | "right"} portalSide The side the portal settled on.
   * @param {"start" | "center" | "end"} align
   * @param {string | undefined} className
   */
  function portalClass(portalSide, align, className) {
    return [
      "bx--popover bx--popover--portal bx--popover--open",
      `bx--popover--${sidePlacement(portalSide, align)}`,
      className,
    ]
      .filter(Boolean)
      .join(" ");
  }

  // A DatePicker nested in this popover may portal its flatpickr calendar to
  // `document.body` (outside `ref`), so a click on it looks like an outside
  // click. Flatpickr stamps the input with `_flatpickr`; walk the popover's
  // own inputs to check whether the clicked calendar belongs to one of them.
  function isDatePickerCalendarClick(target) {
    if (!ref || !(target instanceof Element)) return false;
    const calendar = target.closest(".bx--date-picker__calendar");
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
      let:direction={portalSide}
    >
      <div
        bind:this={ref}
        use:dismiss={{
          enabled: open,
          listeners: [
            { type: "click", handler: handleOutsideClick },
            { type: "keydown", handler: handleEscape },
          ],
        }}
        {...$$restProps}
        class={portalClass(
          portalSide ?? side,
          intrinsicAlign,
          $$restProps.class,
        )}
        class:bx--popover--caret={caret}
        class:bx--popover--high-contrast={highContrast}
        class:bx--popover--drop-shadow={dropShadow}
        class:bx--popover--border={border}
        style:--ccs-popover-anchor-width="{anchorWidth}px"
        style:--ccs-popover-anchor-height="{anchorHeight}px"
      >
        <div class:bx--popover-contents={true}><slot /></div>
      </div>
    </FloatingPortal>
  {/if}
{:else}
  <div
    bind:this={ref}
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
