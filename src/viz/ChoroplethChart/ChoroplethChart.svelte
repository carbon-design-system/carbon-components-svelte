<svelte:options immutable />

<script>
  /**
   * @template T
   */

  /**
   * The region type is written inline: a typedef cannot carry the generic
   * into the generated declarations.
   * @event {{ id: string; label: string; value: number | null; rows: T[]; feature: import("../utils/geo-path.js").GeoFeature } | null} hover Fires when the pointer or keyboard focus moves to another region, and with `null` when it leaves.
   * @event {{ region: { id: string; label: string; value: number | null; rows: T[]; feature: import("../utils/geo-path.js").GeoFeature }; originalEvent: Event }} select Fires when the focused region is activated by click, Enter, or Space.
   */

  /** @restProps {figure} */

  /**
   * Specify the map: GeoJSON features, or a `FeatureCollection`, with polygon
   * geometries in longitude and latitude. The library ships no geometry.
   * @type {import("../utils/geo-path.js").GeoInput}
   */
  export let features = [];

  /**
   * Specify the rows. Rows that share a region are summed.
   * @type {ReadonlyArray<T>}
   */
  export let data = [];

  /**
   * Specify how to read the region from a row: a key or a function.
   * It is matched against each feature's id.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let region;

  /**
   * Specify how to read the value from a row: a key or a function.
   * @type {import("../utils/accessor.js").Accessor<T, number | null | undefined>}
   */
  export let value;

  /**
   * Specify how to read a feature's id. Defaults to its `id`, then its
   * `properties.id`, then its `properties.name`.
   * @type {(feature: import("../utils/geo-path.js").GeoFeature) => string | number}
   */
  export let featureId = undefined;

  /**
   * Specify how to read a feature's label. Defaults to its
   * `properties.name`, then its id.
   * @type {(feature: import("../utils/geo-path.js").GeoFeature) => string}
   */
  export let featureLabel = undefined;

  /** Specify the title, shown as the caption and used as the accessible name */
  export let title = "";

  /**
   * Specify the projection. `"mercator"` keeps shapes and suits regions.
   * `"equirectangular"` plots degrees as they are.
   * @type {"mercator" | "equirectangular"}
   */
  export let projection = "mercator";

  /** Specify the width the map is drawn at. It scales to its container. */
  export let width = 720;

  /** Specify the height the map is drawn at */
  export let height = 400;

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
  import ChartTooltipRow from "../Chart/ChartTooltipRow.svelte";
  import { toAccessor } from "../utils/accessor.js";
  import { resolveFormat } from "../utils/format-compact.js";
  import { geoPaths } from "../utils/geo-path.js";
  import { heatColor } from "../utils/heat-grid.js";

  const dispatch = createEventDispatcher();
  const LEGEND_STEPS = [0, 0.25, 0.5, 0.75, 1];

  /** @type {string | null} */
  let activeId = null;
  let focusIndex = -1;

  /** @param {import("../utils/geo-path.js").GeoFeature} feature */
  function defaultId(feature) {
    return (
      feature.id ?? feature.properties?.id ?? feature.properties?.name ?? ""
    );
  }

  // Projection is the costly part, and depends on the map and the size only.
  $: shapes = geoPaths(features, { width, height, projection, padding: 4 });
  $: regionOf = toAccessor(region);
  $: valueOf = toAccessor(value);
  $: totals = sum(data, regionOf, valueOf);
  $: readId = featureId ?? defaultId;
  $: regions = shapes
    .filter((shape) => shape.path)
    .map((shape) => {
      const id = String(readId(shape.feature));
      const entry = totals.get(id);
      return {
        id,
        label: featureLabel
          ? featureLabel(shape.feature)
          : String(shape.feature.properties?.name ?? id),
        value: entry ? entry.value : null,
        rows: entry ? entry.rows : [],
        feature: shape.feature,
        path: shape.path,
        cx: shape.cx,
        cy: shape.cy,
      };
    });
  $: range = extent(regions, domain);
  $: formatValue = resolveFormat(format, locale);
  $: headers = { region: "Region", value: "Value", ...headerLabels };
  // Reading order for the keyboard and the table: by name.
  $: order = [...regions].sort((a, b) => a.label.localeCompare(b.label));
  $: active = regions.find((entry) => entry.id === activeId) ?? null;
  $: ramp = LEGEND_STEPS.map(
    (t) => heatColor(range[0] + (range[1] - range[0]) * t, range, hue).color,
  );
  $: write = (/** @type {number | null} */ amount) =>
    amount === null ? noDataText : formatValue(amount);
  $: announcement = active ? `${active.label}: ${write(active.value)}` : "";

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
   * @param {ReadonlyArray<{ value: number | null }>} list
   * @param {readonly [number, number] | undefined} fixed
   * @returns {[number, number]}
   */
  function extent(list, fixed) {
    if (fixed) return [fixed[0], fixed[1]];
    let low = Number.POSITIVE_INFINITY;
    let high = Number.NEGATIVE_INFINITY;
    for (const entry of list) {
      if (entry.value === null) continue;
      if (entry.value < low) low = entry.value;
      if (entry.value > high) high = entry.value;
    }
    return low <= high ? [low, high] : [0, 0];
  }

  /** @param {(typeof regions)[number] | null} entry */
  function setActive(entry) {
    const next = entry ? entry.id : null;
    if (next === activeId) return;
    activeId = next;
    dispatch(
      "hover",
      entry
        ? {
            id: entry.id,
            label: entry.label,
            value: entry.value,
            rows: entry.rows,
            feature: entry.feature,
          }
        : null,
    );
  }

  /** @param {Event} originalEvent */
  function selectActive(originalEvent) {
    if (!active) return;
    dispatch("select", {
      region: {
        id: active.id,
        label: active.label,
        value: active.value,
        rows: active.rows,
        feature: active.feature,
      },
      originalEvent,
    });
  }

  /** @param {KeyboardEvent} event */
  function onKeydown(event) {
    const last = order.length - 1;
    if (last < 0) return;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        focusIndex = Math.min(last, focusIndex + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        focusIndex = Math.max(0, focusIndex - 1);
        break;
      case "Home":
        focusIndex = 0;
        break;
      case "End":
        focusIndex = last;
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        selectActive(event);
        return;
      case "Escape":
        focusIndex = -1;
        setActive(null);
        return;
      default:
        return;
    }
    event.preventDefault();
    setActive(order[focusIndex]);
  }
</script>

<figure bind:this={ref} class:bx--viz-choropleth={true} {...$$restProps}>
  {#if title}
    <figcaption class:bx--viz-chart__title={true}>{title}</figcaption>
  {/if}
  <div class:bx--viz-choropleth__plot={true} style:max-width="{width}px">
    <!-- A chart is one tab stop. Arrow keys move between regions by name. -->
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-mouse-events-have-key-events -->
    <svg
      class:bx--viz-choropleth__svg={true}
      viewBox="0 0 {width} {height}"
      role="application"
      aria-roledescription="chart"
      aria-label={title || undefined}
      tabindex="0"
      on:keydown={onKeydown}
      on:click={selectActive}
      on:mouseleave={() => setActive(null)}
      on:blur={() => setActive(null)}
    >
      <g aria-hidden="true">
        {#each regions as entry (entry.id)}
          <path
            class:bx--viz-choropleth__region={true}
            class:bx--viz-choropleth__region--empty={entry.value === null}
            d={entry.path}
            fill-rule="evenodd"
            style:--bx-viz-color={entry.value === null
              ? undefined
              : heatColor(entry.value, range, hue).color}
            on:mouseenter={() => setActive(entry)}
          />
        {/each}
        <!-- Drawn last, so its outline is never under a neighbor. -->
        {#if active}
          <path
            class:bx--viz-choropleth__outline={true}
            d={active.path}
            fill-rule="evenodd"
          />
        {/if}
      </g>
    </svg>
    {#if active}
      <div
        class:bx--viz-chart-tooltip={true}
        class:bx--viz-chart-tooltip--flipped={active.cx > width / 2}
        aria-hidden="true"
        style:left="{(active.cx / width) * 100}%"
        style:top="{(active.cy / height) * 100}%"
      >
        <ChartTooltipRow label={active.label} value={write(active.value)} />
      </div>
    {/if}
  </div>
  <!-- Every region, for assistive technology: a shape says nothing to it. -->
  <table class:bx--visually-hidden={true}>
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
      {#each order as entry (entry.id)}
        <tr>
          <th scope="row">{entry.label}</th>
          <td>{write(entry.value)}</td>
        </tr>
      {/each}
    </tbody>
  </table>
  <div class:bx--visually-hidden={true} aria-live="polite">{announcement}</div>
  {#if legend && regions.length > 0}
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
