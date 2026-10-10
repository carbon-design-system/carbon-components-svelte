<svelte:options immutable />

<script>
  /**
   * @template T
   */

  /**
   * The word type is written inline: a typedef cannot carry the generic into
   * the generated declarations.
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

  /** Specify the width the cloud is drawn at. It scales to its container. */
  export let width = 640;

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
  import { categoricalColors, vizColor } from "../utils/tokens.js";
  import { layoutWords } from "../utils/word-cloud.js";

  const dispatch = createEventDispatcher();

  /** @type {string | null} */
  let activeText = null;
  let focusIndex = -1;

  $: wordOf = toAccessor(word);
  $: valueOf = toAccessor(value);
  $: groupOf = group === undefined ? undefined : toAccessor(group);
  $: totals = sum(data, wordOf, valueOf, groupOf);
  // Depends on the data and the size only, so hover never lays it out again.
  $: cloud = layoutWords(totals, {
    width,
    height,
    minSize,
    maxSize,
    maxWords,
  });
  $: groups = [...new Set(totals.map((entry) => entry.group))];
  $: colorOf = paint(groups, palette, colors);
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

  /**
   * @param {ReadonlyArray<string>} keys
   * @param {number} option
   * @param {Record<string, import("../utils/tokens.js").VizColor>} fixed
   */
  function paint(keys, option, fixed) {
    const assigned = categoricalColors(keys.length, option);
    /** @type {Map<string, string>} */
    const out = new Map();
    keys.forEach((key, i) => {
      out.set(
        key,
        fixed[key] === undefined
          ? assigned[i]
          : (vizColor(fixed[key]) ?? assigned[i]),
      );
    });
    return out;
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
    if (active) {
      dispatch("select", { word: totals[active.index], originalEvent });
    }
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
        setActive(null);
        return;
      default:
        return;
    }
    event.preventDefault();
    setActive(cloud.words[focusIndex]);
  }
</script>

<figure bind:this={ref} class:bx--viz-word-cloud={true} {...$$restProps}>
  {#if title}
    <figcaption class:bx--viz-chart__title={true}>{title}</figcaption>
  {/if}
  <div class:bx--viz-word-cloud__plot={true} style:max-width="{width}px">
    <!-- A chart is one tab stop. Arrow keys move between words, largest first. -->
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-mouse-events-have-key-events -->
    <svg
      class:bx--viz-word-cloud__svg={true}
      class:bx--viz-word-cloud__svg--emphasis={activeText !== null}
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
        {#each cloud.words as placed (placed.text)}
          <text
            class:bx--viz-word-cloud__word={true}
            class:bx--viz-word-cloud__word--active={placed.text === activeText}
            x={placed.x}
            y={placed.y}
            dy="0.35em"
            text-anchor="middle"
            font-size={placed.size}
            style:--bx-viz-color={group === undefined
              ? undefined
              : colorOf.get(totals[placed.index].group)}
            on:mouseenter={() => setActive(placed)}
          >
            {placed.text}
          </text>
        {/each}
      </g>
    </svg>
    {#if active}
      <div
        class:bx--viz-chart-tooltip={true}
        class:bx--viz-chart-tooltip--flipped={active.x > width / 2}
        aria-hidden="true"
        style:left="{(active.x / width) * 100}%"
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
  {#if legend && group !== undefined}
    <ul class:bx--viz-treemap__legend={true} aria-hidden="true">
      {#each groups as key (key)}
        <li
          class:bx--viz-treemap__legend-item={true}
          style:--bx-viz-color={colorOf.get(key)}
        >
          <span class:bx--viz-treemap__swatch={true}></span>
          {key}
        </li>
      {/each}
    </ul>
  {/if}
</figure>
