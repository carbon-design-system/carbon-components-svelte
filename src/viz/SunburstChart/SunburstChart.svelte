<svelte:options immutable />

<script>
  /**
   * @template T
   */

  /**
   * The node type is written inline: a typedef cannot carry the generic
   * into the generated declarations.
   * @event {{ series: string; hidden: boolean }} legend:toggle Fires when a group is shown or hidden from the legend.
   * @event {{ id: string; parent: string | null; label: string; depth: number; value: number; own: number; share: number; leaf: boolean; color: string; datum: T; index: number } | null} hover Fires when the pointer or keyboard focus moves to another arc, and with `null` when it leaves.
   * @event {{ node: { id: string; parent: string | null; label: string; depth: number; value: number; own: number; share: number; leaf: boolean; color: string; datum: T; index: number }; originalEvent: Event }} select Fires when the focused arc is activated by click, Enter, or Space.
   * @slot {{ center: { id: string; label: string; value: number } | null; total: number; formattedTotal: string }}
   */

  /** @restProps {figure} */

  /**
   * Specify the nodes, one row each.
   * @type {ReadonlyArray<T>}
   */
  export let data = [];

  /**
   * Specify how to read a node's id: a key or a function.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let id;

  /**
   * Specify how to read a node's parent id. A node with none is a root.
   * @type {import("../utils/accessor.js").Accessor<T, string | number | null | undefined>}
   */
  export let parent;

  /**
   * Specify how to read a node's value. A parent without one is worth its
   * children, and never less than they add up to.
   * @type {import("../utils/accessor.js").Accessor<T, number | null | undefined>}
   */
  export let value;

  /**
   * Specify how to read a node's label. Defaults to its id.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let label = undefined;

  /**
   * Specify how to read what colors a node. By default a node takes the
   * color of its ancestor just under the center, so each branch has a hue.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let group = undefined;

  /** Specify the title, shown as the caption and used as the accessible name */
  export let title = "";

  /** Set to `true` to show a skeleton while the data is on its way */
  export let loading = false;

  /** Specify the text shown when there is no data */
  export let emptyText = "No data";

  /** Set to `true` to show the error state instead of the data */
  export let error = false;

  /** Specify the text shown in the error state */
  export let errorText = "Could not load this chart";

  /** Set to `true` to make arcs selectable */
  export let selectable = false;

  /**
   * Specify the selected node id.
   * @type {string | null}
   */
  export let selected = null;

  /**
   * Specify the node at the center. Its ancestors are not drawn; the
   * center is the way back up. Bind it to drill in from `select`.
   * @type {string | number | null}
   */
  export let root = null;

  /**
   * Specify how many rings to draw around the center.
   * @type {number}
   */
  export let maxDepth = undefined;

  /**
   * Specify the order of siblings: as given, or largest first.
   * @type {"none" | "value"}
   */
  export let sort = "none";

  /** Specify the diameter, in pixels. It scales down with its container. */
  export let diameter = 320;

  /** Specify the hole in the middle as a share of the radius */
  export let innerRadius = 0.25;

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

  /** Set to `false` to hide the legend, which lists the branches */
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

  /** Specify the label of the button in the center that steps back up */
  export let upLabel = "Up";

  /**
   * Override the column headers of the table for assistive technology.
   * @type {{ node?: string; level?: string; value?: string; share?: string }}
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
  import { formatPercent, resolveFormat } from "../utils/format-compact.js";
  import {
    branchAccessor,
    colorGroups,
    listGroups,
    nextHidden,
    pruneGroups,
  } from "../utils/group-legend.js";
  import { createTooltipTiming } from "../utils/tooltip-timing.js";
  import { buildSunburst } from "./sunburst-geometry.js";

  const dispatch = createEventDispatcher();
  const tooltipTiming = createTooltipTiming(150, {
    onUnpin: () => setActive(-1),
    onHide: () => setActive(-1),
  });
  const { shown: tooltipShown, pinned: tooltipPinned } = tooltipTiming;

  let active = -1;

  $: idOf = toAccessor(id);
  $: parentOf = toAccessor(parent);
  $: valueOf = toAccessor(value);
  $: labelOf = label === undefined ? undefined : toAccessor(label);
  $: groupOf = group === undefined ? undefined : toAccessor(group);
  // Without a group field the legend lists the branches under the center,
  // as the chart colors them, and hiding one prunes its subtree.
  $: keyOfRow =
    groupOf === undefined
      ? branchAccessor(data, idOf, parentOf, root)
      : groupOf;
  $: labelByKey = new Map(
    data.map((row, i) => [
      String(idOf(row, i)),
      String(labelOf ? labelOf(row, i) : idOf(row, i)),
    ]),
  );
  $: groupKeysAll = listGroups(data, keyOfRow);
  $: groupColorMap = colorGroups(groupKeysAll, palette, colors);
  $: hiddenSet = new Set(hidden.map(String));
  $: visibleRows = pruneGroups(data, idOf, parentOf, keyOfRow, hiddenSet);
  // Depends on the data and the options only, so hover never lays out again.
  $: sun = buildSunburst(visibleRows, {
    id: idOf,
    parent: parentOf,
    value: valueOf,
    label: labelOf,
    group: groupOf,
    sort,
    root: root ?? undefined,
    maxDepth,
    radius: diameter / 2,
    innerRadius,
    palette,
    colors: groupColorMap,
  });
  $: formatValue = resolveFormat(format, locale);
  $: headers = {
    node: "Node",
    level: "Level",
    value: "Value",
    share: "Share",
    ...headerLabels,
  };
  $: current = active >= 0 ? sun.arcs[active] : undefined;
  $: announcement = current
    ? `${current.label}: ${formatValue(current.value)}, ${formatPercent(current.share, { locale, digits: 0 })}`
    : "";

  /** @param {import("./sunburst-geometry.js").SunburstArc<T>} arc */
  function detail(arc) {
    return {
      id: arc.id,
      parent: arc.parent,
      label: arc.label,
      depth: arc.depth,
      value: arc.value,
      own: arc.own,
      share: arc.share,
      leaf: arc.leaf,
      color: arc.color,
      datum: arc.datum,
      index: arc.index,
    };
  }

  /** @param {number} index */
  function setActive(index) {
    if (index === active) return;
    active = index;
    dispatch("hover", index >= 0 ? detail(sun.arcs[index]) : null);
  }

  /** @param {Event} originalEvent */
  function selectActive(originalEvent) {
    if (!selectable || !current) return;
    selected = selected === current.id ? null : current.id;
    dispatch("select", { node: detail(current), originalEvent });
  }

  function up() {
    if (sun.center?.parent === null) root = null;
    else if (sun.center) root = sun.center.parent;
  }

  /** @param {KeyboardEvent} event */
  function onKeydown(event) {
    const last = sun.arcs.length - 1;
    if (last < 0) return;
    let next = active;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        next = Math.min(last, active + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        next = Math.max(0, active - 1);
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = last;
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        selectActive(event);
        return;
      case "Backspace":
        event.preventDefault();
        up();
        return;
      case "Escape":
        tooltipTiming.unpin();
        setActive(-1);
        return;
      default:
        return;
    }
    event.preventDefault();
    setActive(next);
  }
  $: tooltipTiming.settle(current);

  /** @param {string} key */
  function toggleGroup(key) {
    const next = nextHidden(hidden, key, groupKeysAll.length);
    if (!next) return;
    hidden = next;
    dispatch("legend:toggle", { series: key, hidden: !hiddenSet.has(key) });
  }
  $: empty = !loading && !error && data.length === 0;
</script>

<figure
  class:bx--viz-chart--loading={loading}
  class:bx--viz-chart--empty={empty}
  class:bx--viz-chart--error={error}
  aria-busy={loading ? "true" : undefined}
  bind:this={ref}
  class:bx--viz-sunburst={true}
  class:bx--viz-sunburst--emphasis={active >= 0}
  {...$$restProps}
>
  {#if title}
    <figcaption class:bx--viz-chart__title={true}>{title}</figcaption>
  {/if}
  <div class:bx--viz-sunburst__plot={true} style:max-width="{diameter}px">
    <!-- A chart is one tab stop. Arrow keys move arc by arc, Backspace steps up. -->
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <svg
      class:bx--viz-sunburst__svg={true}
      viewBox="0 0 {diameter} {diameter}"
      role="application"
      aria-roledescription="chart"
      aria-label={title || undefined}
      tabindex="0"
      on:keydown={onKeydown}
      use:tooltipTiming.track
      on:click={selectActive}
      on:pointerleave={tooltipTiming.leave}
      on:click={() => tooltipTiming.togglePin()}
      on:blur={() => $tooltipPinned || setActive(-1)}
    >
      <g aria-hidden="true">
        {#each sun.arcs as arc, i (arc.id)}
          <!-- svelte-ignore a11y-mouse-events-have-key-events -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <path
            class:bx--viz-sunburst__arc={true}
            class:bx--viz-sunburst__arc--active={i === active}
            class:bx--viz-sunburst__arc--selected={arc.id === selected}
            d={arc.d}
            style:--bx-viz-color={arc.color}
            style:--bx-viz-ring={group === undefined ? arc.ring : 0}
            on:mouseenter={() => tooltipTiming.enter(() => setActive(i))}
            on:mouseleave={tooltipTiming.leave}
          />
        {/each}
      </g>
    </svg>
    <div
      class:bx--viz-sunburst__center={true}
      style:--bx-viz-hole="{sun.hole * 2}px"
    >
      <slot
        center={sun.center
          ? {
              id: sun.center.id,
              label: sun.center.label,
              value: sun.center.value,
            }
          : null}
        total={sun.total}
        formattedTotal={formatValue(sun.total)}
      >
        {#if sun.center && sun.center.parent !== null}
          <button
            type="button"
            class:bx--viz-sunburst__up={true}
            aria-label="{upLabel}: {sun.center.label}"
            on:click={up}
          >
            <span class:bx--viz-sunburst__center-label={true}
              >{sun.center.label}</span
            >
            <span class:bx--viz-sunburst__center-value={true}
              >{formatValue(sun.center.value)}</span
            >
          </button>
        {:else}
          <span class:bx--viz-sunburst__center-label={true}
            >{sun.center?.label ?? ""}</span
          >
          <span class:bx--viz-sunburst__center-value={true}
            >{formatValue(sun.total)}</span
          >
        {/if}
      </slot>
    </div>
    {#if current && $tooltipShown}
      <div
        class:bx--viz-chart-tooltip={true}
        class:bx--viz-chart-tooltip--flipped={current.cx > diameter / 2}
        aria-hidden="true"
        style:left="{(current.cx / diameter) * 100}%"
        style:top="{(current.cy / diameter) * 100}%"
      >
        <ChartTooltipRow
          color={current.color}
          label={current.label}
          value="{formatValue(current.value)} ({formatPercent(current.share, {
            locale,
            digits: 0,
          })})"
        />
      </div>
    {/if}
  </div>
  <!-- Every arc, for assistive technology: a ring says nothing to it. -->
  <table class:bx--visually-hidden={true}>
    {#if title}
      <caption>
        {title}
      </caption>
    {/if}
    <thead>
      <tr>
        <th scope="col">{headers.node}</th>
        <th scope="col">{headers.level}</th>
        <th scope="col">{headers.value}</th>
        <th scope="col">{headers.share}</th>
      </tr>
    </thead>
    <tbody>
      {#each sun.arcs as arc (arc.id)}
        <tr>
          <th scope="row">{arc.label}</th>
          <td>{arc.ring + 1}</td>
          <td>{formatValue(arc.value)}</td>
          <td>{formatPercent(arc.share, { locale, digits: 0 })}</td>
        </tr>
      {/each}
    </tbody>
  </table>
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
  {:else if error}
    <div class:bx--viz-chart__state={true} style:block-size="{diameter}px">
      <div class:bx--viz-chart__error={true}>
        <slot name="error">{errorText}</slot>
      </div>
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
          {groupOf === undefined ? (labelByKey.get(key) ?? key) : key}
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
