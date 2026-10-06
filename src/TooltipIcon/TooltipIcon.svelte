<script>
  /**
   * @template [Icon=any]
   * @event {null} open
   * @event {null} close
   */

  import { createEventDispatcher, getContext, onMount } from "svelte";
  import { MODAL_CONTEXT_KEY } from "../constants/context-keys.js";
  import PortalTooltip from "../Portal/PortalTooltip.svelte";
  import { dismiss } from "../utils/dismiss.js";
  import { createOpenCloseDispatcher } from "../utils/dispatch-open-close.js";
  import { getTooltipGroup } from "../utils/tooltip-group.js";
  import { createTooltipHandoff } from "../utils/tooltip-handoff.js";
  import { uniqueId } from "../utils/unique-id.js";

  /**
   * Specify the tooltip text.
   * Alternatively, use the "tooltipText" slot.
   */
  export let tooltipText = "";

  /**
   * Set to `true` to open the tooltip.
   * @bindable writable
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
  export let id = uniqueId();

  /**
   * Specify the duration in milliseconds to delay before displaying the tooltip.
   * Defaults to the enclosing `TooltipGroup`'s delay, or `100`.
   * @type {number | undefined}
   */
  export let enterDelayMs = undefined;

  /**
   * Specify the duration in milliseconds to delay before hiding the tooltip.
   * Defaults to the enclosing `TooltipGroup`'s delay, or `0`.
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

  const dispatch = createEventDispatcher();
  const notifyOpenChange = createOpenCloseDispatcher(dispatch);

  let clicked = false;

  // Hover/focus scheduling shared with the tooltip group: only one tooltip
  // shows at a time, and moving between group members skips the delay.
  const tooltipHandoff = createTooltipHandoff({
    group: getTooltipGroup(),
    enterDelayMs: () => enterDelayMs,
    leaveDelayMs: () => leaveDelayMs,
  });
  const tooltipOthersActive = tooltipHandoff.hidden;
  const tooltipInstant = tooltipHandoff.instant;

  const insideModal = getContext(MODAL_CONTEXT_KEY);

  $: effectivePortalTooltip =
    portalTooltip === undefined ? !!insideModal : portalTooltip;

  let hidden = false;
  let hovered = false;
  let focused = false;

  function show() {
    // Re-enable the portalled tooltip after an Escape dismissal.
    hidden = false;
    open = true;
    tooltipHandoff.claim();
  }

  function hide() {
    clicked = false;
    open = false;
    hovered = false;
    focused = false;
    tooltipHandoff.release();
  }

  $: tooltipHidden = $tooltipOthersActive;

  // Hold the active slot while shown by any means, including an external
  // `bind:open`; release it once nothing keeps the tooltip up. Skipped on
  // the server: the slot is module state shared by every request, and
  // nothing unmounts there to release it.
  $: if (typeof window !== "undefined") {
    if (open) {
      tooltipHandoff.claim();
    } else if (!hovered && !focused) {
      tooltipHandoff.release();
    }
  }

  $: notifyOpenChange(open);

  $: portalOpen =
    effectivePortalTooltip &&
    !hidden &&
    !disabled &&
    !tooltipHidden &&
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
      tooltipHandoff.cancel();
      tooltipHandoff.release();
    };
  });

  // Runs in the capture phase so a visible tooltip is dismissed before any
  // ancestor (e.g. a Modal) sees Escape, whether focus is on the trigger or
  // elsewhere. A second Escape, with nothing left to dismiss, still bubbles.
  function handleKeydown(event) {
    if (event.key !== "Escape") return;
    const visible = effectivePortalTooltip
      ? portalOpen
      : open && !disabled && !tooltipHidden;
    hidden = true;
    hide();
    if (visible) event.stopPropagation();
  }

  // In portal mode the assistive-text span is not rendered, so name the
  // trigger directly. A consumer-supplied label takes precedence; the tooltip
  // text is then exposed as the description instead.
  $: hasConsumerLabel =
    $$restProps["aria-label"] != null || $$restProps["aria-labelledby"] != null;
  $: portalLabel =
    effectivePortalTooltip && tooltipText && !hasConsumerLabel
      ? tooltipText
      : undefined;
  $: describedBy = portalLabel
    ? undefined
    : effectivePortalTooltip
      ? portalOpen
        ? id
        : undefined
      : id;
</script>

<button
  bind:this={ref}
  use:dismiss={{
    enabled: open || portalOpen,
    type: "keydown",
    handler: handleKeydown,
    options: { capture: true },
  }}
  {disabled}
  type="button"
  aria-describedby={describedBy}
  class:bx--tooltip__trigger={true}
  class:bx--tooltip--portal-active={effectivePortalTooltip}
  class:bx--tooltip--a11y={!effectivePortalTooltip}
  class:bx--tooltip--visible={!effectivePortalTooltip &&
    open &&
    !disabled &&
    !tooltipHidden}
  class:bx--tooltip--hidden={!effectivePortalTooltip &&
    (!open || disabled || tooltipHidden)}
  class:bx--tooltip--instant={!effectivePortalTooltip && $tooltipInstant}
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
  aria-label={portalLabel ?? $$restProps["aria-label"]}
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
    if (effectivePortalTooltip) {
      tooltipHandoff.scheduleEnter(() => {
        hovered = true;
      });
    } else {
      tooltipHandoff.scheduleEnter(show);
    }
  }}
  on:mouseleave
  on:mouseleave={() => {
    if (clicked) return;
    if (effectivePortalTooltip) {
      tooltipHandoff.scheduleLeave(() => {
        hovered = false;
      });
    } else {
      tooltipHandoff.scheduleLeave(hide);
    }
  }}
  on:focus
  on:focus={() => {
    if (disabled) return;
    hidden = false;
    // Focus shows the tooltip at once, without the fade-in.
    tooltipHandoff.claim({ instant: true });
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
