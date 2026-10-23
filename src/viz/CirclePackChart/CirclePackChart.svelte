<svelte:options immutable />

<script>
  /**
   * @template T
   */

  /**
   * @event {{ series: string; hidden: boolean }} legend:toggle Fires when a group is shown or hidden from the legend.
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

  /** Set to `true` to show a skeleton while the data is on its way */
  export let loading = false;

  /** Specify the text shown when there is no data */
  export let emptyText = "No data";

  /** Set to `true` to make circles selectable */
  export let selectable = false;

  /**
   * Specify the selected circle id.
   * @type {string | null}
   */
  export let selected = null;

  /** Specify the diameter the pack is drawn at, in pixels. It scales to its container. */
  export let diameter = 400;

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
   * Specify the hidden group keys. Bind it: the legend toggles them. The
   * last visible group cannot be hidden.
   * @type {ReadonlyArray<string | number>}
   */
  export let hidden = [];

  /** Specify the accessible name of the legend */
  export let legendLabel = "Groups";

  /** Specify how many legend items show before the rest fold behind a "more" button */
  export let maxLegendItems = 8;

  /**
   * Specify the label of the button that unfolds the rest of the legend.
   * @type {(count: number) => string}
   */
  export let legendMoreLabel = (count) => `+${count} more`;

  /** Specify the label of the button that folds the legend again */
  export let legendLessLabel = "Show less";

  let legendExpanded = false;
  $: legendKeysShown = legendExpanded
    ? groupKeysAll
    : groupKeysAll.slice(0, maxLegendItems);
  $: legendFolded = groupKeysAll.length - legendKeysShown.length;

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
  import {
    colorGroups,
    dropGroups,
    listGroups,
    nextHidden,
  } from "../utils/group-legend.js";
  import { createTooltipTiming } from "../utils/tooltip-timing.js";
  import { buildPack } from "./pack-geometry.js";

  const dispatch = createEventDispatcher();
  const tooltipTiming = createTooltipTiming(150, {
    onUnpin: () => setActive(null),
  });
  const { shown: tooltipShown, pinned: tooltipPinned } = tooltipTiming;

  /** @type {string | null} */
  let activeId = null;
  let focusIndex = -1;

  $: valueOf = toAccessor(value);
  $: labelOf = toAccessor(label);
  $: groupOf = group === undefined ? undefined : toAccessor(group);
  $: groupKeysAll = listGroups(data, groupOf);
  $: groupColorMap = colorGroups(groupKeysAll, palette, colors);
  $: hiddenSet = new Set(hidden.map(String));
  $: visibleRows = dropGroups(data, groupOf, hiddenSet);
  // Depends on the data and the diameter only, so hover never rebuilds it.
  $: pack = buildPack(visibleRows, {
    value: valueOf,
    label: labelOf,
    group: groupOf,
    size: diameter,
    padding,
    palette,
    colors: groupColorMap,
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
    if (!selectable || !active) return;
    selected = selected === active.id ? null : active.id;
    dispatch("select", { leaf: active, originalEvent });
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
        tooltipTiming.unpin();
        setActive(null);
        return;
      default:
        return;
    }
    event.preventDefault();
    setActive(order[focusIndex]);
  }
  $: tooltipTiming.settle(active);

  /** @param {string} key */
  function toggleGroup(key) {
    const next = nextHidden(hidden, key, groupKeysAll.length);
    if (!next) return;
    hidden = next;
    dispatch("legend:toggle", { series: key, hidden: !hiddenSet.has(key) });
  }
  $: empty = !loading && data.length === 0;
</script>

<figure
  bind:this={ref}
  class:bx--viz-pack={true}
  class:bx--viz-chart--loading={loading}
  class:bx--viz-chart--empty={empty}
  aria-busy={loading ? "true" : undefined}
  {...$$restProps}
>
  {#if title}
    <figcaption class:bx--viz-chart__title={true}>{title}</figcaption>
  {/if}
  <div class:bx--viz-pack__plot={true} style:max-width="{diameter}px">
    <!-- A chart is one tab stop. Arrow keys move between circles. -->
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-mouse-events-have-key-events -->
    <svg
      class:bx--viz-pack__svg={true}
      class:bx--viz-pack__svg--emphasis={activeId !== null}
      viewBox="0 0 {diameter} {diameter}"
      role="application"
      aria-roledescription="chart"
      aria-label={title || undefined}
      tabindex="0"
      on:keydown={onKeydown}
      use:tooltipTiming.track
      on:click={selectActive}
      on:mouseleave={() => $tooltipPinned || setActive(null)}
      on:click={() => tooltipTiming.togglePin()}
      on:blur={() => $tooltipPinned || setActive(null)}
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
              <!-- svelte-ignore a11y-no-static-element-interactions -->
              <circle
                class:bx--viz-pack__leaf={true}
                class:bx--viz-pack__leaf--active={leaf.id === activeId}
                class:bx--viz-pack__leaf--selected={leaf.id === selected}
                cx={leaf.cx}
                cy={leaf.cy}
                r={leaf.r}
                on:mouseenter={() => $tooltipPinned || setActive(leaf)}
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
    {#if active && $tooltipShown}
      <div
        class:bx--viz-chart-tooltip={true}
        class:bx--viz-chart-tooltip--flipped={active.cx > diameter / 2}
        aria-hidden="true"
        style:left="{((active.cx +
          (active.cx > diameter / 2 ? -active.r : active.r)) /
          diameter) *
          100}%"
        style:top="{(active.cy / diameter) * 100}%"
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
  {#if loading}
    <div
      class:bx--viz-chart__state={true}
      style:block-size="{diameter}px"
      aria-hidden="true"
    >
      <div
        class:bx--viz-chart__skeleton={true}
        class:bx--skeleton__placeholder={true}
      ></div>
    </div>
  {:else if empty}
    <div class:bx--viz-chart__state={true} style:block-size="{diameter}px">
      <div class:bx--viz-chart__empty={true}>
        <slot name="empty">{emptyText}</slot>
      </div>
    </div>
  {/if}
  {#if legend && (groupKeysAll.length > 1 || loading || empty)}
    <div class:bx--viz-legend={true} role="group" aria-label={legendLabel}>
      {#each legendKeysShown as key (key)}
        <button
          type="button"
          class:bx--viz-legend__item={true}
          class:bx--viz-legend__item--hidden={hiddenSet.has(key)}
          aria-pressed={!hiddenSet.has(key)}
          style:--bx-viz-color={groupColorMap[key]}
          on:click={() => toggleGroup(key)}
        >
          <span class:bx--viz-legend__swatch={true}></span>
          {key}
        </button>
      {/each}
      {#if legendFolded > 0 || legendExpanded}
        <button
          type="button"
          class:bx--viz-legend__item={true}
          class:bx--viz-legend__more={true}
          aria-expanded={legendExpanded}
          on:click={() => {
            legendExpanded = !legendExpanded;
          }}
        >
          {legendExpanded ? legendLessLabel : legendMoreLabel(legendFolded)}
        </button>
      {/if}
    </div>
  {/if}
</figure>
