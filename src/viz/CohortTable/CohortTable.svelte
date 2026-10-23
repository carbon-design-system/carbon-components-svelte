<svelte:options immutable />

<script>
  /**
   * @typedef {{ id: string | number; label: string; size?: number; values: ReadonlyArray<number | null | undefined> }} Cohort
   */

  /**
   * @event {{ cohort: Cohort; period: number; value: number; originalEvent: Event }} select Fires when a cell is activated by click or keyboard. Requires `selectable`.
   */

  /** @restProps {figure} */

  /**
   * Specify the cohorts, oldest first. `values` holds one entry per period
   * since the cohort began, so later cohorts have fewer.
   * @type {ReadonlyArray<Cohort>}
   */
  export let rows = [];

  /** Specify the title, shown as the table caption */
  export let title = "";

  /** Specify the header of the cohort column */
  export let cohortHeader = "Cohort";

  /** Specify the header of the size column, shown when any cohort has a `size` */
  export let sizeHeader = "Size";

  /**
   * Specify the period column headers: a prefix, as in `"M"` for M0 and M1,
   * or a function of the period index.
   * @type {string | ((period: number) => string)}
   */
  export let periodLabel = "M";

  /**
   * Specify how values are written: `Intl.NumberFormat` options or a function.
   * Defaults to a whole percentage.
   * @type {import("../utils/format-compact.js").NumberFormat}
   */
  export let format = undefined;

  /**
   * Specify the hue of the sequential ramp.
   * @type {import("../utils/tokens.js").VizSequentialHue}
   */
  export let hue = "blue";

  /**
   * Specify the values at the ends of the ramp.
   * @type {readonly [number, number]}
   */
  export let domain = [0, 1];

  /**
   * Specify the summary row. `"average"` is the mean of each period over the
   * cohorts that reached it, weighted by `size` when every cohort has one.
   * @type {"none" | "average"}
   */
  export let summary = "none";

  /** Specify the label of the summary row */
  export let summaryLabel = "Average";

  /** Set to `true` to make cells selectable */
  export let selectable = false;

  /**
   * Specify the selected cell.
   * @type {{ id: string | number; period: number } | null}
   */
  export let selected = null;

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
  import { getNumberFormatter } from "../../utils/intl-formatter-cache.js";
  import { formatPercent, resolveFormat } from "../utils/format-compact.js";
  import { gridStep } from "../utils/grid-step.js";
  import { heatColor } from "../utils/heat-grid.js";

  const dispatch = createEventDispatcher();

  let focused = { r: 0, c: 0 };

  $: periods = rows.reduce((most, row) => Math.max(most, row.values.length), 0);
  $: hasSize = rows.some((row) => typeof row.size === "number");
  $: write = format
    ? resolveFormat(format, locale)
    : (/** @type {number} */ v) => formatPercent(v, { locale, digits: 0 });
  $: writeSize = getNumberFormatter(locale, {});
  $: header =
    typeof periodLabel === "function"
      ? periodLabel
      : (/** @type {number} */ period) => `${periodLabel}${period}`;
  $: averages = summary === "average" ? average(rows, periods) : [];
  $: tabStop = has(focused.r, focused.c) ? focused : { r: 0, c: 0 };

  /** @param {number | null | undefined} v */
  function finite(v) {
    return typeof v === "number" && Number.isFinite(v);
  }

  /**
   * @param {number} r
   * @param {number} c
   */
  function has(r, c) {
    return finite(rows[r]?.values[c]);
  }

  /**
   * @param {ReadonlyArray<Cohort>} list
   * @param {number} count
   * @returns {Array<number | null>}
   */
  function average(list, count) {
    const weighted = list.every(
      (row) => typeof row.size === "number" && row.size > 0,
    );
    return Array.from({ length: count }, (_, period) => {
      let sum = 0;
      let weight = 0;
      for (const row of list) {
        const v = row.values[period];
        if (typeof v !== "number" || !Number.isFinite(v)) continue;
        const w = weighted ? /** @type {number} */ (row.size) : 1;
        sum += v * w;
        weight += w;
      }
      return weight > 0 ? sum / weight : null;
    });
  }

  /**
   * @param {Cohort} cohort
   * @param {number} period
   * @param {Event} originalEvent
   */
  function select(cohort, period, originalEvent) {
    const same =
      selected && selected.id === cohort.id && selected.period === period;
    selected = same ? null : { id: cohort.id, period };
    dispatch("select", {
      cohort,
      period,
      value: /** @type {number} */ (cohort.values[period]),
      originalEvent,
    });
  }

  /** @param {KeyboardEvent} event */
  function onKeydown(event) {
    const next = gridStep(
      event.key,
      [tabStop.r, tabStop.c],
      [rows.length, periods],
      has,
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
  class:bx--viz-cohort={true}
  class:bx--viz-cohort--selectable={selectable}
  {...$$restProps}
>
  <div class:bx--viz-cohort__scroll={true}>
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <table
      class:bx--viz-cohort__table={true}
      on:keydown={selectable ? onKeydown : undefined}
    >
      {#if title}
        <caption class:bx--viz-chart__title={true}>
          {title}
        </caption>
      {/if}
      <thead>
        <tr>
          <th scope="col" class:bx--viz-cohort__label={true}>{cohortHeader}</th>
          {#if hasSize}
            <th scope="col" class:bx--viz-cohort__size={true}>{sizeHeader}</th>
          {/if}
          {#each { length: periods } as _, period (period)}
            <th scope="col" class:bx--viz-cohort__period={true}>
              {header(period)}
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each rows as row, r (row.id)}
          <tr>
            <th scope="row" class:bx--viz-cohort__label={true}>{row.label}</th>
            {#if hasSize}
              <td class:bx--viz-cohort__size={true}>
                {typeof row.size === "number" ? writeSize.format(row.size) : ""}
              </td>
            {/if}
            {#each { length: periods } as _, period (period)}
              {@const v = row.values[period]}
              {#if typeof v === "number" && Number.isFinite(v)}
                {@const colors = heatColor(v, domain, hue)}
                {@const pressed =
                  selected !== null &&
                  selected.id === row.id &&
                  selected.period === period}
                <td
                  class:bx--viz-cohort__cell={true}
                  class:bx--viz-cohort__cell--selected={selectable && pressed}
                  style:--bx-viz-color={colors.color}
                  style:--bx-viz-text-color={colors.textColor}
                >
                  {#if selectable}
                    <button
                      type="button"
                      class:bx--viz-cohort__button={true}
                      data-cell="{r}:{period}"
                      tabindex={tabStop.r === r && tabStop.c === period
                        ? 0
                        : -1}
                      aria-pressed={pressed}
                      on:click={(event) => select(row, period, event)}
                      on:focus={() => (focused = { r, c: period })}
                    >
                      {write(v)}
                    </button>
                  {:else}
                    {write(v)}
                  {/if}
                </td>
              {:else}
                <td></td>
              {/if}
            {/each}
          </tr>
        {/each}
      </tbody>
      {#if summary === "average" && rows.length > 0}
        <tfoot>
          <tr>
            <th scope="row" class:bx--viz-cohort__label={true}>
              {summaryLabel}
            </th>
            {#if hasSize}
              <td></td>
            {/if}
            {#each averages as v, period (period)}
              <td class:bx--viz-cohort__summary={true}>
                {v === null ? "" : write(v)}
              </td>
            {/each}
          </tr>
        </tfoot>
      {/if}
    </table>
  </div>
</figure>
