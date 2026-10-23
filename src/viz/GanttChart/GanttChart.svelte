<svelte:options immutable />

<script>
  /**
   * @template T
   */

  /**
   * The task type is written inline: a typedef cannot carry the generic
   * into the generated declarations.
   * @event {{ series: string; hidden: boolean }} legend:toggle Fires when a group is shown or hidden from the legend.
   * @event {{ id: string; label: string; group: string; from: number; to: number; duration: number; progress: number | null; datum: T; index: number } | null} hover Fires when the pointer or keyboard focus moves to another task, and with `null` when it leaves.
   * @event {{ task: { id: string; label: string; group: string; from: number; to: number; duration: number; progress: number | null; datum: T; index: number }; originalEvent: Event }} select Fires when the focused task is activated by click, Enter, or Space.
   */

  /** @restProps {figure} */

  /**
   * Specify the tasks, one row each.
   * @type {ReadonlyArray<T>}
   */
  export let data = [];

  /**
   * Specify how to read a task's id, which dependencies refer to. Defaults
   * to the row's index.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let id = undefined;

  /**
   * Specify how to read a task's label.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let label = undefined;

  /**
   * Specify how to read the workstream a task belongs to. Tasks are grouped
   * under it, and it sets their color.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let group = undefined;

  /**
   * Specify how to read when a task starts: a `Date`, a timestamp, or a
   * date string.
   * @type {import("../utils/accessor.js").Accessor<T, Date | number | string>}
   */
  export let start;

  /**
   * Specify how to read when a task ends.
   * @type {import("../utils/accessor.js").Accessor<T, Date | number | string>}
   */
  export let end;

  /**
   * Specify how to read how much of a task is done, 0 to 1.
   * @type {import("../utils/accessor.js").Accessor<T, number | null | undefined>}
   */
  export let progress = undefined;

  /**
   * Specify how to read the id, or ids, of the tasks a task waits for.
   * @type {import("../utils/accessor.js").Accessor<T, string | number | ReadonlyArray<string | number> | null | undefined>}
   */
  export let dependsOn = undefined;

  /** Specify the title, shown as the caption and used as the accessible name */
  export let title = "";

  /** Set to `true` to show a skeleton while the data is on its way */
  export let loading = false;

  /** Specify the text shown when there is no data */
  export let emptyText = "No data";

  /** Set to `true` to make tasks selectable */
  export let selectable = false;

  /**
   * Specify the selected task id.
   * @type {string | null}
   */
  export let selected = null;

  /**
   * Specify the time range shown. Defaults to the earliest start and the
   * latest end, widened to whole days.
   * @type {readonly [Date | number | string, Date | number | string]}
   */
  export let domain = undefined;

  /**
   * Specify a moment to mark with a rule, such as now.
   * @type {Date | number | string}
   */
  export let today = undefined;

  /** Specify the label of the rule at `today` */
  export let todayLabel = "Today";

  /**
   * Specify the width in pixels, or `"auto"` to fill the container.
   * @type {number | "auto"}
   */
  export let width = "auto";

  // The width laid out at: the container's under `"auto"`, the nominal
  // 720 before it is measured.
  let measuredWidth = 0;
  $: layoutWidth = width === "auto" ? measuredWidth || 720 : width;

  /** Specify the height of a task row, in pixels */
  export let rowHeight = 28;

  /**
   * Specify how many rows the loading and empty states reserve, so the chart
   * holds its height until the data arrives.
   */
  export let placeholderRows = 4;

  /**
   * Specify the room for task labels, in pixels. A label that does not fit
   * is cut with an ellipsis, and the column never takes more than half of
   * a narrow container.
   */
  export let labelSpace = 160;

  /**
   * Specify a color per workstream: a semantic name, a categorical index, a
   * viz token name, or any CSS color.
   * @type {Record<string, import("../utils/tokens.js").VizColor>}
   */
  export let colors = {};

  /**
   * Specify which of Carbon's prescribed color groups to use (1-based).
   */
  export let palette = 1;

  /** Set to `false` to hide the legend, which lists the workstreams */
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

  /** Set to `true` to place ticks on UTC boundaries */
  export let utc = false;

  /**
   * Override the column headers of the table for assistive technology.
   * @type {{ task?: string; group?: string; start?: string; end?: string; progress?: string; dependsOn?: string }}
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

  import { createEventDispatcher, onMount } from "svelte";
  import ChartTooltipRow from "../Chart/ChartTooltipRow.svelte";
  import { toAccessor } from "../utils/accessor.js";
  import { formatDuration, formatPercent } from "../utils/format-compact.js";
  import {
    colorGroups,
    dropGroups,
    listGroups,
    nextHidden,
  } from "../utils/group-legend.js";
  import { nextId } from "../utils/next-id.js";
  import { observeResize } from "../utils/resize-pool.js";
  import { createTooltipTiming } from "../utils/tooltip-timing.js";
  import { buildGantt } from "./gantt-geometry.js";

  const dispatch = createEventDispatcher();
  const tooltipTiming = createTooltipTiming(150, {
    onUnpin: () => setActive(-1),
  });
  const { shown: tooltipShown, pinned: tooltipPinned } = tooltipTiming;
  const AXIS = 24;
  const PAD = 8;
  const markerId = nextId("bx-viz-gantt");

  let active = -1;

  $: idOf = id === undefined ? undefined : toAccessor(id);
  $: labelOf = label === undefined ? undefined : toAccessor(label);
  $: groupOf = group === undefined ? undefined : toAccessor(group);
  $: groupKeysAll = listGroups(data, groupOf);
  $: groupColorMap = colorGroups(groupKeysAll, palette, colors);
  $: hiddenSet = new Set(hidden.map(String));
  $: visibleRows = dropGroups(data, groupOf, hiddenSet);
  $: startOf = toAccessor(start);
  $: endOf = toAccessor(end);
  $: progressOf = progress === undefined ? undefined : toAccessor(progress);
  $: dependsOf = dependsOn === undefined ? undefined : toAccessor(dependsOn);
  // The label column yields to the plot in a narrow container.
  $: labelColumn = Math.min(labelSpace, Math.floor(layoutWidth / 2));
  $: plot = { x0: labelColumn, x1: layoutWidth - PAD };
  // Depends on the data and the shape only, so hover never lays out again.
  $: gantt = buildGantt(visibleRows, {
    id: idOf,
    label: labelOf,
    group: groupOf,
    start: startOf,
    end: endOf,
    progress: progressOf,
    dependsOn: dependsOf,
    domain,
    colors: groupColorMap,
    palette,
    plot,
    rowHeight,
    locale,
    utc,
  });
  $: height = AXIS + gantt.height + (nowX === undefined ? PAD : AXIS);
  $: headers = {
    task: "Task",
    group: "Workstream",
    start: "Start",
    end: "End",
    progress: "Done",
    dependsOn: "Waits for",
    ...headerLabels,
  };
  $: now = today === undefined ? undefined : toMs(today);
  $: nowX =
    now !== undefined && now >= gantt.domain[0] && now <= gantt.domain[1]
      ? gantt.x.map(now)
      : undefined;
  $: current = active >= 0 ? gantt.tasks[active] : undefined;
  $: describe = (
    /** @type {import("./gantt-geometry.js").GanttRow<T>} */ task,
  ) =>
    [
      task.label,
      task.group,
      `${gantt.xLabel(task.from)} to ${gantt.xLabel(task.to)}`,
      formatDuration(task.duration, { locale, largest: 1 }),
      task.progress === null
        ? ""
        : `${formatPercent(task.progress, { locale, digits: 0 })} ${headers.progress.toLowerCase()}`,
    ]
      .filter(Boolean)
      .join(", ");
  $: announcement = current ? describe(current) : "";

  /** @param {Date | number | string} value */
  function toMs(value) {
    return value instanceof Date ? value.getTime() : new Date(value).getTime();
  }

  /** @param {import("./gantt-geometry.js").GanttRow<T>} task */
  function detail(task) {
    return {
      id: task.id,
      label: task.label,
      group: task.group,
      from: task.from,
      to: task.to,
      duration: task.duration,
      progress: task.progress,
      datum: task.row,
      index: task.index,
    };
  }

  /** @param {number} index */
  function setActive(index) {
    if (index === active) return;
    active = index;
    dispatch("hover", index >= 0 ? detail(gantt.tasks[index]) : null);
  }

  /** @param {Event} originalEvent */
  function selectActive(originalEvent) {
    if (!selectable || !current) return;
    selected = selected === current.id ? null : current.id;
    dispatch("select", { task: detail(current), originalEvent });
  }

  /** @param {KeyboardEvent} event */
  function onKeydown(event) {
    const last = gantt.tasks.length - 1;
    if (last < 0) return;
    let next = active;
    switch (event.key) {
      case "ArrowDown":
      case "ArrowRight":
        next = Math.min(last, active + 1);
        break;
      case "ArrowUp":
      case "ArrowLeft":
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
  $: placeholderHeight = AXIS + placeholderRows * rowHeight + PAD;
</script>

<figure
  class:bx--viz-chart--loading={loading}
  class:bx--viz-chart--empty={empty}
  aria-busy={loading ? "true" : undefined}
  bind:this={ref}
  class:bx--viz-gantt={true}
  class:bx--viz-gantt--emphasis={active >= 0}
  {...$$restProps}
>
  {#if title}
    <figcaption class:bx--viz-chart__title={true}>{title}</figcaption>
  {/if}
  <div class:bx--viz-gantt__plot={true} style:max-width="{layoutWidth}px">
    <!-- A chart is one tab stop. Arrow keys move task by task. -->
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <svg
      class:bx--viz-gantt__svg={true}
      viewBox="0 0 {layoutWidth} {height}"
      role="application"
      aria-roledescription="chart"
      aria-label={title || undefined}
      tabindex="0"
      on:keydown={onKeydown}
      use:tooltipTiming.track
      on:click={selectActive}
      on:pointerleave={() => $tooltipPinned || setActive(-1)}
      on:click={() => tooltipTiming.togglePin()}
      on:blur={() => $tooltipPinned || setActive(-1)}
    >
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path class:bx--viz-gantt__arrow={true} d="M0,0L10,5L0,10Z" />
        </marker>
      </defs>
      <g aria-hidden="true">
        {#each gantt.ticks as tick (tick.value)}
          <text
            class:bx--viz-gantt__tick={true}
            x={tick.px}
            y={AXIS - 8}
            text-anchor={tick.px > plot.x1 - 28
              ? "end"
              : tick.px < plot.x0 + 28
                ? "start"
                : "middle"}
          >
            {tick.label}
          </text>
          <line
            class:bx--viz-gantt__grid={true}
            x1={tick.px}
            x2={tick.px}
            y1={AXIS}
            y2={AXIS + gantt.height}
          />
        {/each}
        <g transform="translate(0 {AXIS})">
          {#each gantt.groups as entry (entry.key)}
            <rect
              class:bx--viz-gantt__group={true}
              x="0"
              y={entry.y}
              width={layoutWidth}
              height={entry.count * rowHeight}
            />
            <text
              class:bx--viz-gantt__group-label={true}
              x={PAD}
              y={entry.y + rowHeight / 2}
              dy="0.32em"
              style:--bx-viz-color={entry.color}
            >
              {entry.key}
            </text>
          {/each}
          {#each gantt.links as link (link.id)}
            <path
              class:bx--viz-gantt__link={true}
              class:bx--viz-gantt__link--late={link.late}
              d={link.d}
              marker-end="url(#{markerId})"
            />
          {/each}
          {#each gantt.tasks as task, i (task.id)}
            <!-- svelte-ignore a11y-mouse-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <g
              class:bx--viz-gantt__task={true}
              class:bx--viz-gantt__task--active={i === active}
              class:bx--viz-gantt__task--selected={task.id === selected}
              style:--bx-viz-color={task.color}
              on:mouseenter={() => $tooltipPinned || setActive(i)}
            >
              <rect
                class:bx--viz-gantt__hit={true}
                x="0"
                y={task.y}
                width={layoutWidth}
                height={rowHeight}
              />
              <text
                class:bx--viz-gantt__label={true}
                x={labelColumn - PAD}
                y={task.y + rowHeight / 2}
                dy="0.32em"
                text-anchor="end"
              >
                {task.short}
              </text>
              <rect
                class:bx--viz-gantt__bar={true}
                x={task.x0}
                y={task.y + rowHeight * 0.2}
                width={Math.max(task.x1 - task.x0, 2)}
                height={rowHeight * 0.6}
              />
              {#if task.progress !== null}
                <rect
                  class:bx--viz-gantt__done={true}
                  x={task.x0}
                  y={task.y + rowHeight * 0.2}
                  width={Math.max((task.x1 - task.x0) * task.progress, 0)}
                  height={rowHeight * 0.6}
                />
              {/if}
            </g>
          {/each}
          {#if nowX !== undefined}
            <line
              class:bx--viz-gantt__today={true}
              x1={nowX}
              x2={nowX}
              y1="0"
              y2={gantt.height}
            />
            <!-- Under the plot, clear of the tick labels above it. -->
            <text
              class:bx--viz-gantt__today-label={true}
              x={nowX}
              y={gantt.height + 14}
              text-anchor="middle"
            >
              {todayLabel}
            </text>
          {/if}
        </g>
      </g>
    </svg>
    {#if current && $tooltipShown}
      <div
        class:bx--viz-chart-tooltip={true}
        class:bx--viz-chart-tooltip--flipped={current.x0 > layoutWidth / 2}
        aria-hidden="true"
        style:left="{(current.x0 / layoutWidth) * 100}%"
        style:top="{((AXIS + current.y + rowHeight) / height) * 100}%"
      >
        <div class:bx--viz-chart-tooltip__title={true}>{current.label}</div>
        <ChartTooltipRow
          color={current.color}
          label={current.group}
          value={formatDuration(current.duration, { locale, largest: 1 })}
        />
        <ChartTooltipRow
          label={headers.start}
          value={gantt.xLabel(current.from)}
        />
        <ChartTooltipRow label={headers.end} value={gantt.xLabel(current.to)} />
        {#if current.progress !== null}
          <ChartTooltipRow
            label={headers.progress}
            value={formatPercent(current.progress, { locale, digits: 0 })}
          />
        {/if}
      </div>
    {/if}
  </div>
  <!-- Every task, for assistive technology: a bar says nothing to it. -->
  <table class:bx--visually-hidden={true}>
    {#if title}
      <caption>
        {title}
      </caption>
    {/if}
    <thead>
      <tr>
        <th scope="col">{headers.task}</th>
        <th scope="col">{headers.group}</th>
        <th scope="col">{headers.start}</th>
        <th scope="col">{headers.end}</th>
        <th scope="col">{headers.progress}</th>
        <th scope="col">{headers.dependsOn}</th>
      </tr>
    </thead>
    <tbody>
      {#each gantt.tasks as task (task.id)}
        <tr>
          <th scope="row">{task.label}</th>
          <td>{task.group}</td>
          <td>{gantt.xLabel(task.from)}</td>
          <td>{gantt.xLabel(task.to)}</td>
          <td>
            {task.progress === null
              ? "–"
              : formatPercent(task.progress, { locale, digits: 0 })}
          </td>
          <td>
            {task.deps
              .map(
                (dep) =>
                  gantt.tasks.find((entry) => entry.id === dep)?.label ?? dep,
              )
              .join(", ") || "–"}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
  <div class:bx--visually-hidden={true} aria-live="polite">{announcement}</div>
  {#if loading}
    <div
      class:bx--viz-chart__state={true}
      style:block-size="{placeholderHeight}px"
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
      style:block-size="{placeholderHeight}px"
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
