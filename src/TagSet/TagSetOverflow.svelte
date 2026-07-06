<script>
  /**
   * Internal: the "+N" overflow indicator. Not exported from the package;
   * only `TagSet` ships. Hovering shows a tooltip (a comma-separated list of
   * the hidden labels by default, or custom content via the forwarded
   * `overflowTooltip` slot); clicking dispatches `trigger`.
   *
   * Always mounted (even when `count` is 0) so it stays measurable; visually
   * and functionally inert until there is something to show.
   *
   * @event {null} trigger - The indicator was clicked.
   * @slot {{ tags: import("./TagSet.svelte").TagSetItem[]; count: number }} tooltip - Override the tooltip content.
   */

  /**
   * Obtain a reference to the indicator's HTML element, so the parent can
   * measure its natural width for the fit calculation.
   * @bindable readonly
   * @type {null | HTMLElement}
   */
  export let triggerRef = null;

  /** @type {number} */
  export let count = 0;

  /** @type {import("./TagSet.svelte").TagSetItem[]} */
  export let tags = [];

  /** @type {"start" | "center" | "end"} */
  export let overflowAlign = "center";

  /** @type {"top" | "bottom"} */
  export let overflowDirection = "bottom";

  /** @type {"sm" | "default" | "lg" | undefined} */
  export let size = undefined;

  import { createEventDispatcher, setContext } from "svelte";
  import TooltipDefinition from "../TooltipDefinition/TooltipDefinition.svelte";

  // The indicator is presentational, not a registered group item — shadow
  // the context so it can't be mistaken for one.
  setContext("carbon:TagSet", undefined);

  const dispatch = createEventDispatcher();
</script>

<TooltipDefinition
  align={overflowAlign}
  direction={overflowDirection}
  class="bx--tag-set-overflow{count === 0
    ? ' bx--tag-set-overflow--empty'
    : ''}"
  on:click={() => dispatch("trigger")}
>
  <svelte:fragment slot="tooltip">
    <slot name="tooltip" {tags} {count} />
  </svelte:fragment>
  <span
    bind:this={triggerRef}
    class:bx--tag={true}
    class:bx--tag--interactive={true}
    class:bx--tag-set-overflow__popover-trigger={true}
    class:bx--tag--sm={size === "sm"}
    class:bx--tag--lg={size === "lg"}
  >
    +{count}
  </span>
</TooltipDefinition>
