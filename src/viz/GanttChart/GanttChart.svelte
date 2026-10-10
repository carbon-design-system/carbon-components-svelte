<svelte:options immutable />

<script>
  /**
   * @template T
   */

  /**
   * The task type is written inline: a typedef cannot carry the generic
   * into the generated declarations.
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

  /** Specify the width the chart is drawn at. It scales to its container. */
  export let width = 720;

  /** Specify the height of a task row, in pixels */
  export let rowHeight = 28;

  /** Specify the room for task labels, in pixels */
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

  import { createEventDispatcher } from "svelte";
  import ChartTooltipRow from "../Chart/ChartTooltipRow.svelte";
  import { toAccessor } from "../utils/accessor.js";
  import { formatDuration, formatPercent } from "../utils/format-compact.js";
  import { nextId } from "../utils/next-id.js";
  import { buildGantt } from "./gantt-geometry.js";

  const dispatch = createEventDispatcher();
  const AXIS = 24;
  const PAD = 8;
  const markerId = nextId("bx-viz-gantt");

  let active = -1;

  $: idOf = id === undefined ? undefined : toAccessor(id);
  $: labelOf = label === undefined ? undefined : toAccessor(label);
  $: groupOf = group === undefined ? undefined : toAccessor(group);
  $: startOf = toAccessor(start);
  $: endOf = toAccessor(end);
  $: progressOf = progress === undefined ? undefined : toAccessor(progress);
  $: dependsOf = dependsOn === undefined ? undefined : toAccessor(dependsOn);
  $: plot = { x0: labelSpace, x1: width - PAD };
  // Depends on the data and the shape only, so hover never lays out again.
  $: gantt = buildGantt(data, {
    id: idOf,
    label: labelOf,
    group: groupOf,
    start: startOf,
    end: endOf,
    progress: progressOf,
    dependsOn: dependsOf,
    domain,
    colors,
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
    if (current) dispatch("select", { task: detail(current), originalEvent });
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
        setActive(-1);
        return;
      default:
        return;
    }
    event.preventDefault();
    setActive(next);
  }
</script>

<figure
  bind:this={ref}
  class:bx--viz-gantt={true}
  class:bx--viz-gantt--emphasis={active >= 0}
  {...$$restProps}
>
  {#if title}
    <figcaption class:bx--viz-chart__title={true}>{title}</figcaption>
  {/if}
  <div class:bx--viz-gantt__plot={true} style:max-width="{width}px">
    <!-- A chart is one tab stop. Arrow keys move task by task. -->
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <svg
      class:bx--viz-gantt__svg={true}
      viewBox="0 0 {width} {height}"
      role="application"
      aria-roledescription="chart"
      aria-label={title || undefined}
      tabindex="0"
      on:keydown={onKeydown}
      on:click={selectActive}
      on:pointerleave={() => setActive(-1)}
      on:blur={() => setActive(-1)}
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
            text-anchor="middle"
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
              {width}
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
            <g
              class:bx--viz-gantt__task={true}
              class:bx--viz-gantt__task--active={i === active}
              style:--bx-viz-color={task.color}
              on:mouseenter={() => setActive(i)}
            >
              <rect
                class:bx--viz-gantt__hit={true}
                x="0"
                y={task.y}
                {width}
                height={rowHeight}
              />
              <text
                class:bx--viz-gantt__label={true}
                x={labelSpace - PAD}
                y={task.y + rowHeight / 2}
                dy="0.32em"
                text-anchor="end"
              >
                {task.label}
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
    {#if current}
      <div
        class:bx--viz-chart-tooltip={true}
        class:bx--viz-chart-tooltip--flipped={current.x0 > width / 2}
        aria-hidden="true"
        style:left="{(current.x0 / width) * 100}%"
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
  {#if legend && gantt.groups.length > 1}
    <ul class:bx--viz-treemap__legend={true} aria-hidden="true">
      {#each gantt.groups as entry (entry.key)}
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
