<svelte:options immutable />

<script>
  /**
   * @template T
   */

  /**
   * @event {{ slice: import("./donut-geometry.js").DonutSlice<T>; originalEvent: Event }} select Fires when a slice is activated from the legend or by clicking it. Requires `selectable`.
   * @event {import("./donut-geometry.js").DonutSlice<T> | null} hover Fires when the pointer or focus enters a slice or its legend entry, and with `null` when it leaves.
   */

  /**
   * @slot {{ total: number; formattedTotal: string; active: import("./donut-geometry.js").DonutSlice<T> | null }}
   */

  /** @restProps {figure} */

  /**
   * Specify the rows. Rows that share a category are summed.
   * @type {ReadonlyArray<T>}
   */
  export let data = [];

  /**
   * Specify how to read the value from a row: a key or a function.
   * @type {import("../utils/accessor.js").Accessor<T, number>}
   */
  export let value;

  /**
   * Specify how to read the category from a row: a key or a function.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let category;

  /** Specify the title, shown as the caption */
  export let title = "";

  /**
   * Specify the most slices to draw. The smallest categories past the limit
   * fold into one neutral slice.
   */
  export let maxSlices = 6;

  /** Specify the label of the folded slice */
  export let otherLabel = "Other";

  /** Set to `false` to keep categories in first-seen order */
  export let sort = true;

  /** Specify the diameter, in pixels */
  export let diameter = 200;

  /**
   * Specify the size of the hole as a share of the radius.
   * Set to `0` for a pie.
   */
  export let innerRadius = 0.6;

  /**
   * Specify where the legend goes. It lists every slice with its value, so
   * it is also the text alternative.
   * @type {"right" | "bottom"}
   */
  export let legend = "right";

  /**
   * Specify what the legend writes for each slice.
   * @type {"percent" | "value" | "both"}
   */
  export let valueType = "percent";

  /**
   * Specify how values are written: `Intl.NumberFormat` options or a function.
   * @type {import("../utils/format-compact.js").NumberFormat}
   */
  export let format = undefined;

  /**
   * Specify which of Carbon's prescribed color groups to use (1-based).
   */
  export let palette = 1;

  /**
   * Override the color of a category.
   * @type {Record<string, import("../utils/tokens.js").VizColor>}
   */
  export let colors = {};

  /** Set to `true` to make slices selectable */
  export let selectable = false;

  /**
   * Specify the selected category. The folded slice is `"other"`.
   * @type {string | null}
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
  import { toAccessor } from "../utils/accessor.js";
  import { formatPercent, resolveFormat } from "../utils/format-compact.js";
  import { buildDonut } from "./donut-geometry.js";

  const dispatch = createEventDispatcher();

  /** @type {string | null} */
  let activeId = null;

  $: valueOf = toAccessor(value);
  $: categoryOf = toAccessor(category);
  // Depends on the data and geometry props only, so hover never rebuilds it.
  $: donut = buildDonut(data, {
    value: valueOf,
    category: categoryOf,
    maxSlices,
    otherLabel,
    sort,
    diameter,
    innerRadius,
    palette,
    colors,
  });
  $: formatValue = resolveFormat(format, locale);
  $: write = (
    /** @type {import("./donut-geometry.js").DonutSlice<T>} */ slice,
  ) => {
    const share = formatPercent(slice.share, { locale, digits: 0 });
    if (valueType === "percent") return share;
    const amount = formatValue(slice.value);
    return valueType === "value" ? amount : `${amount} (${share})`;
  };
  $: emphasis = activeId ?? (selectable ? selected : null);
  $: hasEmphasis =
    emphasis !== null && donut.slices.some((slice) => slice.id === emphasis);
  $: active = donut.slices.find((slice) => slice.id === activeId) ?? null;

  /** @param {import("./donut-geometry.js").DonutSlice<T> | null} slice */
  function setActive(slice) {
    const next = slice ? slice.id : null;
    if (next === activeId) return;
    activeId = next;
    dispatch("hover", slice);
  }

  /**
   * @param {import("./donut-geometry.js").DonutSlice<T>} slice
   * @param {Event} originalEvent
   */
  function select(slice, originalEvent) {
    if (!selectable) return;
    selected = selected === slice.id ? null : slice.id;
    dispatch("select", { slice, originalEvent });
  }
</script>

<figure
  bind:this={ref}
  class:bx--viz-donut={true}
  class:bx--viz-donut--bottom={legend === "bottom"}
  class:bx--viz-donut--selectable={selectable}
  class:bx--viz-donut--emphasis={hasEmphasis}
  {...$$restProps}
>
  {#if title}
    <figcaption class:bx--viz-chart__title={true}>{title}</figcaption>
  {/if}
  <div class:bx--viz-donut__body={true}>
    <div
      class:bx--viz-donut__plot={true}
      style:--bx-viz-diameter="{diameter}px"
    >
      <!-- The legend lists every slice with its value, so the ring is decorative. -->
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <!-- svelte-ignore a11y-mouse-events-have-key-events -->
      <svg
        class:bx--viz-donut__svg={true}
        viewBox="0 0 {diameter} {diameter}"
        width={diameter}
        height={diameter}
        aria-hidden="true"
        focusable="false"
        on:mouseleave={() => setActive(null)}
      >
        {#if donut.total === 0}
          <circle
            class:bx--viz-donut__track={true}
            cx={diameter / 2}
            cy={diameter / 2}
            r={(diameter / 2) *
              (1 + Math.min(Math.max(innerRadius, 0), 0.95)) *
              0.5}
            stroke-width={(diameter / 2) *
              (1 - Math.min(Math.max(innerRadius, 0), 0.95))}
          />
        {/if}
        {#each donut.slices as slice (slice.id)}
          {#if slice.d}
            <path
              class:bx--viz-donut__slice={true}
              class:bx--viz-donut__slice--active={slice.id === emphasis}
              d={slice.d}
              style:--bx-viz-color={slice.color}
              on:mouseenter={() => setActive(slice)}
              on:click={(event) => select(slice, event)}
            />
          {/if}
        {/each}
      </svg>
      {#if innerRadius > 0 && $$slots.default}
        <div class:bx--viz-donut__center={true}>
          <slot
            total={donut.total}
            formattedTotal={formatValue(donut.total)}
            {active}
          />
        </div>
      {/if}
    </div>
    <ul class:bx--viz-donut__legend={true}>
      {#each donut.slices as slice (slice.id)}
        <li
          class:bx--viz-donut__item={true}
          class:bx--viz-donut__item--active={slice.id === emphasis}
          style:--bx-viz-color={slice.color}
        >
          {#if selectable}
            <button
              type="button"
              class:bx--viz-donut__button={true}
              aria-pressed={slice.id === selected}
              on:click={(event) => select(slice, event)}
              on:mouseenter={() => setActive(slice)}
              on:mouseleave={() => setActive(null)}
              on:focus={() => setActive(slice)}
              on:blur={() => setActive(null)}
            >
              <span class:bx--viz-donut__swatch={true}></span>
              <span class:bx--viz-donut__label={true}>{slice.label}</span>
              <span class:bx--viz-donut__value={true}>{write(slice)}</span>
            </button>
          {:else}
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <!-- svelte-ignore a11y-mouse-events-have-key-events -->
            <span
              class:bx--viz-donut__button={true}
              on:mouseenter={() => setActive(slice)}
              on:mouseleave={() => setActive(null)}
            >
              <span class:bx--viz-donut__swatch={true}></span>
              <span class:bx--viz-donut__label={true}>{slice.label}</span>
              <span class:bx--viz-donut__value={true}>{write(slice)}</span>
            </span>
          {/if}
        </li>
      {/each}
    </ul>
  </div>
</figure>
