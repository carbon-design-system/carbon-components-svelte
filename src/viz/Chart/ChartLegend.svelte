<svelte:options immutable />

<script>
  /** @restProps {div} */

  /** Specify the accessible name of the legend */
  export let label = "Series";

  /** Set to `true` to show the legend even for a single series */
  export let showSingle = false;

  /**
   * Specify how many items show before the rest fold behind a "more"
   * button, so a long legend does not take the plot's height in a narrow
   * container.
   */
  export let maxItems = 8;

  /**
   * Specify the label of the button that unfolds the rest.
   * @type {(count: number) => string}
   */
  export let moreLabel = (count) => `+${count} more`;

  /** Specify the label of the button that folds the legend again */
  export let lessLabel = "Show less";

  /**
   * Specify the series to list, in order. By default every series is listed.
   * @type {ReadonlyArray<string | number> | undefined}
   */
  export let series = undefined;

  let expanded = false;
  $: listed =
    series === undefined
      ? $groups
      : series.flatMap((key) => {
          const group = $groups.find((g) => String(g.key) === String(key));
          return group ? [group] : [];
        });
  $: shown = expanded ? listed : listed.slice(0, maxItems);
  $: folded = listed.length - shown.length;

  import { getContext } from "svelte";
  import { CHART_CONTEXT } from "./context.js";

  /** @type {import("./context.js").ChartContext} */
  const { groups, state, toggleSeries, isolateSeries } =
    getContext(CHART_CONTEXT);
</script>

<!-- While the chart loads or is empty the row stays, so the plot does not
     move when the series arrive. -->
{#if listed.length > 1 ||
  (showSingle && listed.length === 1) ||
  ($state !== "ready" && listed.length === 0)}
  <div
    class:bx--viz-legend={true}
    class:bx--viz-legend--placeholder={listed.length === 0}
    role="group"
    aria-label={label}
    {...$$restProps}
  >
    {#each shown as group (group.key)}
      <button
        type="button"
        class:bx--viz-legend__item={true}
        class:bx--viz-legend__item--hidden={group.hidden}
        aria-pressed={!group.hidden}
        style:--bx-viz-color={group.color}
        on:click={(event) =>
          event.altKey ? isolateSeries(group.key) : toggleSeries(group.key)}
      >
        <span class:bx--viz-legend__swatch={true}></span>
        <slot series={group.key} hidden={group.hidden}>{group.key}</slot>
      </button>
    {/each}
    {#if folded > 0 || expanded}
      <button
        type="button"
        class:bx--viz-legend__item={true}
        class:bx--viz-legend__more={true}
        aria-expanded={expanded}
        on:click={() => {
          expanded = !expanded;
        }}
      >
        {expanded ? lessLabel : moreLabel(folded)}
      </button>
    {/if}
  </div>
{/if}
