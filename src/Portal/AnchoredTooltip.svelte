<script>
  /**
   * Internal. An icon-style tooltip anchored to an element, shown on hover
   * and focus and hidden by Escape. It renders in a portal, so a clipping
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

  import { onMount } from "svelte";
  import { createAnchoredTooltip } from "../utils/anchored-tooltip.js";
  import { dismiss } from "../utils/dismiss.js";
  import { noop } from "../utils/noop.js";
  import { getTooltipGroup } from "../utils/tooltip-group.js";
  import { iconTooltipPortalGaps } from "./icon-tooltip-portal-gaps.js";
  import PortalTooltip from "./PortalTooltip.svelte";

  const tooltip = createAnchoredTooltip({
    group: getTooltipGroup(),
    enabled: () => enabled,
    passEscapeWhenFocused,
  });
  const { open } = tooltip;

  let detach = noop;

  $: {
    detach();
    detach = anchor ? tooltip.attach(anchor) : noop;
  }

  $: if (!enabled) tooltip.hide();

  // `window` capture, as `TooltipIcon` does, so a tooltip opened by hover
  // hides even while focus is elsewhere.
  const escapeListener = dismiss(null, {
    enabled: false,
    type: "keydown",
    handler: tooltip.handleKeydown,
    options: { capture: true },
  });

  $: escapeListener.update({
    enabled: $open,
    type: "keydown",
    handler: tooltip.handleKeydown,
    options: { capture: true },
  });

  $: gaps = iconTooltipPortalGaps(direction, align);

  onMount(() => {
    return () => {
      detach();
      escapeListener.destroy();
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
/>
