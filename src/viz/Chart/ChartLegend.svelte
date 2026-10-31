<svelte:options immutable />

<script>
  /**
   * @slot {{ series: string | number; hidden: boolean }} - The text of an item: its series key by default.
   */

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

  import { getContext } from "svelte";
  import { CHART_CONTEXT } from "./context.js";
  import { patternTile, symbolPath } from "./shapes.js";

  /** @type {import("./context.js").ChartContext} */
  // `state` is destructured under another name: `$state` reads as the rune to Biome.
  const {
    groups,
    state: chartState,
    toggleSeries,
    isolateSeries,
    emphasis,
    shapes,
  } = getContext(CHART_CONTEXT);

  let expanded = false;
  // A ghost series, as a prior period is, rides on its base's entry.
  $: listed =
    series === undefined
      ? $groups.filter((group) => group.ghost === undefined)
      : series.flatMap((key) => {
          const group = $groups.find((g) => String(g.key) === String(key));
          return group ? [group] : [];
        });
  $: shown = expanded ? listed : listed.slice(0, maxItems);
  $: folded = listed.length - shown.length;
  $: ready = $chartState === "ready";
</script>

<!-- While the chart loads or is empty the row stays, so the plot does not
     move when the series arrive. -->
{#if listed.length > 1 ||
  (showSingle && listed.length === 1) ||
  (!ready && listed.length === 0)}
  <div
    class:bx--viz-legend={true}
    class:bx--viz-legend--placeholder={listed.length === 0}
    role="group"
    aria-label={label}
    {...$$restProps}
  >
    {#each shown as group (group.key)}
      {@const shape = $shapes.get(group.key)}
      <button
        type="button"
        class:bx--viz-legend__item={true}
        class:bx--viz-legend__item--hidden={group.hidden}
        aria-pressed={!group.hidden}
        style:--bx-viz-color={group.color}
        on:click={(event) =>
          event.altKey ? isolateSeries(group.key) : toggleSeries(group.key)}
        on:mouseenter={() => emphasis.set(group.key)}
        on:mouseleave={() => emphasis.set(null)}
        on:focus={() => emphasis.set(group.key)}
        on:blur={() => emphasis.set(null)}
      >
        {#if shape?.symbol && shape.symbol !== "circle"}
          <svg
            class:bx--viz-legend__swatch={true}
            class:bx--viz-legend__swatch--shape={true}
            viewBox="-7 -7 14 14"
            aria-hidden="true"
          >
            <path
              class:bx--viz-legend__symbol={true}
              d={symbolPath(shape.symbol, 5)}
            />
          </svg>
        {:else if shape?.pattern && shape.pattern !== "solid"}
          {@const tile = patternTile(shape.pattern)}
          <svg
            class:bx--viz-legend__swatch={true}
            class:bx--viz-legend__swatch--shape={true}
            viewBox="0 0 12 12"
            aria-hidden="true"
          >
            <rect class:bx--viz-pattern__tint={true} width="12" height="12" />
            {#each [
              [0, 0],
              [6, 0],
              [0, 6],
              [6, 6],
            ] as [dx, dy] (`${dx},${dy}`)}
              <path
                class:bx--viz-pattern__stroke={true}
                class:bx--viz-pattern__stroke--dots={tile.dots}
                d={tile.d}
                transform="translate({dx} {dy})"
              />
            {/each}
          </svg>
        {:else}
          <span class:bx--viz-legend__swatch={true}></span>
        {/if}
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
