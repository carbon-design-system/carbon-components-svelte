<script>
  /**
   * @template {import("../utils/icon-component.js").IconComponent} [Icon=any]
   */

  /**
   * @event {null} open
   * @event {null} close
   * @slot {{}} tooltipChildren - Custom tooltip content. Replaces `tooltipText`.
   * @deprecated use the `tooltipChildren` slot
   * @slot {{}} tooltipText
   */

  import { createEventDispatcher, getContext, onMount, tick } from "svelte";
  import PortalTooltip from "../Portal/PortalTooltip.svelte";
  import { MODAL_CONTEXT_KEY } from "../constants/context-keys.js";
  import { dismiss } from "../utils/dismiss.js";
  import { createOpenCloseDispatcher } from "../utils/dispatch-open-close.js";
  import { joinDescribedBy } from "../utils/field-status.js";
  import { clippedBy } from "../utils/fit-align.js";
  import { isPointerFocus } from "../utils/focus.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import { ignoreTooltipClicks } from "../utils/tooltip-clicks.js";
  import { closeOverControls } from "../utils/tooltip-cover.js";
  import { getTooltipGroup } from "../utils/tooltip-group.js";
  import { createTooltipHandoff } from "../utils/tooltip-handoff.js";
  import { uniqueId } from "../utils/unique-id.js";

  /**
   * Specify the tooltip text.
   * Alternatively, use the "tooltipChildren" slot.
   */
  export let tooltipText = "";

  /**
   * Set to `true` to open the tooltip.
   * @bindable writable
   */
  export let open = false;

  /**
   * Specify the icon to render.
   * @type {Icon | undefined}
   */
  export let icon = /** @type {Icon | undefined} */ (undefined);

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
   * Above and below the icon, `start` and `end` name inline sides, so they
   * swap under `dir="rtl"`.
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
   * Defaults to the enclosing `TooltipGroup`'s delay, or `100`, so the
   * pointer can move onto the tooltip.
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

  // Set for one open when the in-place tooltip turns out to be cut off by
  // a box around it (a scrolling panel, a DataTable): it shows in a portal
  // instead. Only when `portalTooltip` is left unset.
  let portalWhenClipped = false;
  $: if (!open) portalWhenClipped = false;

  $: effectivePortalTooltip =
    portalTooltip === undefined
      ? !!insideModal || portalWhenClipped
      : portalTooltip;

  /** @type {null | HTMLSpanElement} */
  let tooltipRef = null;

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

  $: inlineOpen =
    !effectivePortalTooltip && open && !disabled && !tooltipHidden;
  // The in-place tooltip is laid out while hidden, so it measures where it
  // shows. Measured after the update, so the swap lands before paint.
  $: if (inlineOpen) tick().then(portalIfClipped);

  function portalIfClipped() {
    if (portalTooltip !== undefined || !inlineOpen || !tooltipRef) return;
    if (clippedBy(tooltipRef)) portalWhenClipped = true;
  }

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

  function handleMouseleave() {
    if (clicked) return;
    if (effectivePortalTooltip) {
      tooltipHandoff.scheduleLeave(() => {
        hovered = false;
        if (!focused) hide();
      });
    } else {
      tooltipHandoff.scheduleLeave(hide);
    }
  }

  // The pointer moved onto a part of the tooltip that covers another
  // control: close at once, so the pointer and the next click reach that
  // control. Hidden as by Escape until the next pointer enter or focus.
  function handleTooltipCover() {
    tooltipHandoff.cancel();
    hidden = true;
    hide();
  }

  // Runs in the capture phase so a visible tooltip is dismissed before any
  // ancestor (e.g. a Modal) sees Escape, whether focus is on the trigger or
  // elsewhere. A second Escape, with nothing left to dismiss, still bubbles.
  function handleKeydown(event) {
    // Escape that cancels an IME composition is not a close.
    if (event.key !== "Escape" || isImeComposition(event)) return;
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
  use:ignoreTooltipClicks
  use:closeOverControls={{ onCover: handleTooltipCover }}
  use:dismiss={{
    enabled: open || portalOpen,
    type: "keydown",
    handler: handleKeydown,
    options: { capture: true },
  }}
  {disabled}
  type="button"
  class:bx--tooltip__trigger={true}
  class:bx--tooltip--portal-active={effectivePortalTooltip}
  class:bx--tooltip--a11y={!effectivePortalTooltip}
  class:bx--tooltip--visible={inlineOpen}
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
  aria-describedby={joinDescribedBy(
    describedBy,
    $$restProps["aria-describedby"],
  )}
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
        show();
      });
    } else {
      tooltipHandoff.scheduleEnter(show);
    }
  }}
  on:mouseleave
  on:mouseleave={handleMouseleave}
  on:focus
  on:focus={() => {
    if (disabled) return;
    // A click's focus leaves the tooltip to the pointer.
    if (isPointerFocus(ref)) return;
    // Focus shows the tooltip at once, without the fade-in. Focus the
    // library moved here itself, such as a modal's first focus, did not
    // ask for it: keep it hidden until the next pointer enter or focus.
    if (!tooltipHandoff.claimFocus(ref)) {
      hide();
      hidden = true;
      return;
    }
    hidden = false;
    if (effectivePortalTooltip) focused = true;
    show();
  }}
  on:blur
  on:blur={() => {
    if (effectivePortalTooltip) {
      focused = false;
      if (!hovered) hide();
    } else {
      hide();
    }
  }}
>
  {#if !effectivePortalTooltip}
    <span bind:this={tooltipRef} {id} class:bx--assistive-text={true}>
      <slot name="tooltipChildren"
        ><slot name="tooltipText">{tooltipText}</slot></slot
      >
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
    on:mouseenter={() => {
      // The pointer moved onto the tooltip: keep it open.
      if (portalOpen) tooltipHandoff.cancel();
    }}
    on:mouseleave={handleMouseleave}
    on:cover={handleTooltipCover}
  >
    <slot name="tooltipChildren"
      ><slot name="tooltipText">{tooltipText}</slot></slot
    >
  </PortalTooltip>
{/if}
