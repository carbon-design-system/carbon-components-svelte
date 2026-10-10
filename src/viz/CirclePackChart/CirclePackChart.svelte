<svelte:options immutable />

<script>
  /**
   * @template T
   */

  /**
   * @event {import("./pack-geometry.js").PackLeaf<T> | null} hover Fires when the pointer or keyboard focus moves to another circle, and with `null` when it leaves.
   * @event {{ leaf: import("./pack-geometry.js").PackLeaf<T>; originalEvent: Event }} select Fires when the focused circle is activated by click, Enter, or Space.
   */

  /** @restProps {figure} */

  /**
   * Specify the rows. Rows that share a label within a group are summed.
   * @type {ReadonlyArray<T>}
   */
  export let data = [];

  /**
   * Specify how to read the value from a row: a key or a function.
   * A circle's area follows it.
   * @type {import("../utils/accessor.js").Accessor<T, number>}
   */
  export let value;

  /**
   * Specify how to read a circle's label from a row: a key or a function.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let label;

  /**
   * Specify how to read a circle's parent from a row: a key or a function.
   * Circles of one parent are packed inside it and share its color.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let group = undefined;

  /** Specify the title, shown as the caption and used as the accessible name */
  export let title = "";

  /** Specify the width and height the pack is drawn at. It scales to its container. */
  export let size = 400;

  /** Specify the gap between circles, in pixels */
  export let padding = 3;

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
   * Override the color of a group.
   * @type {Record<string, import("../utils/tokens.js").VizColor>}
   */
  export let colors = {};

  /** Set to `false` to hide the legend, which lists the groups */
  export let legend = true;

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
  import { buildPack } from "./pack-geometry.js";

  const dispatch = createEventDispatcher();

  /** @type {string | null} */
  let activeId = null;
  let focusIndex = -1;

  $: valueOf = toAccessor(value);
  $: labelOf = toAccessor(label);
  $: groupOf = group === undefined ? undefined : toAccessor(group);
  // Depends on the data and the size only, so hover never rebuilds it.
  $: pack = buildPack(data, {
    value: valueOf,
    label: labelOf,
    group: groupOf,
    size,
    padding,
    palette,
    colors,
  });
  $: formatValue = resolveFormat(format, locale);
  // Reading order for the keyboard: group by group, largest first.
  $: order = pack.groups.flatMap((entry) => entry.leaves);
  $: active = order.find((leaf) => leaf.id === activeId) ?? null;
  $: activeColor = active
    ? (pack.groups.find((entry) => entry.key === active.group)?.color ?? "")
    : "";
  $: announcement = active
    ? [
        pack.grouped ? active.group : "",
        `${active.key} ${formatValue(active.value)}`,
      ]
        .filter(Boolean)
        .join(": ")
    : "";

  /** @param {import("./pack-geometry.js").PackLeaf<T> | null} leaf */
  function setActive(leaf) {
    const next = leaf ? leaf.id : null;
    if (next === activeId) return;
    activeId = next;
    dispatch("hover", leaf);
  }

  /** @param {Event} originalEvent */
  function selectActive(originalEvent) {
    if (active) dispatch("select", { leaf: active, originalEvent });
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

<figure bind:this={ref} class:bx--viz-pack={true} {...$$restProps}>
  {#if title}
    <figcaption class:bx--viz-chart__title={true}>{title}</figcaption>
  {/if}
  <div class:bx--viz-pack__plot={true} style:max-width="{size}px">
    <!-- A chart is one tab stop. Arrow keys move between circles. -->
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-mouse-events-have-key-events -->
    <svg
      class:bx--viz-pack__svg={true}
      class:bx--viz-pack__svg--emphasis={activeId !== null}
      viewBox="0 0 {size} {size}"
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
        {#each pack.groups as entry (entry.key)}
          <g style:--bx-viz-color={entry.color}>
            {#if pack.grouped}
              <circle
                class:bx--viz-pack__group={true}
                cx={entry.cx}
                cy={entry.cy}
                r={entry.r}
              />
            {/if}
            {#each entry.leaves as leaf (leaf.id)}
              <circle
                class:bx--viz-pack__leaf={true}
                class:bx--viz-pack__leaf--active={leaf.id === activeId}
                cx={leaf.cx}
                cy={leaf.cy}
                r={leaf.r}
                on:mouseenter={() => setActive(leaf)}
              />
              {#if leaf.label}
                <text
                  class:bx--viz-pack__label={true}
                  x={leaf.cx}
                  y={leaf.cy}
                  dy="0.32em"
                  text-anchor="middle"
                >
                  {leaf.label}
                </text>
              {/if}
            {/each}
          </g>
        {/each}
      </g>
    </svg>
    {#if active}
      <div
        class:bx--viz-chart-tooltip={true}
        class:bx--viz-chart-tooltip--flipped={active.cx > size / 2}
        aria-hidden="true"
        style:left="{((active.cx +
          (active.cx > size / 2 ? -active.r : active.r)) /
          size) *
          100}%"
        style:top="{(active.cy / size) * 100}%"
      >
        {#if pack.grouped}
          <div class:bx--viz-chart-tooltip__title={true}>{active.group}</div>
        {/if}
        <ChartTooltipRow
          color={activeColor}
          label={active.key}
          value={formatValue(active.value)}
        />
      </div>
    {/if}
  </div>
  <!-- Every value, as an outline, for assistive technology. -->
  <ul class:bx--visually-hidden={true}>
    {#each pack.groups as entry (entry.key)}
      {#if pack.grouped}
        <li>
          {entry.key}: {formatValue(entry.value)}
          <ul>
            {#each entry.leaves as leaf (leaf.id)}
              <li>{leaf.key}: {formatValue(leaf.value)}</li>
            {/each}
          </ul>
        </li>
      {:else}
        {#each entry.leaves as leaf (leaf.id)}
          <li>{leaf.key}: {formatValue(leaf.value)}</li>
        {/each}
      {/if}
    {/each}
  </ul>
  <div class:bx--visually-hidden={true} aria-live="polite">{announcement}</div>
  {#if legend && pack.grouped}
    <ul class:bx--viz-treemap__legend={true} aria-hidden="true">
      {#each pack.groups as entry (entry.key)}
        <li
          class:bx--viz-treemap__legend-item={true}
          style:--bx-viz-color={entry.color}
        >
          <span class:bx--viz-treemap__swatch={true}></span>
          {entry.key}
        </li>
      {/each}
    </ul>
  {/if}
</figure>
