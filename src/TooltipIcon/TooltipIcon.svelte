<script>
  /**
   * @generics {Icon = any} Icon
   * @event {null} open
   * @event {null} close
   */

  import { createEventDispatcher, getContext, onMount } from "svelte";
  import { get } from "svelte/store";
  import PortalTooltip from "../Portal/PortalTooltip.svelte";
  import { activeTooltipIcon } from "./tooltip-icon-store.js";

  /**
   * Specify the tooltip text.
   * Alternatively, use the "tooltipText" slot.
   */
  export let tooltipText = "";

  /**
   * Set to `true` to open the tooltip.
   */
  export let open = false;

  /**
   * Specify the icon to render.
   * @type {Icon}
   */
  export let icon = /** @type {Icon} */ (undefined);

  /**
   * Specify the icon size.
   * Carbon icons use a 16/20/24/32 scale, but any number (pixels) can be used.
   * @type {(16 | 20 | 24 | 32 | (number & {}))}
   */
  export let size = 16;

  /** Set to `true` to disable the tooltip icon */
  export let disabled = false;

  /**
   * Set the alignment of the tooltip relative to the icon.
   * @type {"start" | "center" | "end"}
   */
  export let align = "center";

  /**
   * Set the direction of the tooltip relative to the icon.
   * @type {"top" | "right" | "bottom" | "left"}
   */
  export let direction = "bottom";

  /** Set an id for the span element */
  export let id = `ccs-${Math.random().toString(36)}`;

  /**
   * Specify the duration in milliseconds to delay before displaying the tooltip.
   * @type {number}
   */
  export let enterDelayMs = 100;

  /**
   * Specify the duration in milliseconds to delay before hiding the tooltip.
   * @type {number}
   */
  export let leaveDelayMs = 300;

  /** Obtain a reference to the button HTML element */
  export let ref = null;

  /**
   * Set to `true` to render the tooltip in a portal,
   * preventing it from being clipped by `overflow: hidden` containers.
   * By default, the tooltip is portalled when inside a `Modal`.
   * @type {boolean | undefined}
   */
  export let portalTooltip = undefined;

  const dispatch = createEventDispatcher();
  const tooltipId = {};

  let isInitialRender = true;
  let clicked = false;
  let openTimeout;

  function setOpenDelayed(value, delay = 0) {
    clearTimeout(openTimeout);
    if (delay > 0) {
      openTimeout = setTimeout(() => {
        if (value) show();
        else hide();
      }, delay);
    } else {
      if (value) show();
      else hide();
    }
  }

  const insideModal = getContext("carbon:Modal");

  $: effectivePortalTooltip =
    portalTooltip === undefined ? !!insideModal : portalTooltip;

  let hidden = false;
  let hovered = false;
  let focused = false;

  const show = () => {
    open = true;
    activeTooltipIcon.set(tooltipId);
  };

  const hide = () => {
    clicked = false;
    open = false;
    hovered = false;
    focused = false;
    if (get(activeTooltipIcon) === tooltipId) {
      activeTooltipIcon.set(null);
    }
  };

  $: tooltipHidden =
    $activeTooltipIcon !== null && $activeTooltipIcon !== tooltipId;

  // Sync the store when open is set externally (e.g., bind:open).
  $: {
    if (open) {
      activeTooltipIcon.set(tooltipId);
    } else if (get(activeTooltipIcon) === tooltipId) {
      activeTooltipIcon.set(null);
    }
  }

  $: {
    if (!isInitialRender) {
      dispatch(open ? "open" : "close");
    }
    isInitialRender = false;
  }

  $: portalOpen =
    effectivePortalTooltip &&
    !hidden &&
    !disabled &&
    (hovered || focused || open);

  const PORTAL_HORIZONTAL_GAP_LEFT_PX = 2;
  const PORTAL_HORIZONTAL_GAP_RIGHT_PX = 2;
  const PORTAL_VERTICAL_GAP_TOP_PX = 1;
  const PORTAL_VERTICAL_GAP_BOTTOM_PX = 1;
  const PORTAL_VERTICAL_ALIGN_OFFSET_LEFT_START_PX = -3;
  const PORTAL_VERTICAL_ALIGN_OFFSET_RIGHT_END_PX = 1;

  $: portalHorizontalGapLeft =
    direction === "left" || direction === "right"
      ? PORTAL_HORIZONTAL_GAP_LEFT_PX
      : 0;
  $: portalHorizontalGapRight =
    direction === "left" || direction === "right"
      ? PORTAL_HORIZONTAL_GAP_RIGHT_PX
      : 0;

  $: portalGapTop =
    direction === "top" || direction === "bottom"
      ? PORTAL_VERTICAL_GAP_TOP_PX
      : 0;
  $: portalGapBottom =
    direction === "top" || direction === "bottom"
      ? PORTAL_VERTICAL_GAP_BOTTOM_PX
      : 0;

  $: portalVerticalAlignOffsetLeft =
    direction === "left" && align === "start"
      ? PORTAL_VERTICAL_ALIGN_OFFSET_LEFT_START_PX
      : 0;
  $: portalVerticalAlignOffsetRight =
    direction === "right" && align === "end"
      ? PORTAL_VERTICAL_ALIGN_OFFSET_RIGHT_END_PX
      : 0;

  onMount(() => {
    return () => {
      clearTimeout(openTimeout);
      if (get(activeTooltipIcon) === tooltipId) {
        activeTooltipIcon.set(null);
      }
    };
  });
</script>

<svelte:window
  on:keydown={({ key }) => {
    if (key === "Escape") {
      hide();
    }
  }}
/>

<button
  bind:this={ref}
  {disabled}
  type="button"
  aria-describedby={id}
  class:bx--tooltip__trigger={true}
  class:bx--tooltip--portal-active={effectivePortalTooltip}
  class:bx--tooltip--a11y={!effectivePortalTooltip}
  class:bx--tooltip--visible={!effectivePortalTooltip &&
    open &&
    !disabled &&
    !tooltipHidden}
  class:bx--tooltip--hidden={!effectivePortalTooltip &&
    (!open || disabled || tooltipHidden)}
  class:bx--tooltip--top={!effectivePortalTooltip && direction === "top"}
  class:bx--tooltip--right={!effectivePortalTooltip && direction === "right"}
  class:bx--tooltip--bottom={!effectivePortalTooltip && direction === "bottom"}
  class:bx--tooltip--left={!effectivePortalTooltip && direction === "left"}
  class:bx--tooltip--align-start={!effectivePortalTooltip && align === "start"}
  class:bx--tooltip--align-center={!effectivePortalTooltip &&
    align === "center"}
  class:bx--tooltip--align-end={!effectivePortalTooltip && align === "end"}
  style:cursor={disabled ? "not-allowed" : "default"}
  {...$$restProps}
  on:click
  on:click={() => {
    if (disabled) return;
    if (clicked) {
      hide();
    } else {
      clicked = true;
      show();
    }
  }}
  on:mouseover
  on:mouseenter
  on:mouseenter={() => {
    if (disabled) return;
    hidden = false;
    // If immediately hovering over another tooltip icon, skip the delay.
    const warmHandoff = $activeTooltipIcon !== null;
    if (effectivePortalTooltip) {
      clearTimeout(openTimeout);
      if (!warmHandoff && enterDelayMs > 0) {
        openTimeout = setTimeout(() => {
          hovered = true;
        }, enterDelayMs);
      } else {
        hovered = true;
      }
    } else {
      setOpenDelayed(true, warmHandoff ? 0 : enterDelayMs);
    }
  }}
  on:mouseleave
  on:mouseleave={() => {
    if (clicked) return;
    if (effectivePortalTooltip) {
      clearTimeout(openTimeout);
      if (leaveDelayMs > 0) {
        openTimeout = setTimeout(() => {
          hovered = false;
        }, leaveDelayMs);
      } else {
        hovered = false;
      }
    } else {
      setOpenDelayed(false, leaveDelayMs);
    }
  }}
  on:focus
  on:focus={() => {
    if (disabled) return;
    hidden = false;
    if (effectivePortalTooltip) {
      focused = true;
    } else {
      show();
    }
  }}
  on:blur
  on:blur={() => {
    if (effectivePortalTooltip) {
      focused = false;
    } else {
      hide();
    }
  }}
>
  {#if !effectivePortalTooltip}
    <span {id} class:bx--assistive-text={true} style:pointer-events="none">
      <slot name="tooltipText">{tooltipText}</slot>
    </span>
  {/if}
  <slot><svelte:component this={icon} {size} /></slot>
</button>

{#if effectivePortalTooltip}
  <PortalTooltip
    anchor={ref}
    {direction}
    open={portalOpen}
    text={tooltipText}
    tooltipType="icon"
    horizontalGapLeft={portalHorizontalGapLeft}
    horizontalGapRight={portalHorizontalGapRight}
    gapTop={portalGapTop}
    gapBottom={portalGapBottom}
    verticalAlignOffsetLeft={portalVerticalAlignOffsetLeft}
    verticalAlignOffsetRight={portalVerticalAlignOffsetRight}
    intrinsicAlign={align}
    {id}
  >
    <slot name="tooltipText">{tooltipText}</slot>
  </PortalTooltip>
{/if}
