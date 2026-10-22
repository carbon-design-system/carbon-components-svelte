<svelte:options immutable />

<script>
  /**
   * @template {string | number} [Id=string]
   */

  /**
   * @event {{ funnel: { id: Id; label: string }; stage: import("../utils/funnel.js").FunnelRow<Id>; originalEvent: Event }} select Fires when a bar is activated by click or keyboard. Requires `selectable`.
   * @event {{ funnel: { id: Id; label: string }; stage: import("../utils/funnel.js").FunnelRow<Id> } | null} hover Fires when the pointer or focus enters a bar, and with `null` when it leaves. Requires `selectable`.
   */

  /** @restProps {table} */

  /**
   * Specify the funnels to compare, each with its stages. Stages are lined
   * up by `id` across funnels, in first-seen order.
   * @type {ReadonlyArray<{ id: Id; label: string; stages: ReadonlyArray<import("../utils/funnel.js").FunnelStage<Id>>; color?: import("../utils/tokens.js").VizColor }>}
   */
  export let funnels = [];

  /**
   * Specify the accessible name, used as the table caption.
   * Leave empty to mark the table as decorative.
   */
  export let label = "";

  /**
   * Specify what bars are scaled against. `"shared"` uses the largest
   * stage of any funnel, so bars compare across columns. `"independent"`
   * uses each funnel's own largest stage, so only the shapes compare.
   * @type {"shared" | "independent"}
   */
  export let scale = "shared";

  /**
   * Specify whether to close with each funnel's overall conversion.
   * @type {"overall" | "none"}
   */
  export let rate = "overall";

  /**
   * Specify how values are written: `Intl.NumberFormat` options or a function.
   * @type {import("../utils/format-compact.js").NumberFormat}
   */
  export let format = undefined;

  /**
   * Specify the bar color. A funnel's own `color` overrides it.
   * @type {import("../utils/tokens.js").VizColor}
   */
  export let color = "interactive";

  /**
   * Specify the size.
   * @type {"sm" | "md" | "lg"}
   */
  export let size = "md";

  /** Set to `true` to make bars selectable */
  export let selectable = false;

  /**
   * Specify the selected bar, by funnel and stage id.
   * @type {{ funnel: Id; stage: Id } | null}
   */
  export let selected = null;

  /**
   * Override the visually hidden column headers.
   * @type {{ stage?: string; value?: string; overall?: string }}
   */
  export let headerLabels = {};

  /**
   * Specify the locale.
   * @type {string}
   */
  export let locale = undefined;

  /**
   * Obtain a reference to the HTML element.
   * @bindable readonly
   * @type {null | HTMLTableElement}
   */
  export let ref = null;

  import { createEventDispatcher } from "svelte";
  import { rovingFocus } from "../../utils/roving-focus.js";
  import { formatPercent, resolveFormat } from "../utils/format-compact.js";
  import { getFunnelStats } from "../utils/funnel.js";
  import { VIZ_SEMANTIC_COLORS, vizColor } from "../utils/tokens.js";

  const dispatch = createEventDispatcher();

  let focusedIndex = 0;

  /** @param {import("../utils/tokens.js").VizColor | undefined} value */
  function inlineColor(value) {
    if (value === undefined || value === "interactive") return undefined;
    return VIZ_SEMANTIC_COLORS.includes(value)
      ? `var(--cds-viz-${value})`
      : vizColor(value);
  }

  $: columns = funnels.map((funnel) => ({
    id: funnel.id,
    label: funnel.label,
    color: inlineColor(funnel.color),
    stats: getFunnelStats(funnel.stages),
  }));
  $: largest = Math.max(0, ...columns.map((column) => column.stats.max));
  // Stages line up by id across funnels, in first-seen order.
  $: stageRows = lineUp(funnels);
  $: formatValue = resolveFormat(format, locale);
  $: percent = (/** @type {number | null} */ ratio) =>
    ratio === null ? "–" : formatPercent(ratio, { locale, digits: 0 });
  $: headers = {
    stage: "Stage",
    value: "Value",
    overall: "Overall conversion",
    ...headerLabels,
  };
  $: cells = stageRows.flatMap((row) =>
    columns.map((column) => {
      const stage = column.stats.rows.find(
        (entry) => entry.stage.id === row.id,
      );
      const denominator = scale === "shared" ? largest : column.stats.max;
      return {
        key: JSON.stringify([column.id, row.id]),
        column,
        row,
        stage: stage ?? null,
        pct:
          stage && denominator > 0
            ? (stage.stats.value / denominator) * 100
            : 0,
      };
    }),
  );
  $: tabStopIndex = Math.min(focusedIndex, Math.max(cells.length - 1, 0));
  // Named in the template, so a change of selection reaches every cell.
  $: selectedKey =
    selectable && selected !== null
      ? JSON.stringify([selected.funnel, selected.stage])
      : null;

  /** @param {typeof funnels} list */
  function lineUp(list) {
    /** @type {Array<{ id: Id; label: string }>} */
    const rows = [];
    for (const funnel of list) {
      for (const stage of funnel.stages) {
        if (!rows.some((row) => row.id === stage.id)) {
          rows.push({ id: stage.id, label: stage.label });
        }
      }
    }
    return rows;
  }

  /** @param {(typeof cells)[number] | null} cell */
  function emit(cell) {
    dispatch(
      "hover",
      cell?.stage
        ? {
            funnel: { id: cell.column.id, label: cell.column.label },
            stage: cell.stage,
          }
        : null,
    );
  }

  /**
   * @param {(typeof cells)[number]} cell
   * @param {Event} originalEvent
   */
  function select(cell, originalEvent) {
    if (!cell.stage) return;
    selected =
      cell.key === selectedKey
        ? null
        : { funnel: cell.column.id, stage: cell.row.id };
    focusedIndex = cells.indexOf(cell);
    dispatch("select", {
      funnel: { id: cell.column.id, label: cell.column.label },
      stage: cell.stage,
      originalEvent,
    });
  }

  /**
   * Roving focus across the bar buttons, attached only while `selectable`,
   * so a static table adds no listeners.
   *
   * @param {HTMLElement} node
   * @param {boolean} enabled
   */
  function rovingBars(node, enabled) {
    /** @type {ReturnType<typeof rovingFocus> | undefined} */
    let roving;
    /** @param {boolean} on */
    function sync(on) {
      if (on && !roving) {
        roving = rovingFocus(node, {
          selector: ".bx--viz-funnel-compare__button",
          orientation: "both",
          focusOnMove: true,
          getActiveIndex: () => tabStopIndex,
          onMove: (index, event) => {
            event.preventDefault();
            focusedIndex = index;
          },
        });
      } else if (!on && roving) {
        roving.destroy();
        roving = undefined;
      }
    }
    sync(enabled);
    return { update: sync, destroy: () => sync(false) };
  }
</script>

<table
  bind:this={ref}
  class:bx--viz-funnel-compare={true}
  class:bx--viz-funnel-compare--sm={size === "sm"}
  class:bx--viz-funnel-compare--lg={size === "lg"}
  class:bx--viz-funnel-compare--selectable={selectable}
  aria-hidden={label ? undefined : "true"}
  style:--bx-viz-color={inlineColor(color)}
  style:--bx-viz-funnels={columns.length}
  use:rovingBars={selectable}
  {...$$restProps}
>
  {#if label}
    <caption class:bx--visually-hidden={true}>
      {label}
    </caption>
  {/if}
  <thead>
    <tr>
      <th scope="col" class:bx--visually-hidden={true}>{headers.stage}</th>
      {#each columns as column (column.id)}
        <th scope="col" class:bx--viz-funnel-compare__head={true}>
          {column.label}
        </th>
      {/each}
    </tr>
  </thead>
  <tbody>
    {#each stageRows as row, r (row.id)}
      <tr class:bx--viz-funnel-compare__row={true}>
        <th scope="row" class:bx--viz-funnel-compare__label={true}>
          {row.label}
        </th>
        {#each cells.slice(
          r * columns.length,
          (r + 1) * columns.length,
        ) as cell (cell.key)}
          <!-- One cell per funnel, the bar and its value, so every funnel
               takes the same share of the width. -->
          <td
            class:bx--viz-funnel-compare__cell={true}
            class:bx--viz-funnel-compare__cell--selected={cell.key ===
              selectedKey}
            style:--bx-viz-pct={cell.pct}
            style:--bx-viz-color={cell.column.color}
          >
            <span class:bx--viz-funnel-compare__group={true}>
              {#if cell.stage && selectable}
                <button
                  type="button"
                  class:bx--viz-funnel-compare__button={true}
                  tabindex={cells.indexOf(cell) === tabStopIndex ? 0 : -1}
                  aria-pressed={cell.key === selectedKey}
                  aria-label="{cell.column.label}, {row.label}: {formatValue(
                    cell.stage.stats.value,
                  )}"
                  on:click={(event) => select(cell, event)}
                  on:mouseenter={() => emit(cell)}
                  on:mouseleave={() => emit(null)}
                  on:focus={() => {
                    focusedIndex = cells.indexOf(cell);
                    emit(cell);
                  }}
                  on:blur={() => emit(null)}
                >
                  <span class:bx--viz-funnel-compare__bar={true}></span>
                </button>
              {:else}
                <span
                  class:bx--viz-funnel-compare__track={true}
                  aria-hidden="true"
                >
                  {#if cell.stage}
                    <span class:bx--viz-funnel-compare__bar={true}></span>
                  {/if}
                </span>
              {/if}
              <span class:bx--viz-funnel-compare__value={true}>
                {cell.stage ? formatValue(cell.stage.stats.value) : "–"}
              </span>
            </span>
          </td>
        {/each}
      </tr>
    {/each}
  </tbody>
  {#if rate === "overall"}
    <tfoot>
      <tr class:bx--viz-funnel-compare__foot={true}>
        <th scope="row" class:bx--viz-funnel-compare__label={true}>
          {headers.overall}
        </th>
        {#each columns as column (column.id)}
          <td class:bx--viz-funnel-compare__cell={true}>
            <span class:bx--viz-funnel-compare__group={true}>
              <span class:bx--viz-funnel-compare__value={true}>
                {percent(column.stats.overallRate)}
              </span>
            </span>
          </td>
        {/each}
      </tr>
    </tfoot>
  {/if}
</table>
