<script>
  /**
   * @template {import("../utils/icon-component.js").IconComponent} [Icon=any]
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
   * @type {Icon | undefined}
   */
  export let icon = /** @type {Icon | undefined} */ (undefined);

  /**
   * Specify the accessible label for an icon-only button.
   * Required when no default slot content is provided; also used as the
   * hover/focus tooltip text.
   * @type {string | undefined}
   */
  export let iconDescription = undefined;

  /** Set to `true` to disable this button */
  export let disabled = false;

  /**
   * Set the tooltip placement in floating-ui form: the side, then `start`
   * or `end` along it, as Popover's `align` takes. Above and below,
   * `start` and `end` name inline sides, so they swap under `dir="rtl"`.
   * When set, takes precedence over `tooltipPosition` and `tooltipAlignment`.
   * @type {"top" | "top-start" | "top-end" | "bottom" | "bottom-start" | "bottom-end" | "left" | "left-start" | "left-end" | "right" | "right-start" | "right-end" | undefined}
   */
  export let tooltipAlign = undefined;

  /**
   * Set the position of the portalled tooltip relative to the icon. Icon-only buttons only.
   * Defaults to `"bottom"` when the group is horizontal and `"right"` when
   * vertical, since a top/bottom tooltip would otherwise land on top of the
   * next stacked segment.
   * @deprecated use `tooltipAlign`
   * @type {"top" | "right" | "bottom" | "left" | undefined}
   */
  export let tooltipPosition = undefined;

  /**
   * Set the alignment of the portalled tooltip relative to the icon. Icon-only buttons only.
   * @deprecated use `tooltipAlign`
   * @type {"start" | "center" | "end"}
   */
  export let tooltipAlignment = "center";

  /**
   * Obtain a reference to the HTML element.
   * @type {HTMLButtonElement | null}
   * @bindable readonly
   */
  export let ref = null;

  import { afterUpdate, getContext, onMount } from "svelte";
  import { get, readable } from "svelte/store";
  import PortalTooltip from "../Portal/PortalTooltip.svelte";
  import { iconTooltipPortalGaps } from "../Portal/icon-tooltip-portal-gaps.js";
  import { createAnchoredTooltip } from "../utils/anchored-tooltip.js";
  import { noop } from "../utils/noop.js";
  import { tooltipPlacement } from "../utils/tooltip-align.js";
  import { getTooltipGroup } from "../utils/tooltip-group.js";

  // Standalone use (no ancestor `ToggleButtonGroup`) is undocumented but
  // must not throw; `pressed` just stays `false` and clicks are inert.
  const ctx = getContext("carbon:ToggleButtonGroup") ?? {
    selectedValues: readable(/** @type {Set<string | number>} */ (new Set())),
    disabled: readable(false),
    orientation: readable(
      /** @type {"horizontal" | "vertical"} */ ("horizontal"),
    ),
    tabStopElement: readable(/** @type {HTMLButtonElement | null} */ (null)),
    toggle: noop,
    claimInitialTabStop: () => false,
    notifyUnmount: noop,
  };
  const {
    selectedValues,
    disabled: groupDisabled,
    orientation: groupOrientation,
    tabStopElement,
    toggle,
    claimInitialTabStop,
    notifyUnmount,
  } = ctx;

  // Decided while initializing so the server HTML has a tab stop before the
  // group can measure its DOM; `$tabStopElement` takes over once it exists.
  const initialTabStop = claimInitialTabStop(
    value,
    disabled || get(groupDisabled),
  );

  $: hasIconOnly = (icon || $$slots.icon) && !$$slots.default;
  $: hasTooltipContent = hasIconOnly && Boolean(iconDescription);
  $: effectiveTooltipPosition =
    placedTooltipPosition ??
    ($groupOrientation === "vertical" ? "right" : "bottom");
  $: pressed = $selectedValues.has(value);
  $: isDisabled = disabled || $groupDisabled;
  $: isTabStop =
    $tabStopElement === null
      ? initialTabStop && !isDisabled
      : $tabStopElement === ref;
  // Only the anchor-to-tooltip gap fields are used below, not the
  // left/right alignment-offset fields this same utility also returns:
  // those exist to nudge the caret onto Button/CopyButton/CodeSnippet's
  // icon within their own padded button box, and don't apply to this
  // component's icon-only cell (icon centered in a plain square, no
  // asymmetric padding to correct for) - carrying them over made a
  // `tooltipAlignment="end"` tooltip overshoot the anchor's edge by 1px.
  $: portalGaps = iconTooltipPortalGaps(
    effectiveTooltipPosition,
    effectiveTooltipAlignment,
  );

  // Portalled (not CSS `:hover`/`:focus`) so it can't be clipped by an
  // overflow ancestor and never shares the flush-adjacent trigger's local
  // stacking context. Hover, focus and Escape work as for an icon-only
  // Switch.
  const tooltip = createAnchoredTooltip({
    group: getTooltipGroup(),
    enabled: () => hasTooltipContent && !isDisabled,
    dismissOnClick: false,
  });
  const { open: tooltipOpen } = tooltip;

  let detachTooltip = noop;

  $: {
    detachTooltip();
    detachTooltip = ref ? tooltip.attach(ref) : noop;
  }

  $: if (!hasTooltipContent || isDisabled) tooltip.hide();

  function handleClick() {
    if (isDisabled) return;
    toggle(value);
  }

  // Disabling the tab-stop button after mount doesn't re-run the group's own
  // `afterUpdate` on Svelte 5 (same slot-update limitation as
  // `notifyUnmount`), so hand the tab stop off from here.
  afterUpdate(() => {
    if (isDisabled && get(tabStopElement) === ref) notifyUnmount(ref);
  });

  onMount(() => {
    return () => {
      detachTooltip();
      tooltip.destroy();
      notifyUnmount(ref);
    };
  });

  $: ({
    position: placedTooltipPosition,
    alignment: effectiveTooltipAlignment,
  } = tooltipPlacement(tooltipAlign, tooltipPosition, tooltipAlignment));
</script>

<button
  bind:this={ref}
  type="button"
  aria-pressed={pressed ? "true" : "false"}
  aria-label={hasIconOnly ? iconDescription : undefined}
  disabled={isDisabled || undefined}
  tabindex={isTabStop ? 0 : -1}
  class:bx--toggle-button={true}
  class:bx--toggle-button--pressed={pressed}
  class:bx--toggle-button--icon-only={hasIconOnly}
  {...$$restProps}
  on:click
  on:click={handleClick}
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:focus
  on:blur
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
    open={$tooltipOpen}
    text={iconDescription}
    tooltipType="icon"
    intrinsicAlign={effectiveTooltipAlignment}
    horizontalGapLeft={portalGaps.horizontalGapLeft}
    horizontalGapRight={portalGaps.horizontalGapRight}
    gapTop={portalGaps.gapTop}
    gapBottom={portalGaps.gapBottom}
    on:mouseenter={tooltip.handleTooltipMouseenter}
    on:mouseleave={tooltip.handleTooltipMouseleave}
    on:cover={tooltip.handleTooltipCover}
  />
{/if}
