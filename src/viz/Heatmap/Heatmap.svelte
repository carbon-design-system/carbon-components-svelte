<svelte:options immutable />

<script>
  /**
   * @template T
   */

  /**
   * @event {{ cell: import("../utils/heat-grid.js").HeatCell<T>; originalEvent: Event }} select Fires when a cell is activated by click or keyboard. Requires `selectable`.
   */

  /**
   * @slot {{ cell: import("../utils/heat-grid.js").HeatCell<T>; formattedValue: string }} cell
   */

  /** @restProps {figure} */

  /**
   * Specify the rows. Rows that land on the same cell are summed.
   * @type {ReadonlyArray<T>}
   */
  export let data = [];

  /**
   * Specify how to read the column from a row: a key or a function.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let x;

  /**
   * Specify how to read the row from a row of data: a key or a function.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let y;

  /**
   * Specify how to read the value from a row: a key or a function.
   * @type {import("../utils/accessor.js").Accessor<T, number | null | undefined>}
   */
  export let value;

  /**
   * Specify the column order. Defaults to first-seen order.
   * @type {ReadonlyArray<string | number>}
   */
  export let xOrder = undefined;

  /**
   * Specify the row order. Defaults to first-seen order.
   * @type {ReadonlyArray<string | number>}
   */
  export let yOrder = undefined;

  /** Specify the title, shown as the table caption */
  export let title = "";

  /**
   * Specify the palette: a sequential hue, or a diverging palette, which is
   * centered on the middle of the domain.
   * @type {import("../utils/heat-grid.js").HeatPalette}
   */
  export let palette = "blue";

  /**
   * Specify the values at the ends of the ramp.
   * Defaults to the extent of the cell values.
   * @type {readonly [number, number]}
   */
  export let domain = undefined;

  /** Set to `true` to write each value in its cell */
  export let cellLabels = false;

  /** Set to `false` to hide the legend */
  export let legend = true;

  /**
   * Specify how values are written: `Intl.NumberFormat` options or a function.
   * @type {import("../utils/format-compact.js").NumberFormat}
   */
  export let format = undefined;

  /**
   * Specify the size of a cell.
   * @type {"sm" | "md" | "lg"}
   */
  export let size = "md";

  /** Set to `true` to make cells selectable */
  export let selectable = false;

  /**
   * Specify the selected cell.
   * @type {{ row: string; column: string } | null}
   */
  export let selected = null;

  /** Specify the header of the corner cell, which names the rows */
  export let rowHeader = "";

  /**
   * Specify the locale.
   * @type {string}
   */
  export let locale = undefined;

  /**
   * Obtain a reference to the HTML element.
   * @bindable readonly
   * @type {null | HTMLElement}
   */
  export let ref = null;

  import { createEventDispatcher } from "svelte";
  import { toAccessor } from "../utils/accessor.js";
  import { resolveFormat } from "../utils/format-compact.js";
  import { gridStep } from "../utils/grid-step.js";
  import { buildHeatGrid, heatColor } from "../utils/heat-grid.js";

  const dispatch = createEventDispatcher();
  const LEGEND_STEPS = [0, 0.25, 0.5, 0.75, 1];

  /** Which cell holds the tab stop while `selectable`. */
  let focused = { r: 0, c: 0 };

  $: xOf = toAccessor(x);
  $: yOf = toAccessor(y);
  $: valueOf = toAccessor(value);
  $: grid = buildHeatGrid(data, {
    x: xOf,
    y: yOf,
    value: valueOf,
    xOrder,
    yOrder,
    domain,
    palette,
  });
  $: formatValue = resolveFormat(format, locale);
  $: ramp = LEGEND_STEPS.map(
    (t) =>
      heatColor(
        grid.domain[0] + (grid.domain[1] - grid.domain[0]) * t,
        grid.domain,
        palette,
      ).color,
  );
  $: tabStop = firstCell(grid, focused);

  /**
   * The focused cell if it still exists, or else the first filled one.
   * @param {typeof grid} current
   * @param {{ r: number; c: number }} at
   */
  function firstCell(current, at) {
    if (current.rows[at.r]?.cells[at.c]) return at;
    for (const row of current.rows) {
      const c = row.cells.findIndex((cell) => cell !== null);
      if (c >= 0) return { r: row.index, c };
    }
    return at;
  }

  /**
   * @param {import("../utils/heat-grid.js").HeatCell<T>} cell
   * @param {Event} originalEvent
   */
  function select(cell, originalEvent) {
    const same =
      selected && selected.row === cell.row && selected.column === cell.column;
    selected = same ? null : { row: cell.row, column: cell.column };
    dispatch("select", { cell, originalEvent });
  }

  /**
   * Arrow keys move through the grid, skipping empty cells.
   * @param {KeyboardEvent} event
   */
  function onKeydown(event) {
    const next = gridStep(
      event.key,
      [tabStop.r, tabStop.c],
      [grid.rows.length, grid.columns.length],
      (r, c) => grid.rows[r].cells[c] !== null,
    );
    if (!next || !ref) return;
    event.preventDefault();
    focused = { r: next[0], c: next[1] };
    /** @type {HTMLElement | null} */
    const node = ref.querySelector(`[data-cell="${next[0]}:${next[1]}"]`);
    node?.focus();
  }
</script>

<figure
  bind:this={ref}
  class:bx--viz-heatmap={true}
  class:bx--viz-heatmap--sm={size === "sm"}
  class:bx--viz-heatmap--lg={size === "lg"}
  class:bx--viz-heatmap--selectable={selectable}
  {...$$restProps}
>
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <table
    class:bx--viz-heatmap__table={true}
    on:keydown={selectable ? onKeydown : undefined}
  >
    {#if title}
      <caption class:bx--viz-chart__title={true}>
        {title}
      </caption>
    {/if}
    <thead>
      <tr>
        {#if rowHeader}
          <th scope="col" class:bx--viz-heatmap__corner={true}>{rowHeader}</th>
        {:else}
          <td></td>
        {/if}
        {#each grid.columns as column (column)}
          <th scope="col" class:bx--viz-heatmap__column={true}>{column}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each grid.rows as row (row.key)}
        <tr>
          <th scope="row" class:bx--viz-heatmap__row={true}>{row.key}</th>
          {#each row.cells as cell, c (grid.columns[c])}
            {#if cell}
              {@const formattedValue = formatValue(cell.value)}
              {@const pressed =
                selected !== null &&
                selected.row === cell.row &&
                selected.column === cell.column}
              <td
                class:bx--viz-heatmap__cell={true}
                class:bx--viz-heatmap__cell--selected={selectable && pressed}
                style:--bx-viz-color={cell.color}
                style:--bx-viz-text-color={cell.textColor}
              >
                {#if selectable}
                  <button
                    type="button"
                    class:bx--viz-heatmap__button={true}
                    data-cell="{row.index}:{c}"
                    tabindex={tabStop.r === row.index && tabStop.c === c
                      ? 0
                      : -1}
                    aria-pressed={pressed}
                    on:click={(event) => select(cell, event)}
                    on:focus={() => (focused = { r: row.index, c })}
                  >
                    <span class:bx--visually-hidden={!cellLabels}>
                      <slot name="cell" {cell} {formattedValue}>
                        {formattedValue}
                      </slot>
                    </span>
                  </button>
                {:else}
                  <span class:bx--visually-hidden={!cellLabels}>
                    <slot name="cell" {cell} {formattedValue}>
                      {formattedValue}
                    </slot>
                  </span>
                {/if}
              </td>
            {:else}
              <td class:bx--viz-heatmap__cell--empty={true}></td>
            {/if}
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
  {#if legend && grid.rows.length > 0}
    <div class:bx--viz-heatmap__legend={true} aria-hidden="true">
      <span>{formatValue(grid.domain[0])}</span>
      <span class:bx--viz-heatmap__ramp={true}>
        {#each ramp as color, i (i)}
          <span style:--bx-viz-color={color}></span>
        {/each}
      </span>
      <span>{formatValue(grid.domain[1])}</span>
    </div>
  {/if}
</figure>
