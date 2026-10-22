<svelte:options immutable />

<script>
  /** @restProps {div} */

  /**
   * Override the header of the x column.
   * Defaults to the chart's `xHeader`.
   * @type {string}
   */
  export let xHeader = undefined;

  /** Specify the text shown in place of a missing value */
  export let emptyText = "–";

  import { getContext } from "svelte";
  import { CHART_CONTEXT } from "./context.js";
  import { buildTableRows } from "./table-rows.js";

  /** @type {import("./context.js").ChartContext} */
  const {
    groups,
    scales,
    title,
    xHeader: chartXHeader,
  } = getContext(CHART_CONTEXT);

  $: table = buildTableRows($groups);
  // A series on the secondary axis is written in that axis's format.
  $: secondaryKeys = new Set(
    $groups.filter((group) => group.axis === "y2").map((group) => group.key),
  );
</script>

<!-- Focusable so a keyboard can scroll a table taller than the chart. -->
<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<div
  class:bx--viz-data-table={true}
  role="region"
  aria-label={$title ? `${$title}, data table` : "Data table"}
  tabindex="0"
  {...$$restProps}
>
  <table class:bx--data-table={true} class:bx--data-table--short={true}>
    <thead>
      <tr>
        <th scope="col">
          <div class:bx--table-header-label={true}>
            {xHeader ?? $chartXHeader}
          </div>
        </th>
        {#each table.series as key (key)}
          <th scope="col" class:bx--viz-data-table__number={true}>
            <div class:bx--table-header-label={true}>{key}</div>
          </th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each table.rows as row (row.x)}
        <tr>
          <th scope="row">{$scales.xLabel(row.x)}</th>
          {#each row.values as value, i (table.series[i])}
            <td class:bx--viz-data-table__number={true}>
              {value !== undefined && Number.isFinite(value)
                ? (secondaryKeys.has(table.series[i])
                    ? $scales.y2Format
                    : $scales.yFormat)(value)
                : emptyText}
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>
