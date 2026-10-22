<svelte:options immutable />

<script>
  /**
   * @template {string | number} [Id=string]
   */

  /**
   * @event {import("../utils/rank.js").RankRow<Id>} select Fires when a row is activated by click or keyboard. Requires `selectable`.
   * @event {import("../utils/rank.js").RankRow<Id> | null} hover Fires when the pointer or focus enters a row, and with `null` when it leaves. Requires `selectable`.
   */

  /**
   * @slot {{ row: import("../utils/rank.js").RankRow<Id> }} label
   * @slot {{ row: import("../utils/rank.js").RankRow<Id>; formattedValue: string }} value
   */

  /** @restProps {table} */

  /**
   * Specify the items. They are sorted by value unless `sort` is `false`.
   * @type {ReadonlyArray<import("../utils/shares.js").ShareItem<Id> & { href?: string }>}
   */
  export let data = [];

  /**
   * Specify the accessible name, used as the table caption.
   * Leave empty to mark the graphic as decorative.
   */
  export let label = "";

  /**
   * Specify how many rows to keep.
   * @type {number}
   */
  export let top = undefined;

  /** Set to `true` to fold the rows past `top` into one trailing row */
  export let other = false;

  /** Specify the label of the folded row */
  export let otherLabel = "Other";

  /** Set to `false` to keep the input order */
  export let sort = true;

  /** Set to `true` to hide the rank numbers */
  export let hideRank = false;

  /**
   * Specify what is written at the end of each row.
   * `"percent"` writes the share of the total of every item.
   * @type {"value" | "percent"}
   */
  export let valueType = "value";

  /**
   * Specify how values are written when `valueType` is `"value"`:
   * `Intl.NumberFormat` options or a function.
   * @type {import("../utils/format-compact.js").NumberFormat}
   */
  export let format = undefined;

  /**
   * Specify the bar color. An item's own `color` wins.
   * @type {import("../utils/tokens.js").VizColor}
   */
  export let color = "interactive";

  /**
   * Specify the size.
   * @type {"sm" | "md" | "lg"}
   */
  export let size = "md";

  /** Set to `true` to make rows selectable */
  export let selectable = false;

  /**
   * Specify the selected item id. The folded row has the id `"other"`.
   * @type {Id | undefined}
   */
  export let selectedId = undefined;

  /**
   * Specify the locale.
   * @type {string}
   */
  export let locale = undefined;

  /**
   * Override the visually hidden column headers.
   * @type {{ rank?: string; item?: string; value?: string }}
   */
  export let headerLabels = {};

  /**
   * Obtain a reference to the table element.
   * @bindable readonly
   * @type {null | HTMLTableElement}
   */
  export let ref = null;

  import { createEventDispatcher } from "svelte";
  import { rovingFocus } from "../../utils/roving-focus.js";
  import { formatPercent, resolveFormat } from "../utils/format-compact.js";
  import { getRanks } from "../utils/rank.js";
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

  $: ranks = getRanks(data, { top, other, otherLabel, sort });
  $: formatValue = resolveFormat(format, locale);
  $: write = (/** @type {import("../utils/rank.js").RankRow<Id>} */ row) =>
    valueType === "percent"
      ? formatPercent(row.share, { locale, digits: 0 })
      : formatValue(row.value);
  $: headers = { rank: "Rank", item: "Item", value: "Value", ...headerLabels };
  $: tabStopIndex =
    focusedIndex >= 0 && focusedIndex < ranks.rows.length
      ? focusedIndex
      : Math.max(
          0,
          ranks.rows.findIndex((row) => row.item.id === selectedId),
        );

  /**
   * Roving focus across the row buttons, attached only while `selectable`, so
   * a static list adds no listeners.
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
          selector: ".bx--viz-rank-bars__button",
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

  /** @param {import("../utils/rank.js").RankRow<Id>} row */
  function select(row) {
    selectedId = row.item.id;
    dispatch("select", row);
  }
</script>

<table
  bind:this={ref}
  class:bx--viz-rank-bars={true}
  class:bx--viz-rank-bars--sm={size === "sm"}
  class:bx--viz-rank-bars--lg={size === "lg"}
  class:bx--viz-rank-bars--selectable={selectable}
  aria-hidden={label ? undefined : "true"}
  style:--bx-viz-color={inlineColor(color)}
  use:rovingRows={selectable}
  {...$$restProps}
>
  {#if label}
    <caption class:bx--visually-hidden={true}>
      {label}
    </caption>
  {/if}
  <thead class:bx--visually-hidden={true}>
    <tr>
      {#if !hideRank}
        <th scope="col">{headers.rank}</th>
      {/if}
      <th scope="col">{headers.item}</th>
      <td></td>
      <th scope="col">{headers.value}</th>
    </tr>
  </thead>
  <tbody>
    {#each ranks.rows as row, i (row.item.id)}
      <!-- The row click is a pointer convenience. The button is the accessible path. -->
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
      <!-- svelte-ignore a11y-mouse-events-have-key-events -->
      <tr
        class:bx--viz-rank-bars__row={true}
        class:bx--viz-rank-bars__row--other={row.items !== null}
        class:bx--viz-rank-bars__row--selected={selectable &&
          row.item.id === selectedId}
        style:--bx-viz-pct={row.pct}
        style:--bx-viz-color={row.items === null
          ? inlineColor(row.item.color)
          : "var(--cds-viz-neutral)"}
        on:click={selectable ? () => select(row) : undefined}
        on:mouseenter={selectable ? () => dispatch("hover", row) : undefined}
        on:mouseleave={selectable ? () => dispatch("hover", null) : undefined}
      >
        {#if !hideRank}
          <td class:bx--viz-rank-bars__rank={true}>{row.rank ?? ""}</td>
        {/if}
        <th scope="row" class:bx--viz-rank-bars__label={true}>
          {#if selectable}
            <button
              type="button"
              class:bx--viz-rank-bars__button={true}
              aria-pressed={row.item.id === selectedId}
              tabindex={i === tabStopIndex ? 0 : -1}
              on:click|stopPropagation={() => select(row)}
              on:focus={() => {
                focusedIndex = i;
                dispatch("hover", row);
              }}
              on:blur={() => dispatch("hover", null)}
            >
              <slot name="label" {row}>{row.item.label}</slot>
            </button>
          {:else if row.items === null && row.item.href}
            <a class:bx--link={true} href={row.item.href}>
              <slot name="label" {row}>{row.item.label}</slot>
            </a>
          {:else}
            <slot name="label" {row}>{row.item.label}</slot>
          {/if}
        </th>
        <td class:bx--viz-rank-bars__track-cell={true} aria-hidden="true">
          <div class:bx--viz-rank-bars__bar={true}></div>
        </td>
        <td class:bx--viz-rank-bars__value={true}>
          <slot name="value" {row} formattedValue={write(row)}>
            {write(row)}
          </slot>
        </td>
      </tr>
    {/each}
  </tbody>
</table>
