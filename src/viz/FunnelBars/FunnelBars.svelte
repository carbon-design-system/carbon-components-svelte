<svelte:options immutable />

<script>
  /**
   * @template {string | number} [Id=string]
   */

  /**
   * @typedef {import("../utils/funnel.js").FunnelStage<Id>} FunnelStage
   * @typedef {import("../utils/funnel.js").FunnelStageStats} FunnelStageStats
   * @typedef {{ stage: FunnelStage; stats: FunnelStageStats; index: number }} FunnelBarsEventDetail
   * @restProps {table}
   * @event {FunnelBarsEventDetail} select Fires when a stage is activated by click or keyboard. Requires `selectable`.
   * @event {FunnelBarsEventDetail | null} hover Fires when the pointer or focus enters a stage, and with `null` when it leaves. Requires `selectable`.
   * @event {{ count: number; domain: [number, number]; stats: { overallRate: number | null; largestDropIndex: number; total: number } }} update Fires after the stages change. Requires `emitUpdate`.
   * @slot {{ stage: FunnelStage; stats: FunnelStageStats; index: number }} label
   * @slot {{ stage: FunnelStage; stats: FunnelStageStats; index: number; formattedValue: string }} value
   * @slot {{ stage: FunnelStage; stats: FunnelStageStats; index: number; kind: "step" | "overall" }} rate
   */

  /**
   * Specify the stages, in order.
   * Reassign the array to update: `stages = [...stages]`.
   * @type {ReadonlyArray<FunnelStage>}
   */
  export let stages = [];

  /**
   * Specify the accessible name, rendered as the table caption.
   * Leave empty to mark the funnel as decorative.
   */
  export let label = "";

  /**
   * Specify which conversion rate to show.
   * `"step"` is relative to the previous stage, `"overall"` to the first.
   * @type {"none" | "step" | "overall" | "both"}
   */
  export let rate = "overall";

  /**
   * Emphasize a stage: the one with the largest absolute drop, or a stage id.
   * @type {"none" | "largest-drop" | Id}
   */
  export let highlight = "none";

  /** Set to `true` to show what each stage lost as a hatched bar and a percentage */
  export let showDrop = false;

  /**
   * Specify the bar alignment. `"center"` gives the classic funnel silhouette.
   * @type {"start" | "center"}
   */
  export let align = "start";

  /**
   * Specify the bar length scale.
   * `"sqrt"` keeps a very small last stage visible, and adds a "Not to scale" note.
   * @type {"linear" | "sqrt"}
   */
  export let scale = "linear";

  /**
   * Specify the bar color. A stage's own `color` takes precedence.
   * @type {import("../utils/tokens.js").VizColor}
   */
  export let color = "interactive";

  /**
   * Specify the row size.
   * @type {"sm" | "md" | "lg"}
   */
  export let size = "md";

  /**
   * Specify how values are written: `Intl.NumberFormat` options or a function.
   * Defaults to compact notation.
   * @type {Intl.NumberFormatOptions | ((value: number) => string)}
   */
  export let format = undefined;

  /**
   * Specify the locale.
   * @type {string}
   */
  export let locale = undefined;

  /** Set to `true` to make stages selectable */
  export let selectable = false;

  /**
   * Specify the selected stage id.
   * @type {Id | undefined}
   */
  export let selectedId = undefined;

  /** Set to `true` to dispatch `update` after the stages change */
  export let emitUpdate = false;

  /** Specify the note shown when `scale` is not linear */
  export let notToScaleText = "Not to scale";

  /**
   * Override the visually hidden column headers.
   * @type {{ stage?: string; value?: string; step?: string; overall?: string }}
   */
  export let headerLabels = {};

  /**
   * Obtain a reference to the table element.
   * @bindable readonly
   * @type {null | HTMLTableElement}
   */
  export let ref = null;

  import { createEventDispatcher, tick } from "svelte";
  import WarningAltFilled from "../../icons/WarningAltFilled.svelte";
  import { rovingFocus } from "../../utils/roving-focus.js";
  import { formatPercent, resolveFormat } from "../utils/format-compact.js";
  import { getFunnelStats } from "../utils/funnel.js";
  import { VIZ_SEMANTIC_COLORS, vizColor } from "../utils/tokens.js";

  const dispatch = createEventDispatcher();

  let focusedIndex = -1;

  /** @param {import("../utils/tokens.js").VizColor | undefined} value */
  function inlineColor(value) {
    if (value === undefined || value === "interactive") return undefined;
    return VIZ_SEMANTIC_COLORS.includes(value)
      ? `var(--cds-viz-${value})`
      : vizColor(value);
  }

  $: funnel = getFunnelStats(stages, { scale });
  $: formatValue = resolveFormat(format, locale);
  $: percent = (/** @type {number | null} */ ratio) =>
    ratio === null ? "" : formatPercent(ratio, { locale, digits: 0 });
  $: headers = {
    stage: "Stage",
    value: "Value",
    step: "Conversion from previous stage",
    overall: "Conversion from first stage",
    ...headerLabels,
  };
  $: caption = [
    label,
    funnel.overallRate === null
      ? ""
      : `Overall conversion ${percent(funnel.overallRate)}`,
    scale === "linear" ? "" : notToScaleText,
  ]
    .filter(Boolean)
    .join(". ");
  $: highlightIndex =
    highlight === "largest-drop"
      ? funnel.largestDropIndex
      : highlight === "none"
        ? -1
        : funnel.rows.findIndex((row) => row.stage.id === highlight);
  $: tabStopIndex =
    focusedIndex >= 0 && focusedIndex < funnel.rows.length
      ? focusedIndex
      : Math.max(
          0,
          funnel.rows.findIndex((row) => row.stage.id === selectedId),
        );

  $: if (emitUpdate) announceUpdate(funnel);

  /** @param {typeof funnel} current */
  function announceUpdate(current) {
    const detail = {
      count: current.rows.length,
      domain: /** @type {[number, number]} */ ([0, current.max]),
      stats: {
        overallRate: current.overallRate,
        largestDropIndex: current.largestDropIndex,
        total: current.total,
      },
    };
    tick().then(() => dispatch("update", detail));
  }

  /**
   * Roving focus across the row buttons, attached only while `selectable`, so
   * a static funnel adds no listeners.
   *
   * @param {HTMLElement} node
   * @param {boolean} enabled
   */
  function rovingRows(node, enabled) {
    /** @type {ReturnType<typeof rovingFocus> | undefined} */
    let roving;
    /** @param {boolean} on */
    function sync(on) {
      if (on && !roving) {
        roving = rovingFocus(node, {
          selector: ".bx--viz-funnel-bars__button",
          orientation: "vertical",
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

  /** @param {(typeof funnel.rows)[number]} row */
  function select(row) {
    selectedId = row.stage.id;
    dispatch("select", row);
  }
</script>

<table
  bind:this={ref}
  class:bx--viz-funnel-bars={true}
  class:bx--viz-funnel-bars--sm={size === "sm"}
  class:bx--viz-funnel-bars--lg={size === "lg"}
  class:bx--viz-funnel-bars--center={align === "center"}
  class:bx--viz-funnel-bars--selectable={selectable}
  aria-hidden={label ? undefined : "true"}
  style:--bx-viz-color={inlineColor(color)}
  use:rovingRows={selectable}
  {...$$restProps}
>
  {#if label}
    <caption class:bx--visually-hidden={true}>
      {caption}
    </caption>
  {/if}
  <thead class:bx--visually-hidden={true}>
    <tr>
      <th scope="col">{headers.stage}</th>
      <td></td>
      <th scope="col">{headers.value}</th>
      {#if rate === "step" || rate === "both"}
        <th scope="col">{headers.step}</th>
      {/if}
      {#if rate === "overall" || rate === "both"}
        <th scope="col">{headers.overall}</th>
      {/if}
    </tr>
  </thead>
  <tbody>
    {#each funnel.rows as row, i (row.stage.id)}
      {@const { stage, stats, index } = row}
      {@const highlighted = i === highlightIndex}
      <!-- The row click is a pointer convenience. The button is the accessible path. -->
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
      <!-- svelte-ignore a11y-mouse-events-have-key-events -->
      <tr
        class:bx--viz-funnel-bars__row={true}
        class:bx--viz-funnel-bars__row--highlight={highlighted}
        class:bx--viz-funnel-bars__row--selected={selectable &&
          stage.id === selectedId}
        style:--bx-viz-pct={stats.pct}
        style:--bx-viz-previous-pct={stats.previousPct}
        style:--bx-viz-color={inlineColor(stage.color)}
        on:click={selectable ? () => select(row) : undefined}
        on:mouseenter={selectable ? () => dispatch("hover", row) : undefined}
        on:mouseleave={selectable ? () => dispatch("hover", null) : undefined}
      >
        <th scope="row" class:bx--viz-funnel-bars__label={true}>
          {#if selectable}
            <button
              type="button"
              class:bx--viz-funnel-bars__button={true}
              aria-pressed={stage.id === selectedId}
              tabindex={i === tabStopIndex ? 0 : -1}
              on:click|stopPropagation={() => select(row)}
              on:focus={() => {
                focusedIndex = i;
                dispatch("hover", row);
              }}
              on:blur={() => dispatch("hover", null)}
            >
              <slot name="label" {stage} {stats} {index}>{stage.label}</slot>
            </button>
          {:else if stage.href}
            <a class:bx--link={true} href={stage.href}>
              <slot name="label" {stage} {stats} {index}>{stage.label}</slot>
            </a>
          {:else}
            <slot name="label" {stage} {stats} {index}>{stage.label}</slot>
          {/if}
        </th>
        <td class:bx--viz-funnel-bars__track-cell={true} aria-hidden="true">
          <div class:bx--viz-funnel-bars__track={true}>
            {#if showDrop && i > 0 && stats.previousPct > stats.pct}
              <div class:bx--viz-funnel-bars__drop={true}></div>
            {/if}
            <div class:bx--viz-funnel-bars__bar={true}></div>
          </div>
        </td>
        <td class:bx--viz-funnel-bars__value={true}>
          <slot
            name="value"
            {stage}
            {stats}
            {index}
            formattedValue={formatValue(stats.value)}
          >
            {formatValue(stats.value)}
          </slot>
        </td>
        {#if rate === "step" || rate === "both"}
          <td class:bx--viz-funnel-bars__rate={true}>
            <slot name="rate" {stage} {stats} {index} kind="step">
              {percent(stats.stepRate)}
            </slot>
          </td>
        {/if}
        {#if rate === "overall" || rate === "both"}
          <td class:bx--viz-funnel-bars__rate={true}>
            <slot name="rate" {stage} {stats} {index} kind="overall">
              {percent(stats.overallRate)}
            </slot>
          </td>
        {/if}
        {#if showDrop || highlight !== "none"}
          <td class:bx--viz-funnel-bars__drop-label={true}>
            {#if highlighted}
              <WarningAltFilled
                size={16}
                class="bx--viz-funnel-bars__highlight-icon"
              />
            {/if}
            {#if showDrop && stats.dropPct !== null && stats.dropPct > 0}
              <span aria-hidden="true">−{percent(stats.dropPct)}</span>
              <span class:bx--visually-hidden={true}
                >{percent(stats.dropPct)}
                drop{highlighted
                  ? ", largest drop"
                  : ""}</span
              >
            {:else if highlighted}
              <span class:bx--visually-hidden={true}>Highlighted</span>
            {/if}
          </td>
        {/if}
      </tr>
    {/each}
  </tbody>
</table>
{#if scale !== "linear"}
  <p
    class:bx--viz-funnel-bars__note={true}
    aria-hidden={label ? "true" : undefined}
  >
    {notToScaleText}
  </p>
{/if}
