<script>
  /**
   * Internal. An icon-style tooltip anchored to an element, shown on hover
   * and focus and hidden by Escape. It stays while the pointer is on it. It renders in a portal, so a clipping
   * container can't cut it off.
   */

  /**
   * Element that shows the tooltip on hover and focus.
   * @type {null | HTMLElement}
   */
  export let anchor = null;

  /** Specify the tooltip text. */
  export let text = "";

  /** Set to `false` to keep the tooltip closed. */
  export let enabled = true;

  /**
   * Set the direction of the tooltip relative to the anchor.
   * @type {"top" | "right" | "bottom" | "left"}
   */
  export let direction = "bottom";

  /**
   * Set the alignment of the tooltip relative to the anchor.
   * @type {"start" | "center" | "end"}
   */
  export let align = "center";

  /**
   * Set to `true` to let Escape reach a focused anchor's own handlers
   * after it hides the tooltip.
   */
  export let passEscapeWhenFocused = false;

  /** Set to `false` to keep the tooltip open when the anchor is activated. */
  export let dismissOnClick = true;

  import { onMount } from "svelte";
  import { createAnchoredTooltip } from "../utils/anchored-tooltip.js";
  import { noop } from "../utils/noop.js";
  import { getTooltipGroup } from "../utils/tooltip-group.js";
  import { iconTooltipPortalGaps } from "./icon-tooltip-portal-gaps.js";
  import PortalTooltip from "./PortalTooltip.svelte";

  const tooltip = createAnchoredTooltip({
    group: getTooltipGroup(),
    enabled: () => enabled,
    passEscapeWhenFocused,
    dismissOnClick,
  });
  const { open } = tooltip;

  let detach = noop;

  $: {
    detach();
    detach = anchor ? tooltip.attach(anchor) : noop;
  }

  $: if (!enabled) tooltip.hide();

  $: gaps = iconTooltipPortalGaps(direction, align);

  onMount(() => {
    return () => {
      detach();
      tooltip.destroy();
    };
  });
</script>

<PortalTooltip
  {anchor}
  {direction}
  open={enabled && $open}
  {text}
  tooltipType="icon"
  intrinsicAlign={align}
  {...gaps}
  on:mouseenter={tooltip.handleTooltipMouseenter}
  on:mouseleave={tooltip.handleTooltipMouseleave}
/>
