<script>
  /**
   * @template [Icon=any]
   */

  /**
   * @restProps {button}
   * @slot {{}} icon
   */

  /**
   * Specify the value used to identify this button in the group's `selected` array.
   * @type {string | number}
   */
  export let value = "";

  /**
   * Specify the icon to render.
   * Alternatively, use the named slot "icon".
   * @type {Icon}
   */
  export let icon = /** @type {Icon} */ (undefined);

  /**
   * Specify the accessible label for an icon-only button.
   * Required when no default slot content is provided; also used as the
   * hover/focus tooltip text.
   * @type {string}
   */
  export let iconDescription = undefined;

  /** Set to `true` to disable this button */
  export let disabled = false;

  /**
   * Set the position of the portalled tooltip relative to the icon. Icon-only buttons only.
   * Defaults to `"bottom"` when the group is horizontal and `"right"` when
   * vertical, since a top/bottom tooltip would otherwise land on top of the
   * next stacked segment.
   * @type {"top" | "right" | "bottom" | "left" | undefined}
   */
  export let tooltipPosition = undefined;

  /**
   * Set the alignment of the portalled tooltip relative to the icon. Icon-only buttons only.
   * @type {"start" | "center" | "end"}
   */
  export let tooltipAlignment = "center";

  /**
   * Obtain a reference to the HTML element.
   * @type {HTMLButtonElement | null}
   * @bindable readonly
   */
  export let ref = null;

  import { getContext, onMount } from "svelte";
  import { get, readable, writable } from "svelte/store";
  import {
    TOOLTIP_ENTER_DELAY_MS,
    TOOLTIP_LEAVE_DELAY_MS,
  } from "../constants/timing.js";
  import { iconTooltipPortalGaps } from "../Portal/icon-tooltip-portal-gaps.js";
  import PortalTooltip from "../Portal/PortalTooltip.svelte";
  import { createDelayedSetter } from "../utils/delayed-setter.js";
  import { noop } from "../utils/noop.js";

  // Standalone use (no ancestor `ToggleButtonGroup`) is undocumented but
  // must not throw; `pressed` just stays `false` and clicks are inert.
  const ctx = getContext("carbon:ToggleButtonGroup") ?? {
    selectedValues: readable(/** @type {Set<string | number>} */ (new Set())),
    disabled: readable(false),
    orientation: readable(
      /** @type {"horizontal" | "vertical"} */ ("horizontal"),
    ),
    tabStopElement: readable(/** @type {HTMLButtonElement | null} */ (null)),
    activeTooltip: writable(/** @type {string | number | null} */ (null)),
    toggle: noop,
    notifyUnmount: noop,
  };
  const {
    selectedValues,
    disabled: groupDisabled,
    orientation: groupOrientation,
    tabStopElement,
    activeTooltip,
    toggle,
    notifyUnmount,
  } = ctx;

  $: hasIconOnly = (icon || $$slots.icon) && !$$slots.default;
  $: hasTooltipContent = hasIconOnly && Boolean(iconDescription);
  $: effectiveTooltipPosition =
    tooltipPosition ?? ($groupOrientation === "vertical" ? "right" : "bottom");
  $: pressed = $selectedValues.has(value);
  $: isDisabled = disabled || $groupDisabled;
  $: isTabStop = $tabStopElement !== null && $tabStopElement === ref;
  // Only the anchor-to-tooltip gap fields are used below, not the
  // left/right alignment-offset fields this same utility also returns:
  // those exist to nudge the caret onto Button/CopyButton/CodeSnippet's
  // icon within their own padded button box, and don't apply to this
  // component's icon-only cell (icon centered in a plain square, no
  // asymmetric padding to correct for) - carrying them over made a
  // `tooltipAlignment="end"` tooltip overshoot the anchor's edge by 1px.
  $: portalGaps = iconTooltipPortalGaps(
    effectiveTooltipPosition,
    tooltipAlignment,
  );

  // Portalled (not CSS `:hover`/`:focus`) so it can't be clipped by an
  // overflow ancestor and never shares the flush-adjacent trigger's local
  // stacking context - same technique ContentSwitcher's icon-only Switch
  // uses, including the shared `activeTooltip` claim (only one segment's
  // tooltip shows at a time) and the warm-handoff delay skip.
  let hovered = false;
  let focused = false;
  const scheduleTooltip = createDelayedSetter();

  $: tooltipOpen =
    hasTooltipContent &&
    !isDisabled &&
    (hovered || focused) &&
    $activeTooltip === value;

  function claim() {
    activeTooltip.set(value);
  }

  function release() {
    if (!hovered && !focused && get(activeTooltip) === value) {
      activeTooltip.set(null);
    }
  }

  function reveal() {
    hovered = true;
    claim();
  }

  function showTooltip() {
    // Skip the enter delay when another tooltip is already open (warm handoff).
    const warmHandoff =
      get(activeTooltip) !== null && get(activeTooltip) !== value;
    scheduleTooltip(warmHandoff ? 0 : TOOLTIP_ENTER_DELAY_MS, reveal);
  }

  function hideTooltip() {
    scheduleTooltip(TOOLTIP_LEAVE_DELAY_MS, () => {
      hovered = false;
      release();
    });
  }

  function handleMouseenter() {
    if (hasTooltipContent) showTooltip();
  }

  function handleMouseleave() {
    if (hasTooltipContent) hideTooltip();
  }

  function handleFocus() {
    if (hasTooltipContent) {
      focused = true;
      claim();
    }
  }

  function handleBlur() {
    if (hasTooltipContent) {
      focused = false;
      release();
    }
  }

  function handleClick() {
    if (isDisabled) return;
    toggle(value);
  }

  onMount(() => {
    return () => {
      scheduleTooltip.cancel();
      if (get(activeTooltip) === value) activeTooltip.set(null);
      notifyUnmount(ref);
    };
  });
</script>

<button
  bind:this={ref}
  type="button"
  aria-pressed={pressed}
  aria-label={hasIconOnly ? iconDescription : undefined}
  disabled={isDisabled || undefined}
  tabindex={isTabStop ? "0" : "-1"}
  class:bx--toggle-button={true}
  class:bx--toggle-button--pressed={pressed}
  class:bx--toggle-button--icon-only={hasIconOnly}
  {...$$restProps}
  on:click
  on:click={handleClick}
  on:mouseover
  on:mouseenter
  on:mouseenter={handleMouseenter}
  on:mouseleave
  on:mouseleave={handleMouseleave}
  on:focus
  on:focus={handleFocus}
  on:blur
  on:blur={handleBlur}
>
  {#if $$slots.icon}
    <slot name="icon" />
  {:else if icon}
    <svelte:component
      this={icon}
      aria-hidden="true"
      class="bx--toggle-button__icon"
    />
  {/if}
  <slot />
</button>

{#if hasTooltipContent}
  <PortalTooltip
    anchor={ref}
    direction={effectiveTooltipPosition}
    open={tooltipOpen}
    text={iconDescription}
    tooltipType="icon"
    intrinsicAlign={tooltipAlignment}
    horizontalGapLeft={portalGaps.horizontalGapLeft}
    horizontalGapRight={portalGaps.horizontalGapRight}
    gapTop={portalGaps.gapTop}
    gapBottom={portalGaps.gapBottom}
  />
{/if}
