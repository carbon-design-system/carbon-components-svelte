<script>
  /**
   * @event {null} open
   * @event {null} close
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
   */
  export let ref = null;

  /**
   * Set to `true` to render the tooltip in a portal,
   * preventing it from being clipped by `overflow: hidden` containers.
   * By default, the tooltip is portalled when inside a `Modal`.
   * @type {boolean | undefined}
   */
  export let portalTooltip = undefined;

  import { createEventDispatcher, getContext, onMount } from "svelte";
  import FloatingPortal from "../Portal/FloatingPortal.svelte";
  import { dismiss } from "../utils/dismiss.js";
  import { createOpenCloseDispatcher } from "../utils/dispatch-open-close.js";
  import { getTooltipGroup } from "../utils/tooltip-group.js";
  import { createTooltipHandoff } from "../utils/tooltip-handoff.js";
  import { uniqueId } from "../utils/unique-id.js";

  const insideModal = getContext("carbon:Modal");

  $: effectivePortalTooltip =
    portalTooltip === undefined ? !!insideModal : portalTooltip;

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
    hoverable: true,
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

  onMount(() => {
    return () => {
      tooltipHandoff.cancel();
      tooltipHandoff.release();
    };
  });
  function handleKeydown(event) {
    if (event.key === "Escape") hide();
  }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<span
  use:dismiss={{ enabled: open, type: "keydown", handler: handleKeydown }}
  class:bx--tooltip--definition={true}
  class:bx--tooltip--a11y={true}
  {...$$restProps}
  on:mouseenter={clickToOpen ? undefined : scheduleShow}
  on:mouseleave={scheduleHide}
>
  <button
    bind:this={ref}
    type="button"
    aria-describedby={id}
    class:bx--tooltip--portal-active={effectivePortalTooltip}
    class:bx--tooltip--a11y={!effectivePortalTooltip}
    class:bx--tooltip__trigger={true}
    class:bx--tooltip__trigger--definition={true}
    class:bx--tooltip--hidden={!effectivePortalTooltip && !shown}
    class:bx--tooltip--visible={!effectivePortalTooltip && shown}
    class:bx--tooltip--instant={!effectivePortalTooltip && $tooltipInstant}
    class:bx--tooltip--top={!effectivePortalTooltip && direction === "top"}
    class:bx--tooltip--bottom={!effectivePortalTooltip &&
      direction === "bottom"}
    class:bx--tooltip--align-start={!effectivePortalTooltip &&
      align === "start"}
    class:bx--tooltip--align-center={!effectivePortalTooltip &&
      align === "center"}
    class:bx--tooltip--align-end={!effectivePortalTooltip && align === "end"}
    on:click={clickToOpen ? toggle : undefined}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
    on:focus
    on:focus={clickToOpen ? undefined : showOnFocus}
    on:blur={hide}
  >
    <slot />
  </button>
  {#if !effectivePortalTooltip}
    <div role="tooltip" {id} class:bx--assistive-text={true}>
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
    intrinsicAlign={align}
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
      <span
        {id}
        role="tooltip"
        class:bx--tooltip-portal__content={true}
        class:bx--assistive-text={true}
      >
        <slot name="tooltip">{tooltipText}</slot>
      </span>
    </div>
  </FloatingPortal>
{/if}
