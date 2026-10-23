<svelte:options immutable />

<script>
  /**
   * @template T
   */

  /**
   * @event {{ series: string; hidden: boolean }} legend:toggle Fires when a group is shown or hidden from the legend.
   * @event {{ leaf: import("./treemap-geometry.js").TreemapLeaf<T>; originalEvent: Event }} select Fires when a cell is activated by click or keyboard. Requires `selectable`.
   * @event {import("./treemap-geometry.js").TreemapLeaf<T> | null} hover Fires when the pointer or focus enters a cell, and with `null` when it leaves.
   */

  /** @restProps {figure} */

  /**
   * Specify the rows. Rows that share a label within a group are summed.
   * @type {ReadonlyArray<T>}
   */
  export let data = [];

  /**
   * Specify how to read the value from a row: a key or a function.
   * @type {import("../utils/accessor.js").Accessor<T, number>}
   */
  export let value;

  /**
   * Specify how to read a cell's label from a row: a key or a function.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let label;

  /**
   * Specify how to read a cell's parent from a row: a key or a function.
   * Cells of one parent sit together and share its color.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let group = undefined;

  /** Specify the title, shown as the caption */
  export let title = "";

  /**
   * Set to `true` to animate groups and cells to their new place when the
   * data changes. Off where the user prefers reduced motion.
   */
  export let transition = false;

  /** Set to `true` to show a skeleton while the data is on its way */
  export let loading = false;

  /** Specify the text shown when there is no data */
  export let emptyText = "No data";

  /** Specify the width of the map over its height. The width follows the container. */
  export let aspectRatio = 2;

  /**
   * Specify what a cell writes under its label.
   * @type {"value" | "percent" | "none"}
   */
  export let valueType = "value";

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

  /** Set to `true` to make cells selectable */
  export let selectable = false;

  /**
   * Specify the selected cell, as `"group/label"`, or `"label/label"` without groups.
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
  import { rovingFocus } from "../../utils/roving-focus.js";
  import { toAccessor } from "../utils/accessor.js";
  import { formatPercent, resolveFormat } from "../utils/format-compact.js";
  import {
    colorGroups,
    dropGroups,
    listGroups,
    nextHidden,
  } from "../utils/group-legend.js";
  import { buildTreemap } from "./treemap-geometry.js";

  const dispatch = createEventDispatcher();
  // What fits is a matter of a cell's shape, not its area: a wide sliver
  // holds no text however much it is worth. Shares of the whole box.
  const MIN_WIDTH = 0.06;
  const MIN_HEIGHT = 0.1;
  const MIN_HEIGHT_FOR_VALUE = 0.16;

  let focusedIndex = 0;
  /** @type {string | null} */
  let activeId = null;

  $: valueOf = toAccessor(value);
  $: labelOf = toAccessor(label);
  $: groupOf = group === undefined ? undefined : toAccessor(group);
  $: groupKeysAll = listGroups(data, groupOf);
  $: groupColorMap = colorGroups(groupKeysAll, palette, colors);
  $: hiddenSet = new Set(hidden.map(String));
  $: visibleRows = dropGroups(data, groupOf, hiddenSet);
  // Depends on the data and the shape only, so hover never rebuilds it.
  $: map = buildTreemap(visibleRows, {
    value: valueOf,
    label: labelOf,
    group: groupOf,
    aspect: aspectRatio,
    palette,
    colors: groupColorMap,
  });
  $: formatValue = resolveFormat(format, locale);
  $: write = (
    /** @type {import("./treemap-geometry.js").TreemapLeaf<T>} */ leaf,
  ) =>
    valueType === "percent"
      ? formatPercent(leaf.share, { locale, digits: 0 })
      : formatValue(leaf.value);
  $: count = map.groups.reduce((sum, entry) => sum + entry.leaves.length, 0);
  $: tabStopIndex = Math.min(focusedIndex, Math.max(count - 1, 0));

  /** @param {import("./treemap-geometry.js").TreemapLeaf<T> | null} leaf */
  function setActive(leaf) {
    const next = leaf ? leaf.id : null;
    if (next === activeId) return;
    activeId = next;
    dispatch("hover", leaf);
  }

  /**
   * @param {import("./treemap-geometry.js").TreemapLeaf<T>} leaf
   * @param {Event} originalEvent
   */
  function select(leaf, originalEvent) {
    selected = selected === leaf.id ? null : leaf.id;
    dispatch("select", { leaf, originalEvent });
  }

  /**
   * Roving focus across the cells, attached only while `selectable`, so a
   * static map adds no listeners.
   *
   * @param {HTMLElement} node
   * @param {boolean} enabled
   */
  function rovingCells(node, enabled) {
    /** @type {ReturnType<typeof rovingFocus> | undefined} */
    let roving;
    /** @param {boolean} on */
    function sync(on) {
      if (on && !roving) {
        roving = rovingFocus(node, {
          selector: ".bx--viz-treemap__button",
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

  /**
   * Position in tab order of a leaf: groups in order, leaves within them.
   * @param {number} g
   * @param {number} l
   */
  function indexOf(g, l) {
    let at = l;
    for (let k = 0; k < g; k++) at += map.groups[k].leaves.length;
    return at;
  }

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
  class:bx--viz-chart--loading={loading}
  class:bx--viz-chart--empty={empty}
  aria-busy={loading ? "true" : undefined}
  bind:this={ref}
  class:bx--viz-treemap={true}
  class:bx--viz-treemap--transition={transition}
  class:bx--viz-treemap--selectable={selectable}
  class:bx--viz-treemap--emphasis={activeId !== null}
  {...$$restProps}
>
  {#if title}
    <figcaption class:bx--viz-chart__title={true}>{title}</figcaption>
  {/if}
  <!-- The box keeps its shape through padding, so it needs no measurement. -->
  <div
    class:bx--viz-treemap__box={true}
    style:--bx-viz-ratio={aspectRatio}
    use:rovingCells={selectable}
  >
    <ul class:bx--viz-treemap__groups={true}>
      {#each map.groups as entry, g (entry.key)}
        <li
          class:bx--viz-treemap__group={true}
          style:--bx-viz-color={entry.color}
          style:left="{entry.rect.x}%"
          style:top="{entry.rect.y}%"
          style:width="{entry.rect.width}%"
          style:height="{entry.rect.height}%"
        >
          {#if map.grouped}
            <span class:bx--visually-hidden={true}>{entry.key}</span>
          {/if}
          <ul class:bx--viz-treemap__leaves={true}>
            {#each entry.leaves as leaf, l (leaf.id)}
              <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
              <!-- svelte-ignore a11y-mouse-events-have-key-events -->
              <li
                class:bx--viz-treemap__leaf={true}
                class:bx--viz-treemap__leaf--tiny={leaf.span.width <
                  MIN_WIDTH || leaf.span.height < MIN_HEIGHT}
                class:bx--viz-treemap__leaf--short={leaf.span.height <
                  MIN_HEIGHT_FOR_VALUE}
                class:bx--viz-treemap__leaf--active={leaf.id === activeId}
                class:bx--viz-treemap__leaf--selected={selectable &&
                  leaf.id === selected}
                style:left="{leaf.rect.x}%"
                style:top="{leaf.rect.y}%"
                style:width="{leaf.rect.width}%"
                style:height="{leaf.rect.height}%"
                title="{leaf.key}: {write(leaf)}"
                on:mouseenter={() => setActive(leaf)}
                on:mouseleave={() => setActive(null)}
              >
                {#if selectable}
                  <button
                    type="button"
                    class:bx--viz-treemap__button={true}
                    tabindex={indexOf(g, l) === tabStopIndex ? 0 : -1}
                    aria-pressed={leaf.id === selected}
                    on:click={(event) => select(leaf, event)}
                    on:focus={() => {
                      focusedIndex = indexOf(g, l);
                      setActive(leaf);
                    }}
                    on:blur={() => setActive(null)}
                  >
                    <span class:bx--viz-treemap__label={true}>{leaf.key}</span>
                    {#if valueType !== "none"}
                      <span class:bx--viz-treemap__value={true}>
                        {write(leaf)}
                      </span>
                    {/if}
                  </button>
                {:else}
                  <span class:bx--viz-treemap__cell={true}>
                    <span class:bx--viz-treemap__label={true}>{leaf.key}</span>
                    {#if valueType !== "none"}
                      <span class:bx--viz-treemap__value={true}>
                        {write(leaf)}
                      </span>
                    {/if}
                  </span>
                {/if}
              </li>
            {/each}
          </ul>
        </li>
      {/each}
    </ul>
  </div>
  {#if loading}
    <div
      class:bx--viz-chart__state={true}
      style:padding-block-start="calc(100% / {aspectRatio})"
      style:min-block-size="0"
      aria-hidden="true"
    >
      <div
        class:bx--viz-chart__skeleton={true}
        class:bx--skeleton__placeholder={true}
      ></div>
    </div>
  {:else if empty}
    <div
      class:bx--viz-chart__state={true}
      style:padding-block-start="calc(100% / {aspectRatio})"
      style:min-block-size="0"
    >
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
