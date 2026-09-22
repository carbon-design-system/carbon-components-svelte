<svelte:options immutable />

<script>
  /**
   * @template T
   */

  /**
   * The region type is written inline: a typedef cannot carry the generic
   * into the generated declarations.
   * @event {{ id: string; label: string; value: number | null; rows: T[] } | null} hover Fires when the pointer or keyboard focus moves to another tile, and with `null` when it leaves.
   * @event {{ region: { id: string; label: string; value: number | null; rows: T[] }; originalEvent: Event }} select Fires when a tile is activated by click, Enter, or Space. Requires `selectable`.
   */

  /** @restProps {figure} */

  /**
   * Specify the layout: a built-in name, or tiles of your own with a
   * zero-based `row` and `column` each.
   * @type {import("../utils/tile-grid.js").TileLayout | ReadonlyArray<import("../utils/tile-grid.js").Tile>}
   */
  export let layout = "us-states";

  /**
   * Specify the rows. Rows that share a region are summed.
   * @type {ReadonlyArray<T>}
   */
  export let data = [];

  /**
   * Specify how to read the region from a row: a key or a function.
   * It is matched against each tile's id.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let region;

  /**
   * Specify how to read the value from a row: a key or a function.
   * @type {import("../utils/accessor.js").Accessor<T, number | null | undefined>}
   */
  export let value;

  /** Specify the title, shown as the caption and used as the accessible name */
  export let title = "";

  /** Specify the width the map may grow to, in pixels */
  export let width = 480;

  /**
   * Specify the hue of the sequential ramp.
   * @type {import("../utils/tokens.js").VizSequentialHue}
   */
  export let hue = "blue";

  /**
   * Specify the values at the ends of the ramp.
   * Defaults to the extent of the region totals.
   * @type {readonly [number, number]}
   */
  export let domain = undefined;

  /**
   * Specify how values are written: `Intl.NumberFormat` options or a function.
   * @type {import("../utils/format-compact.js").NumberFormat}
   */
  export let format = undefined;

  /** Set to `false` to hide the legend */
  export let legend = true;

  /** Specify the text for a region with no data */
  export let noDataText = "No data";

  /** Set to `true` to make each tile a toggle button */
  export let selectable = false;

  /**
   * Specify the selected tile id. Requires `selectable`.
   * @type {string | null}
   */
  export let selected = null;

  /**
   * Override the column headers of the table for assistive technology.
   * @type {{ region?: string; value?: string }}
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
   * @type {null | HTMLElement}
   */
  export let ref = null;

  import { createEventDispatcher } from "svelte";
  import { rovingFocus } from "../../utils/roving-focus.js";
  import ChartTooltipRow from "../Chart/ChartTooltipRow.svelte";
  import { toAccessor } from "../utils/accessor.js";
  import { resolveFormat } from "../utils/format-compact.js";
  import { heatColor } from "../utils/heat-grid.js";
  import { resolveTiles } from "../utils/tile-grid.js";

  const dispatch = createEventDispatcher();
  const LEGEND_STEPS = [0, 0.25, 0.5, 0.75, 1];

  /** @type {string | null} */
  let activeId = null;
  let focusedIndex = 0;

  $: grid = resolveTiles(layout);
  $: regionOf = toAccessor(region);
  $: valueOf = toAccessor(value);
  $: totals = sum(data, regionOf, valueOf);
  $: range = extent(totals, domain);
  $: formatValue = resolveFormat(format, locale);
  $: write = (/** @type {number | null} */ amount) =>
    amount === null ? noDataText : formatValue(amount);
  // Depends on the layout, the data, and the ramp only, so hover never
  // colors the tiles again.
  $: tiles = grid.tiles.map((tile) => {
    const entry = totals.get(tile.id);
    const paint = entry ? heatColor(entry.value, range, hue) : null;
    return {
      id: tile.id,
      label: tile.label,
      row: tile.row,
      column: tile.column,
      value: entry ? entry.value : null,
      rows: entry ? entry.rows : [],
      color: paint ? paint.color : undefined,
      textColor: paint ? paint.textColor : undefined,
    };
  });
  $: headers = { region: "Region", value: "Value", ...headerLabels };
  $: byName = [...tiles].sort((a, b) => a.label.localeCompare(b.label));
  $: active = tiles.find((tile) => tile.id === activeId) ?? null;
  $: ramp = LEGEND_STEPS.map(
    (t) => heatColor(range[0] + (range[1] - range[0]) * t, range, hue).color,
  );
  $: announcement = active ? `${active.label}: ${write(active.value)}` : "";
  $: tabStopIndex = Math.min(focusedIndex, Math.max(tiles.length - 1, 0));

  /**
   * @param {ReadonlyArray<T>} rows
   * @param {(row: T, index: number) => unknown} idOf
   * @param {(row: T, index: number) => unknown} amountOf
   */
  function sum(rows, idOf, amountOf) {
    /** @type {Map<string, { value: number; rows: T[] }>} */
    const out = new Map();
    for (let i = 0; i < rows.length; i++) {
      // `Number(null)` is 0, which would color a missing value as the lowest.
      const raw = amountOf(rows[i], i);
      const amount = Number(raw);
      if (raw === null || raw === undefined || !Number.isFinite(amount))
        continue;
      const key = String(idOf(rows[i], i));
      const entry = out.get(key);
      if (entry) {
        entry.value += amount;
        entry.rows.push(rows[i]);
      } else {
        out.set(key, { value: amount, rows: [rows[i]] });
      }
    }
    return out;
  }

  /**
   * @param {Map<string, { value: number }>} entries
   * @param {readonly [number, number] | undefined} fixed
   * @returns {[number, number]}
   */
  function extent(entries, fixed) {
    if (fixed) return [fixed[0], fixed[1]];
    let low = Number.POSITIVE_INFINITY;
    let high = Number.NEGATIVE_INFINITY;
    for (const entry of entries.values()) {
      if (entry.value < low) low = entry.value;
      if (entry.value > high) high = entry.value;
    }
    return low <= high ? [low, high] : [0, 0];
  }

  /** @param {(typeof tiles)[number]} tile */
  function detail(tile) {
    return {
      id: tile.id,
      label: tile.label,
      value: tile.value,
      rows: tile.rows,
    };
  }

  /** @param {(typeof tiles)[number] | null} tile */
  function setActive(tile) {
    const next = tile ? tile.id : null;
    if (next === activeId) return;
    activeId = next;
    dispatch("hover", tile ? detail(tile) : null);
  }

  /**
   * @param {(typeof tiles)[number]} tile
   * @param {Event} originalEvent
   */
  function select(tile, originalEvent) {
    selected = selected === tile.id ? null : tile.id;
    dispatch("select", { region: detail(tile), originalEvent });
  }

  /**
   * Roving focus across the tiles, attached only while `selectable`, so a
   * static map adds no listeners.
   *
   * @param {HTMLElement} node
   * @param {boolean} enabled
   */
  function rovingTiles(node, enabled) {
    /** @type {ReturnType<typeof rovingFocus> | undefined} */
    let roving;
    /** @param {boolean} on */
    function sync(on) {
      if (on && !roving) {
        roving = rovingFocus(node, {
          selector: ".bx--viz-tile-map__button",
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

<figure
  bind:this={ref}
  class:bx--viz-tile-map={true}
  class:bx--viz-tile-map--selectable={selectable}
  class:bx--viz-tile-map--emphasis={activeId !== null}
  {...$$restProps}
>
  {#if title}
    <figcaption class:bx--viz-chart__title={true}>{title}</figcaption>
  {/if}
  <div class:bx--viz-tile-map__plot={true} style:max-width="{width}px">
    <!-- Static tiles say nothing to assistive technology, which reads the
         table instead. Toggle buttons are exposed, each named in full. -->
    <ul
      class:bx--viz-tile-map__grid={true}
      style:--bx-viz-columns={grid.columns}
      aria-hidden={selectable ? undefined : "true"}
      aria-label={selectable ? title || undefined : undefined}
      use:rovingTiles={selectable}
    >
      {#each tiles as tile, i (tile.id)}
        <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
        <!-- svelte-ignore a11y-mouse-events-have-key-events -->
        <li
          class:bx--viz-tile-map__tile={true}
          class:bx--viz-tile-map__tile--empty={tile.value === null}
          class:bx--viz-tile-map__tile--active={tile.id === activeId}
          class:bx--viz-tile-map__tile--selected={selectable &&
            tile.id === selected}
          style:grid-row={tile.row + 1}
          style:grid-column={tile.column + 1}
          style:--bx-viz-color={tile.color}
          style:--bx-viz-text-color={tile.textColor}
          title="{tile.label}: {write(tile.value)}"
          on:mouseenter={() => setActive(tile)}
          on:mouseleave={() => setActive(null)}
        >
          {#if selectable}
            <button
              type="button"
              class:bx--viz-tile-map__button={true}
              tabindex={i === tabStopIndex ? 0 : -1}
              aria-pressed={tile.id === selected}
              aria-label="{tile.label}, {write(tile.value)}"
              on:click={(event) => select(tile, event)}
              on:focus={() => {
                focusedIndex = i;
                setActive(tile);
              }}
              on:blur={() => setActive(null)}
            >
              {tile.id}
            </button>
          {:else}
            {tile.id}
          {/if}
        </li>
      {/each}
    </ul>
    {#if active}
      <div
        class:bx--viz-chart-tooltip={true}
        class:bx--viz-chart-tooltip--flipped={active.column + 0.5 >
          grid.columns / 2}
        aria-hidden="true"
        style:left="{((active.column + 0.5) / grid.columns) * 100}%"
        style:top="{((active.row + 0.5) / grid.rows) * 100}%"
      >
        <ChartTooltipRow label={active.label} value={write(active.value)} />
      </div>
    {/if}
  </div>
  <!-- Every region, for assistive technology: a grid of squares says nothing to it. -->
  <table
    class:bx--visually-hidden={true}
    aria-hidden={selectable ? "true" : undefined}
  >
    {#if title}
      <caption>
        {title}
      </caption>
    {/if}
    <thead>
      <tr>
        <th scope="col">{headers.region}</th>
        <th scope="col">{headers.value}</th>
      </tr>
    </thead>
    <tbody>
      {#each byName as tile (tile.id)}
        <tr>
          <th scope="row">{tile.label}</th>
          <td>{write(tile.value)}</td>
        </tr>
      {/each}
    </tbody>
  </table>
  <div class:bx--visually-hidden={true} aria-live="polite">{announcement}</div>
  {#if legend && totals.size > 0}
    <div class:bx--viz-heatmap__legend={true} aria-hidden="true">
      <span>{formatValue(range[0])}</span>
      <span class:bx--viz-heatmap__ramp={true}>
        {#each ramp as color, i (i)}
          <span style:--bx-viz-color={color}></span>
        {/each}
      </span>
      <span>{formatValue(range[1])}</span>
    </div>
  {/if}
</figure>
