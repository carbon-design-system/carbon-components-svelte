<svelte:options immutable />

<script>
  /**
   * @template [T=any]
   */

  /**
   * @slot {{ facet: string; rows: T[]; index: number; yDomain: [number, number] | undefined; xDomain: [number, number] | undefined; syncId: string | undefined }}
   */

  /** @restProps {figure} */

  /**
   * Specify the rows. They are split by `facet`, one chart each.
   * @type {ReadonlyArray<T>}
   */
  export let data = [];

  /**
   * Specify how to read the facet from a row: a key or a function. Facets
   * keep first-seen order.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let facet;

  /**
   * Specify how to read the value from a row, for the shared y domain.
   * @type {import("../utils/accessor.js").Accessor<T, number | null | undefined>}
   */
  export let y = undefined;

  /**
   * Specify how to read the x from a row, for the shared x domain.
   * @type {import("../utils/accessor.js").Accessor<T, number | Date | null | undefined>}
   */
  export let x = undefined;

  /** Specify how many charts sit side by side. They wrap past that. */
  export let columns = 3;

  /** Set to `false` to let each chart pick its own y domain */
  export let sharedY = true;

  /** Set to `false` to let each chart pick its own x domain */
  export let sharedX = true;

  /** Set to `false` to let the shared y domain exclude zero */
  export let zero = true;

  /**
   * Set to `false` to stop hover from following across the charts.
   * Shared hover needs a shared x.
   */
  export let syncHover = true;

  /**
   * Specify where each chart's tooltip sits: in a corner of its plot that
   * the data leaves free, top left first, so the tooltips of a row line up
   * and cover nothing, or beside the hovered point as on a chart of its
   * own. A chart with no free corner follows the point.
   * @type {"fixed" | "follow"}
   */
  export let tooltipAlign = "fixed";

  /** Specify the title, shown as the caption */
  export let title = "";

  /**
   * Obtain a reference to the figure element.
   * @bindable readonly
   * @type {null | HTMLElement}
   */
  export let ref = null;

  import { setContext } from "svelte";
  import { writable } from "svelte/store";
  import { FACETS_CONTEXT } from "../Chart/context.js";
  import { groupBy, toAccessor } from "../utils/accessor.js";
  import { extentBy } from "../utils/extent.js";
  import { nextId } from "../utils/next-id.js";
  import { niceDomain } from "../utils/ticks.js";

  const syncId = nextId("bx--viz-facets");
  // The charts inside read how to place their tooltips.
  const tooltipAlignStore = writable(tooltipAlign);
  $: tooltipAlignStore.set(tooltipAlign);
  setContext(FACETS_CONTEXT, { tooltipAlign: tooltipAlignStore });

  $: facetOf = toAccessor(facet);
  $: yOf = y === undefined ? undefined : toAccessor(y);
  $: xOf = x === undefined ? undefined : toAccessor(x);
  $: facets = [...groupBy(data, facetOf)].map(([key, rows], index) => ({
    key: String(key),
    rows,
    index,
  }));
  // One scale for all, so a tall line in one chart is a tall line in every
  // chart, which is the point of small multiples.
  $: yDomain = sharedY && yOf ? shared(extentBy(data, yOf), zero) : undefined;
  $: xDomain = sharedX && xOf ? (extentBy(data, xOf) ?? undefined) : undefined;

  /**
   * @param {[number, number] | null} range
   * @param {boolean} includeZero
   * @returns {[number, number] | undefined}
   */
  function shared(range, includeZero) {
    if (!range) return undefined;
    const low = includeZero ? Math.min(0, range[0]) : range[0];
    const high = includeZero ? Math.max(0, range[1]) : range[1];
    return niceDomain(low, high);
  }
</script>

<figure bind:this={ref} class:bx--viz-facets={true} {...$$restProps}>
  {#if title}
    <figcaption class:bx--viz-chart__title={true}>{title}</figcaption>
  {/if}
  <div class:bx--viz-facets__grid={true} style:--bx-viz-columns={columns}>
    {#each facets as entry (entry.key)}
      <div class:bx--viz-facets__cell={true}>
        <slot
          facet={entry.key}
          rows={entry.rows}
          index={entry.index}
          {yDomain}
          {xDomain}
          syncId={syncHover ? syncId : undefined}
        />
      </div>
    {/each}
  </div>
</figure>
