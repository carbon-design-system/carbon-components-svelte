<svelte:options immutable />

<script>
  /**
   * @template {string | number} [Id=string]
   */

  /**
   * @extends {"../FunnelBars/FunnelBars.svelte"} FunnelBarsProps
   * @event {{ stage: import("../utils/funnel.js").FunnelStage<Id>; stats: import("../utils/funnel.js").FunnelStageStats; index: number }} select Fires when a stage is activated by click or keyboard. Requires `selectable`.
   * @event {{ stage: import("../utils/funnel.js").FunnelStage<Id>; stats: import("../utils/funnel.js").FunnelStageStats; index: number } | null} hover Fires when the pointer or focus enters a stage, and with `null` when it leaves. Requires `selectable`.
   * @event {{ count: number; domain: [number, number]; stats: { overallRate: number | null; largestDropIndex: number; total: number } }} update Fires after the stages change. Requires `emitUpdate`.
   */

  /**
   * Specify the stages, in order.
   * @type {ReadonlyArray<import("../utils/funnel.js").FunnelStage<Id>>}
   */
  export let stages = [];

  /** Specify the title, shown above the funnel and used as its accessible name */
  export let title = "";

  /**
   * Specify the shape. `"bars"` keeps centered bars with no slopes between them.
   * @type {"tapered" | "bars"}
   */
  export let shape = "tapered";

  /**
   * Specify which conversion rates to show.
   * @type {"none" | "step" | "overall" | "both"}
   */
  export let rate = "overall";

  /**
   * Specify the row size.
   * @type {"sm" | "md" | "lg"}
   */
  export let size = "lg";

  /**
   * Specify the selected stage id.
   * @type {Id | undefined}
   */
  export let selectedId = undefined;

  /**
   * Obtain a reference to the table element.
   * @bindable readonly
   * @type {null | HTMLTableElement}
   */
  export let ref = null;

  import FunnelBars from "../FunnelBars/FunnelBars.svelte";
</script>

<figure class:bx--viz-funnel-chart={true}>
  {#if title}
    <!-- The table caption carries the same title, with the overall conversion. -->
    <div class:bx--viz-chart__title={true} aria-hidden="true">{title}</div>
  {/if}
  <FunnelBars
    bind:selectedId
    bind:ref
    {...$$restProps}
    {stages}
    {shape}
    {rate}
    {size}
    label={title}
    align="center"
    on:select
    on:hover
    on:update
  />
</figure>
