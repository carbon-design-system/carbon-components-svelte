<script>
  /**
   * @event {null} open
   * @event {null} close
   * @restProps {span}
   */

  /** Specify the tooltip text */
  export let tooltipText = "";

  /**
   * Set to `true` to open the tooltip.
   * @bindable writable
   */
  export let open = false;

  /**
   * Set the alignment of the tooltip relative to the icon.
   * `start` and `end` name inline sides, so they swap under `dir="rtl"`.
   * @type {"start" | "center" | "end"}
   */
  export let align = "center";

  /**
   * Set the direction of the tooltip relative to the icon.
   * @type {"top" | "bottom"}
   */
  export let direction = "bottom";

  /** Set an id for the tooltip div element */
  export let id = uniqueId();

  /**
   * By default, the tooltip is opened on hover or focus.
   * Set to `true` to open the tooltip on click/focus instead of on hover.
   * Unhovering or blurring the tooltip will close it.
   */
  export let clickToOpen = false;

  /**
   * Specify the duration in milliseconds to delay before displaying the tooltip.
   * Defaults to the enclosing `TooltipGroup`'s delay, or `100`.
   * @type {number | undefined}
   */
  export let enterDelayMs = undefined;

  /**
   * Specify the duration in milliseconds to delay before hiding the tooltip.
   * Defaults to the enclosing `TooltipGroup`'s delay, or `300`.
   * @type {number | undefined}
   */
  export let leaveDelayMs = undefined;

  /**
   * Obtain a reference to the button HTML element.
   * @bindable readonly
   * @type {null | HTMLButtonElement}
   */
  export let ref = null;

  /**
   * Set to `true` to always render the tooltip in a portal, or `false` to
   * keep it in place. Left unset, the tooltip opens in a portal inside a
   * `Modal`, or when a box around it (`overflow` other than `visible`, such
   * as a `DataTable`) would cut it off.
   * @type {boolean | undefined}
   */
  export let portalTooltip = undefined;

  import { createEventDispatcher, getContext, onMount, tick } from "svelte";
  import FloatingPortal from "../Portal/FloatingPortal.svelte";
  import { MODAL_CONTEXT_KEY } from "../constants/context-keys.js";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { dismiss } from "../utils/dismiss.js";
  import { createOpenCloseDispatcher } from "../utils/dispatch-open-close.js";
  import { joinDescribedBy } from "../utils/field-status.js";
  import { clippedBy, slideIntoWindow } from "../utils/fit-align.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import { physicalAlign } from "../utils/inline-align.js";
  import {
    getLayoutDirection,
    resolveLayoutDirection,
  } from "../utils/layout-direction.js";
  import { getTooltipGroup } from "../utils/tooltip-group.js";
  import { createTooltipHandoff } from "../utils/tooltip-handoff.js";
  import { uniqueId } from "../utils/unique-id.js";

  const insideModal = getContext(MODAL_CONTEXT_KEY);
  const layoutDirection = getLayoutDirection();

  // Set for one open when the in-place tooltip turns out to be cut off by
  // a box around it (a scrolling panel, a DataTable): it shows in a portal
  // instead. Only when `portalTooltip` is left unset.
  let portalWhenClipped = false;
  $: if (!open) portalWhenClipped = false;

  $: effectivePortalTooltip =
    portalTooltip === undefined
      ? !!insideModal || portalWhenClipped
      : portalTooltip;

  /** @type {null | HTMLDivElement} */
  let tooltipRef = null;

  // Naming and description belong on the trigger button, not the wrapper.
  // A consumer `aria-describedby` joins the tooltip id, which in portal mode
  // exists only while the tooltip is shown.
  $: ({
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: wrapperProps,
  } = splitAriaNaming($$restProps));

  const PORTAL_VERTICAL_GAP_TOP_PX = -2;
  const PORTAL_VERTICAL_GAP_BOTTOM_PX = -3;

  const dispatch = createEventDispatcher();
  const notifyOpenChange = createOpenCloseDispatcher(dispatch);

  // Hover/focus scheduling shared with the tooltip group: only one tooltip
  // shows at a time, and moving between group members skips the delay.
  const tooltipHandoff = createTooltipHandoff({
    group: getTooltipGroup(),
    enterDelayMs: () => enterDelayMs,
    leaveDelayMs: () => leaveDelayMs,
    rich: true,
  });
  const tooltipOthersActive = tooltipHandoff.hidden;
  const tooltipInstant = tooltipHandoff.instant;

  function hide() {
    open = false;
  }

  function show() {
    open = true;
  }

  function toggle() {
    open = !open;
  }

  // Enter and Space toggle the tooltip, as in v11. A keyboard press
  // activates the button with a click whose `detail` is 0, so the click
  // still reaches `on:click` listeners. A pointer click toggles only with
  // `clickToOpen`.
  /** @param {MouseEvent} event */
  function handleClick(event) {
    if (clickToOpen || event.detail === 0) toggle();
  }

  // Focus shows the tooltip at once, without the fade-in.
  function showOnFocus() {
    tooltipHandoff.claim({ instant: true });
    show();
  }

  function scheduleShow() {
    tooltipHandoff.scheduleEnter(show);
  }

  function scheduleHide() {
    tooltipHandoff.scheduleLeave(hide);
  }

  // Pointer moved onto the portalled tooltip: keep it open.
  function keepOpen() {
    tooltipHandoff.cancel();
    show();
  }

  // Hold the active slot while open by any means, including `bind:open`.
  $: if (open) tooltipHandoff.claim();
  else tooltipHandoff.release();

  // Another tooltip took the slot; hide this one until it is released.
  $: shown = open && !$tooltipOthersActive;

  $: notifyOpenChange(open);

  $: inlineOpen = !effectivePortalTooltip && shown;
  // The in-place tooltip is laid out while hidden, so it measures where it
  // shows. Measured after the update, so the swap lands before paint.
  $: if (inlineOpen) tick().then(portalIfClipped);

  function portalIfClipped() {
    if (portalTooltip !== undefined || !inlineOpen || !tooltipRef) return;
    if (clippedBy(tooltipRef)) portalWhenClipped = true;
  }

  // The portal places the tooltip by physical side, and its caret styles
  // follow. The in-place tooltip flips in CSS instead. Read when the tooltip
  // shows: nothing reports a `dir` change. A `bind:this` ref in `$:` would
  // re-run it on every update, so a function reads `ref`.
  $: portalRtl = effectivePortalTooltip && shown && readRtl($layoutDirection);

  /** @param {"ltr" | "rtl" | undefined} contextDirection */
  function readRtl(contextDirection) {
    return resolveLayoutDirection(contextDirection, ref) === "rtl";
  }

  onMount(() => {
    return () => {
      tooltipHandoff.cancel();
      tooltipHandoff.release();
    };
  });

  // Runs in the capture phase so a visible tooltip is dismissed before any
  // ancestor (e.g. a Modal) sees Escape, whether focus is on the trigger or
  // elsewhere. A second Escape, with nothing left to dismiss, still bubbles.
  function handleKeydown(event) {
    // Escape that cancels an IME composition is not a close.
    if (event.key !== "Escape" || isImeComposition(event)) return;
    const visible = shown;
    hide();
    if (visible) event.stopPropagation();
  }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<span
  use:dismiss={{
    enabled: open,
    type: "keydown",
    handler: handleKeydown,
    options: { capture: true },
  }}
  class:bx--tooltip--definition={true}
  class:bx--tooltip--a11y={true}
  {...wrapperProps}
  on:mouseenter={clickToOpen ? undefined : scheduleShow}
  on:mouseleave={scheduleHide}
>
  <button
    bind:this={ref}
    type="button"
    aria-label={ariaLabel}
    aria-labelledby={ariaLabelledBy}
    aria-describedby={joinDescribedBy(
      effectivePortalTooltip && !shown ? undefined : id,
      ariaDescribedBy,
    )}
    aria-controls={effectivePortalTooltip && !shown ? undefined : id}
    aria-expanded={shown}
    class:bx--tooltip--portal-active={effectivePortalTooltip}
    class:bx--tooltip--a11y={!effectivePortalTooltip}
    class:bx--tooltip__trigger={true}
    class:bx--tooltip__trigger--definition={true}
    class:bx--tooltip--hidden={!effectivePortalTooltip && !shown}
    class:bx--tooltip--visible={inlineOpen}
    class:bx--tooltip--instant={!effectivePortalTooltip && $tooltipInstant}
    class:bx--tooltip--top={!effectivePortalTooltip && direction === "top"}
    class:bx--tooltip--bottom={!effectivePortalTooltip &&
      direction === "bottom"}
    class:bx--tooltip--align-start={!effectivePortalTooltip &&
      align === "start"}
    class:bx--tooltip--align-center={!effectivePortalTooltip &&
      align === "center"}
    class:bx--tooltip--align-end={!effectivePortalTooltip && align === "end"}
    on:click={handleClick}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
    on:focus
    on:focus={clickToOpen ? undefined : showOnFocus}
    on:blur
    on:blur={hide}
  >
    <slot />
  </button>
  {#if !effectivePortalTooltip}
    <div
      bind:this={tooltipRef}
      role="tooltip"
      {id}
      class:bx--assistive-text={true}
    >
      <slot name="tooltip">{tooltipText}</slot>
    </div>
  {/if}
</span>

{#if effectivePortalTooltip}
  <FloatingPortal
    anchor={ref}
    {direction}
    open={shown}
    gapTop={direction === "top" ? PORTAL_VERTICAL_GAP_TOP_PX : 0}
    gapBottom={direction === "bottom" ? PORTAL_VERTICAL_GAP_BOTTOM_PX : 0}
    intrinsicAlign={physicalAlign(align, portalRtl)}
    intrinsicWidth={true}
    let:direction={actualDirection}
  >
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class:bx--tooltip-portal={true}
      data-direction={actualDirection ?? direction}
      data-tooltip-type="definition"
      on:mouseenter={clickToOpen ? undefined : keepOpen}
      on:mouseleave={clickToOpen ? undefined : scheduleHide}
    >
      <span class:bx--tooltip-portal__caret={true}></span>
      <!-- The box lays out left to right (see _tooltip.scss); the text
      keeps the trigger's direction. -->
      <span
        use:slideIntoWindow
        {id}
        role="tooltip"
        class:bx--tooltip-portal__content={true}
        class:bx--assistive-text={true}
        dir={portalRtl ? "rtl" : undefined}
      >
        <slot name="tooltip">{tooltipText}</slot>
      </span>
    </div>
  </FloatingPortal>
{/if}
