<svelte:options immutable />

<script>
  /**
   * @template T
   */

  /**
   * The word type is written inline: a typedef cannot carry the generic into
   * the generated declarations.
   * @event {{ series: string; hidden: boolean }} legend:toggle Fires when a group is shown or hidden from the legend.
   * @event {{ text: string; value: number; group: string; rows: T[] } | null} hover Fires when the pointer or keyboard focus moves to another word, and with `null` when it leaves.
   * @event {{ word: { text: string; value: number; group: string; rows: T[] }; originalEvent: Event }} select Fires when the focused word is activated by click, Enter, or Space.
   */

  /** @restProps {figure} */

  /**
   * Specify the rows. Rows that share a word are summed.
   * @type {ReadonlyArray<T>}
   */
  export let data = [];

  /**
   * Specify how to read the word from a row: a key or a function.
   * @type {import("../utils/accessor.js").Accessor<T, string>}
   */
  export let word;

  /**
   * Specify how to read the value from a row: a key or a function.
   * @type {import("../utils/accessor.js").Accessor<T, number>}
   */
  export let value;

  /**
   * Specify how to read a word's group from a row, which sets its color: a
   * key or a function.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let group = undefined;

  /** Specify the title, shown as the caption and used as the accessible name */
  export let title = "";

  /** Set to `true` to show a skeleton while the data is on its way */
  export let loading = false;

  /** Specify the text shown when there is no data */
  export let emptyText = "No data";

  /** Set to `true` to make words selectable */
  export let selectable = false;

  /**
   * Specify the selected word.
   * @type {string | null}
   */
  export let selected = null;

  /**
   * Specify the width in pixels, or `"auto"` to fill the container.
   * @type {number | "auto"}
   */
  export let width = "auto";

  // The width laid out at: the container's under `"auto"`, the nominal
  // 640 before it is measured.
  let measuredWidth = 0;
  $: layoutWidth = width === "auto" ? measuredWidth || 640 : width;

  /** Specify the height the cloud is drawn at */
  export let height = 320;

  /** Specify the font size of the smallest word, in pixels */
  export let minSize = 12;

  /** Specify the font size of the largest word, in pixels */
  export let maxSize = 56;

  /** Specify the most words to place. Only the largest are kept. */
  export let maxWords = 100;

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
   * Specify a fixed color per group.
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

  import { createEventDispatcher, onMount } from "svelte";
  import ChartTooltipRow from "../Chart/ChartTooltipRow.svelte";
  import { toAccessor } from "../utils/accessor.js";
  import { resolveFormat } from "../utils/format-compact.js";
  import {
    colorGroups,
    dropGroups,
    listGroups,
    nextHidden,
  } from "../utils/group-legend.js";
  import { observeResize } from "../utils/resize-pool.js";
  import { createTooltipTiming } from "../utils/tooltip-timing.js";
  import { layoutWords } from "../utils/word-cloud.js";

  const dispatch = createEventDispatcher();
  const tooltipTiming = createTooltipTiming(150, {
    onUnpin: () => setActive(null),
  });
  const { shown: tooltipShown, pinned: tooltipPinned } = tooltipTiming;

  /** @type {string | null} */
  let activeText = null;
  let focusIndex = -1;

  $: wordOf = toAccessor(word);
  $: valueOf = toAccessor(value);
  $: groupOf = group === undefined ? undefined : toAccessor(group);
  $: groupKeysAll = listGroups(data, groupOf);
  $: groupColorMap = colorGroups(groupKeysAll, palette, colors);
  $: hiddenSet = new Set(hidden.map(String));
  $: visibleRows = dropGroups(data, groupOf, hiddenSet);
  $: totals = sum(visibleRows, wordOf, valueOf, groupOf);
  // Depends on the data and the size only, so hover never lays it out again.
  $: cloud = layoutWords(totals, {
    width: layoutWidth,
    height,
    minSize,
    maxSize,
    maxWords,
  });
  $: colorOf = new Map(Object.entries(groupColorMap));
  $: formatValue = resolveFormat(format, locale);
  $: active = cloud.words.find((entry) => entry.text === activeText) ?? null;
  $: announcement = active
    ? `${active.text}: ${formatValue(active.value)}`
    : "";

  /**
   * @param {ReadonlyArray<T>} rows
   * @param {(row: T, index: number) => unknown} textOf
   * @param {(row: T, index: number) => unknown} amountOf
   * @param {((row: T, index: number) => unknown) | undefined} groupAccessor
   */
  function sum(rows, textOf, amountOf, groupAccessor) {
    /** @type {Map<string, { text: string; value: number; group: string; rows: T[] }>} */
    const out = new Map();
    for (let i = 0; i < rows.length; i++) {
      const amount = Number(amountOf(rows[i], i));
      if (!Number.isFinite(amount) || amount <= 0) continue;
      const text = String(textOf(rows[i], i));
      const entry = out.get(text);
      if (entry) {
        entry.value += amount;
        entry.rows.push(rows[i]);
      } else {
        out.set(text, {
          text,
          value: amount,
          group: groupAccessor ? String(groupAccessor(rows[i], i)) : "",
          rows: [rows[i]],
        });
      }
    }
    return [...out.values()];
  }

  /** @param {{ text: string; index: number } | null} placed */
  function setActive(placed) {
    const next = placed ? placed.text : null;
    if (next === activeText) return;
    activeText = next;
    dispatch("hover", placed ? totals[placed.index] : null);
  }

  /** @param {Event} originalEvent */
  function selectActive(originalEvent) {
    if (!selectable || !active) return;
    const text = totals[active.index].text;
    selected = selected === text ? null : text;
    dispatch("select", { word: totals[active.index], originalEvent });
  }

  /** @param {KeyboardEvent} event */
  function onKeydown(event) {
    const last = cloud.words.length - 1;
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
    setActive(cloud.words[focusIndex]);
  }
  $: tooltipTiming.settle(active);

  onMount(() => {
    if (width !== "auto" || !ref) return;
    return observeResize(ref, (measured) => {
      const rounded = Math.round(measured);
      if (rounded > 0) measuredWidth = rounded;
    });
  });

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
  class:bx--viz-word-cloud={true}
  class:bx--viz-chart--loading={loading}
  class:bx--viz-chart--empty={empty}
  aria-busy={loading ? "true" : undefined}
  {...$$restProps}
>
  {#if title}
    <figcaption class:bx--viz-chart__title={true}>{title}</figcaption>
  {/if}
  <div class:bx--viz-word-cloud__plot={true} style:max-width="{layoutWidth}px">
    <!-- A chart is one tab stop. Arrow keys move between words, largest first. -->
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-mouse-events-have-key-events -->
    <svg
      class:bx--viz-word-cloud__svg={true}
      class:bx--viz-word-cloud__svg--emphasis={activeText !== null}
      viewBox="0 0 {layoutWidth} {height}"
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
        {#each cloud.words as placed (placed.text)}
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <text
            class:bx--viz-word-cloud__word={true}
            class:bx--viz-word-cloud__word--active={placed.text === activeText}
            class:bx--viz-word-cloud__word--selected={placed.text === selected}
            x={placed.x}
            y={placed.y}
            dy="0.35em"
            text-anchor="middle"
            font-size={placed.size}
            style:--bx-viz-color={group === undefined
              ? undefined
              : colorOf.get(totals[placed.index].group)}
            on:mouseenter={() => $tooltipPinned || setActive(placed)}
          >
            {placed.text}
          </text>
        {/each}
      </g>
    </svg>
    {#if active && $tooltipShown}
      <div
        class:bx--viz-chart-tooltip={true}
        class:bx--viz-chart-tooltip--flipped={active.x > layoutWidth / 2}
        aria-hidden="true"
        style:left="{(active.x / layoutWidth) * 100}%"
        style:top="{((active.y + active.size / 2) / height) * 100}%"
      >
        <ChartTooltipRow
          color={group === undefined
            ? ""
            : (colorOf.get(totals[active.index].group) ?? "")}
          label={active.text}
          value={formatValue(active.value)}
        />
      </div>
    {/if}
  </div>
  <!-- Every word that was placed, largest first, for assistive technology. -->
  <ol class:bx--visually-hidden={true}>
    {#each cloud.words as placed (placed.text)}
      <li>{placed.text}: {formatValue(placed.value)}</li>
    {/each}
  </ol>
  <div class:bx--visually-hidden={true} aria-live="polite">{announcement}</div>
  {#if loading}
    <div
      class:bx--viz-chart__state={true}
      style:block-size="{height}px"
      aria-hidden="true"
    >
      <div
        class:bx--viz-chart__skeleton={true}
        class:bx--skeleton__placeholder={true}
      ></div>
    </div>
  {:else if empty}
    <div class:bx--viz-chart__state={true} style:block-size="{height}px">
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
