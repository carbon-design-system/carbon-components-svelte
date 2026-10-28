<script context="module">
  /** Marks each bar with its task id, so an event target maps back to a task. */
  const BAR_ATTR = "data-gantt-id";

  /** How far the pointer moves before a press on a bar becomes a drag, in px. */
  const DRAG_THRESHOLD = 3;

  /** Width of the Start and End columns of the default list, in px. */
  const DATE_COLUMN_WIDTH = 136;

  /** @param {string | number} id */
  function barSelector(id) {
    return `[${BAR_ATTR}="${CSS.escape(String(id))}"]`;
  }
</script>

<script>
  /** @restProps {table} */

  /**
   * @template [Id=(string|number)]
   * @typedef {object} GanttTask
   * @property {Id} id
   * @property {any} text - The task name
   * @property {Date | string} [start] - First day, as a `Date` or a `YYYY-MM-DD` string. A task without one has no bar.
   * @property {Date | string} [end] - Last day, inclusive. Defaults to `start`.
   * @property {boolean} [milestone] - Draw a diamond on `start` instead of a bar
   * @property {number} [progress] - Percent complete, 0 to 100
   * @property {boolean} [readonly] - Keep the bar from being moved or resized
   * @property {boolean} [disabled] - Whether the row is disabled
   * @property {any} [icon]
   * @property {boolean} [hasChildren]
   * @property {GanttTask<Id>[]} [nodes] - Child tasks. A task with children is a summary: it spans them and cannot be moved.
   */

  /**
   * @template [Id=(string|number)]
   * @typedef {object} GanttLink
   * @property {Id} from - The predecessor. The successor starts after it finishes.
   * @property {Id} to - The successor
   */

  /**
   * @template [Id=(string|number)]
   * @typedef {object} GanttChange
   * @property {Id} id
   * @property {Date | string} start - The new first day, as the task's own `start` kind
   * @property {Date | string} end - The new last day
   * @property {{ start: Date | string; end: Date | string }} previous
   * @property {"move" | "start" | "end"} mode - Moved, or resized at the start or the end
   * @property {"pointer" | "keyboard"} source
   */

  /**
   * @template {GanttTask<any>} [Task=GanttTask<any>]
   */

  /**
   * Fired before a drag or a key press changes a task's dates. Call
   * `preventDefault()` to keep the task as it is; otherwise `tasks` is updated.
   * @event change
   * @type {GanttChange<Task["id"]>}
   */

  /**
   * @event select
   * @type {Task & { expanded: boolean; leaf: boolean; selected: boolean }}
   */

  /**
   * @event toggle
   * @type {Task & { expanded: boolean; leaf: boolean; selected: boolean }}
   */

  /**
   * Provide the tasks as a tree. A task with `nodes` is a summary row.
   * Bind it to receive the dates a drag or a key press writes.
   * @type {ReadonlyArray<Task>}
   * @bindable writable
   */
  export let tasks = [];

  /**
   * Provide the finish-to-start dependencies as `{ from, to }` task ids.
   * An end whose row is hidden by a collapsed summary attaches to the summary.
   * @type {ReadonlyArray<GanttLink<Task["id"]>>}
   */
  export let links = [];

  /**
   * Specify the list columns. The first is the tree column.
   * Defaults to the task name, start and end. A column reads the task field of
   * the same `key`. A summary has no `start` or `end` field of its own, so a
   * column that shows its derived dates sets `display`.
   * @type {ReadonlyArray<import("../TreeViewGrid/TreeViewGrid.svelte").TreeViewGridHeader<Task>> | undefined}
   */
  export let headers = undefined;

  /**
   * Specify the time scale.
   * @type {"day" | "week" | "month" | "quarter"}
   * @bindable writable
   */
  export let zoom = "week";

  /**
   * Specify the row height.
   * Accepts the same Carbon v11 aliases as `DataTable`.
   * @type {"compact" | "short" | "medium" | "tall" | "xs" | "sm" | "md" | "lg" | "xl" | undefined}
   */
  export let size = undefined;

  /**
   * Specify the locale of the axis and the dates. It also sets the first day
   * of the week and the weekend. Set it on the server too, or the axis
   * differs between the server render and the client.
   */
  export let locale = "en";

  /**
   * Specify how dates read in the list and in each bar's name.
   * @type {Intl.DateTimeFormatOptions}
   */
  export let dateFormat = { year: "numeric", month: "short", day: "numeric" };

  /**
   * Set the day the today line marks. By default it is the current day, drawn
   * once the page has loaded. Set to `false` to hide the line.
   * @type {Date | string | false | undefined}
   */
  export let today = undefined;

  /**
   * Set the first day of the axis. Defaults to a week before the earliest task.
   * @type {Date | string | undefined}
   */
  export let rangeStart = undefined;

  /**
   * Set the last day of the axis. Defaults to a week after the latest task.
   * @type {Date | string | undefined}
   */
  export let rangeEnd = undefined;

  /** Set to `true` to keep every bar from being moved or resized */
  export let readonly = false;

  /**
   * Set the ids of the expanded summaries.
   * @type {ReadonlyArray<Task["id"]>}
   * @bindable writable
   */
  export let expandedIds = [];

  /**
   * Set the ids of the selected tasks.
   * @type {ReadonlyArray<Task["id"]>}
   * @bindable writable
   */
  export let selectedIds = [];

  /**
   * Set the current active task id.
   * @type {Task["id"]}
   * @bindable writable
   */
  export let activeId = "";

  /** Specify the width of the task list in px */
  export let listWidth = 460;

  /**
   * Cap the height of the chart. A number is in px; a string is any CSS
   * length. The chart scrolls inside it, with the header and the list kept in
   * view.
   * @type {number | string}
   */
  export let height = 480;

  /**
   * Specify how a quarter reads in the axis. `Intl` has no quarter format.
   * @type {(quarter: number, year: number) => string}
   */
  export let formatQuarter = defaultFormatQuarter;

  /**
   * Specify the accessible name of a bar. The default names the task, its
   * kind, its dates, its progress and the tasks it follows.
   * @type {(info: { text: string; range: string; kind: "task" | "summary" | "milestone"; progress: number; after: string[] }) => string}
   */
  export let barLabel = defaultBarLabel;

  /** Specify the hint a screen reader gives for a bar that can be moved */
  export let hintText =
    "Arrow keys move the task. Shift and arrow keys resize it. Alt, Shift and arrow keys resize its start.";

  /** Specify the accessible name of the timeline */
  export let timelineLabel = "Timeline";

  /** Specify the label text */
  export let labelText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /**
   * Set an id for the task list. The label id derives from it, for example
   * `{id}-label`.
   */
  export let id = uniqueId();

  /**
   * Scroll the timeline so `date` is just past the task list.
   * @type {(date: Date | string) => void}
   * @example
   * ```svelte
   * <Gantt bind:this={gantt} {tasks} />
   * <button on:click={() => gantt.scrollToDate("2026-03-01")}>March</button>
   * ```
   */
  export function scrollToDate(date) {
    const day = toDay(date);
    if (day === null || !scrollerRef) return;
    const sign =
      resolveLayoutDirection($layoutDirection, scrollerRef) === "rtl" ? -1 : 1;
    scrollerRef.scrollTo({
      left: sign * Math.max(0, (day - axis.start) * dayWidth - 24),
    });
  }

  /**
   * Scroll the timeline to the today line.
   * @type {() => void}
   */
  export function scrollToToday() {
    if (todayDay !== null) scrollToDate(fromDay(todayDay, ""));
  }

  import { createEventDispatcher, onMount } from "svelte";
  import TreeViewGrid from "../TreeViewGrid/TreeViewGrid.svelte";
  import { toCssLength } from "../utils/css-length.js";
  import {
    getLayoutDirection,
    inlineKey,
    resolveLayoutDirection,
  } from "../utils/layout-direction.js";
  import { pointerDrag } from "../utils/pointer-drag.js";
  import {
    DATA_TABLE_SIZE_ALIASES,
    normalizeSize,
  } from "../utils/size-aliases.js";
  import { buildTreeMaps } from "../utils/tree-nodes.js";
  import { createTreeVirtualIndex } from "../utils/tree-virtual-index.js";
  import { uniqueId } from "../utils/unique-id.js";
  import {
    alignDomain,
    anchorBar,
    applyDelta,
    buildAxis,
    computeSchedule,
    defaultBarLabel,
    formatDay,
    formatRange,
    fromDay,
    hitMode,
    isConflict,
    linkPath,
    localeWeek,
    patchNode,
    placeBar,
    ROW_HEIGHTS,
    toDay,
    weekendGradient,
    ZOOM_LEVELS,
  } from "./gantt-utils.js";

  /**
   * @param {number} quarter
   */
  function defaultFormatQuarter(quarter) {
    return `Q${quarter}`;
  }

  const dispatch = createEventDispatcher();
  const layoutDirection = getLayoutDirection();

  /** @type {null | HTMLDivElement} */
  let scrollerRef = null;
  /** @type {null | HTMLDivElement} */
  let canvasRef = null;

  $: labelId = `${id}-label`;
  $: hintId = `${id}-hint`;

  $: effectiveSize = normalizeSize(size, DATA_TABLE_SIZE_ALIASES);
  $: rowHeight = ROW_HEIGHTS[effectiveSize ?? "default"] ?? ROW_HEIGHTS.default;
  $: headerHeight = (rowHeight <= 24 ? 24 : 32) * 2;

  $: level = ZOOM_LEVELS[zoom] ?? ZOOM_LEVELS.week;
  $: dayWidth = level.dayWidth;
  $: week = localeWeek(locale);

  $: schedule = computeSchedule(tasks);
  $: maps = buildTreeMaps(tasks);
  $: expandedSet = new Set(expandedIds);
  $: selectedSet = new Set(selectedIds);

  /**
   * The rows the list shows, in order. The list builds the same rows from the
   * same tasks and expanded ids, so row `i` of the list is row `i` here.
   * @param {ReadonlyArray<Task>} nodes
   * @param {Set<Task["id"]>} expanded
   */
  function collectRows(nodes, expanded) {
    const index = createTreeVirtualIndex(nodes, expanded);
    return index.collectRows(0, index.totalCount);
  }

  $: rows = collectRows(tasks, expandedSet);

  /** @type {number | null} */
  let todayDay = null;
  let mounted = false;

  onMount(() => {
    mounted = true;
  });

  // The current day is read after mount, so a server render and the
  // hydration agree. A `today` the consumer sets renders on the server.
  $: todayDay = resolveToday(today, mounted);

  /**
   * @param {typeof today} value
   * @param {boolean} ready
   */
  function resolveToday(value, ready) {
    if (value === false) return null;
    if (value !== undefined) return toDay(value);
    return ready ? toDay(new Date()) : null;
  }

  /**
   * The axis span: the tasks with a week of room, or the given range.
   * @param {typeof schedule} entries
   * @param {typeof zoom} scale
   * @param {typeof rangeStart} from
   * @param {typeof rangeEnd} to
   * @param {typeof today} current
   * @param {number} firstDay
   */
  function resolveDomain(entries, scale, from, to, current, firstDay) {
    let first = Number.POSITIVE_INFINITY;
    let last = Number.NEGATIVE_INFINITY;
    for (const entry of entries.values()) {
      if (entry.start === null || entry.end === null) continue;
      first = Math.min(first, entry.start);
      last = Math.max(last, entry.end);
    }
    const fallback = toDay(current) ?? toDay(from) ?? toDay(new Date()) ?? 0;
    if (!Number.isFinite(first)) {
      first = fallback;
      last = fallback + 30;
    }
    return alignDomain(
      scale in ZOOM_LEVELS ? scale : "week",
      toDay(from) ?? first - 7,
      toDay(to) ?? last + 7,
      firstDay,
    );
  }

  $: domain = resolveDomain(
    schedule,
    zoom,
    rangeStart,
    rangeEnd,
    today,
    week.firstDay,
  );
  $: axis = buildAxis({
    zoom: zoom in ZOOM_LEVELS ? zoom : "week",
    start: domain.start,
    end: domain.end,
    locale,
    firstDay: week.firstDay,
    formatQuarter,
  });
  $: timelineWidth = (axis.end - axis.start) * dayWidth;
  $: weekends = weekendGradient(
    axis.start,
    dayWidth,
    week.weekend,
    "var(--ccs-gantt-weekend)",
  );
  $: todayX =
    todayDay !== null && todayDay >= axis.start && todayDay < axis.end
      ? (todayDay - axis.start + 0.5) * dayWidth
      : null;

  /**
   * @param {typeof rows} visible
   * @param {typeof schedule} entries
   * @param {number} start
   * @param {number} width
   * @param {number} rowPx
   * @param {boolean} locked
   */
  function layoutBars(visible, entries, start, width, rowPx, locked) {
    /** @type {import("./gantt-utils.js").GanttBar[]} */
    const list = [];
    /** @type {Map<string, import("./gantt-utils.js").GanttBar>} */
    const byKey = new Map();
    for (let i = 0; i < visible.length; i++) {
      const node = visible[i].node;
      const entry = entries.get(node.id);
      if (!entry) continue;
      const bar = placeBar(
        i,
        node.id,
        entry,
        start,
        width,
        rowPx,
        !locked && !node.readonly && !node.disabled,
      );
      if (bar) {
        list.push(bar);
        byKey.set(bar.key, bar);
      }
    }
    return { bars: list, barByKey: byKey };
  }

  $: ({ bars, barByKey } = layoutBars(
    rows,
    schedule,
    axis.start,
    dayWidth,
    rowHeight,
    readonly,
  ));

  /**
   * @param {typeof links} list
   * @param {typeof barByKey} byKey
   * @param {typeof maps} treeMaps
   * @param {typeof schedule} entries
   * @param {number} rowPx
   */
  function layoutLinks(list, byKey, treeMaps, entries, rowPx) {
    /** @type {Array<{ key: string; fromKey: string; toKey: string; from: import("./gantt-utils.js").GanttBar; to: import("./gantt-utils.js").GanttBar; d: string; conflict: boolean }>} */
    const shapes = [];
    for (let i = 0; i < list.length; i++) {
      const link = list[i];
      const from = anchorBar(link.from, byKey, treeMaps.parentIdById);
      const to = anchorBar(link.to, byKey, treeMaps.parentIdById);
      if (!from || !to || from === to) continue;
      shapes.push({
        key: `${i}:${link.from}>${link.to}`,
        fromKey: from.key,
        toKey: to.key,
        from,
        to,
        d: linkPath(from, to, rowPx),
        conflict: isConflict(entries.get(link.from), entries.get(link.to)),
      });
    }
    return shapes;
  }

  $: linkShapes = layoutLinks(links, barByKey, maps, schedule, rowHeight);

  /**
   * The names of the tasks each task follows, for a bar's accessible name.
   * @param {typeof links} list
   * @param {typeof maps} treeMaps
   */
  function followedNames(list, treeMaps) {
    /** @type {Map<string, string[]>} */
    const after = new Map();
    for (const link of list) {
      const from = treeMaps.nodeMap.get(link.from);
      if (!from) continue;
      const key = String(link.to);
      const names = after.get(key);
      if (names) names.push(String(from.text));
      else after.set(key, [String(from.text)]);
    }
    return after;
  }

  /**
   * @param {typeof rows} visible
   * @param {typeof schedule} entries
   * @param {Map<string, string[]>} after
   * @param {(start: number, end: number) => string} rangeOf
   * @param {typeof barLabel} name
   */
  function buildLabels(visible, entries, after, rangeOf, name) {
    /** @type {Map<string, string>} */
    const labels = new Map();
    for (const { node } of visible) {
      const entry = entries.get(node.id);
      if (!entry || entry.start === null || entry.end === null) continue;
      const key = String(node.id);
      labels.set(
        key,
        name({
          text: String(node.text ?? ""),
          range: rangeOf(entry.start, entry.end),
          kind: entry.milestone
            ? "milestone"
            : entry.summary
              ? "summary"
              : "task",
          progress: entry.progress,
          after: after.get(key) ?? [],
        }),
      );
    }
    return labels;
  }

  /**
   * `Intl` formats a range in about 10us, which is 20ms for 2,000 bars on
   * every edit. A change touches one task, so ranges are remembered.
   * @param {string} loc
   * @param {Intl.DateTimeFormatOptions} format
   */
  function rangeFormatter(loc, format) {
    /** @type {Map<string, string>} */
    const cache = new Map();
    return (/** @type {number} */ start, /** @type {number} */ end) => {
      const key = `${start}:${end}`;
      let range = cache.get(key);
      if (range === undefined) {
        range = formatRange(loc, format, start, end);
        cache.set(key, range);
      }
      return range;
    };
  }

  $: rangeOf = rangeFormatter(locale, dateFormat);
  $: labelByKey = buildLabels(
    rows,
    schedule,
    followedNames(links, maps),
    rangeOf,
    barLabel,
  );

  /**
   * The list's columns: the name and the derived start and end, which a
   * summary has no field for.
   * @param {typeof schedule} entries
   * @param {number} width
   * @param {string} loc
   * @param {Intl.DateTimeFormatOptions} format
   */
  function defaultColumns(entries, width, loc, format) {
    /** @param {"start" | "end"} edge */
    const dateCell =
      (edge) => (/** @type {any} */ _, /** @type {any} */ node) => {
        const day = entries.get(node.id)?.[edge];
        return day == null ? "" : formatDay(loc, format, day);
      };
    return [
      {
        key: "text",
        value: "Task",
        width: `${Math.max(width - DATE_COLUMN_WIDTH * 2, 120)}px`,
      },
      {
        key: "start",
        value: "Start",
        width: `${DATE_COLUMN_WIDTH}px`,
        display: dateCell("start"),
      },
      {
        key: "end",
        value: "End",
        width: `${DATE_COLUMN_WIDTH}px`,
        display: dateCell("end"),
      },
    ];
  }

  $: columns =
    headers ?? defaultColumns(schedule, listWidth, locale, dateFormat);

  $: labelProps =
    $$restProps["aria-label"] || $$restProps["aria-labelledby"] || hideLabel
      ? {}
      : { "aria-labelledby": labelId };

  /** The bar being dragged, shown at its new dates before they are committed. */
  /** @type {null | { key: string; start: number; end: number }} */
  let preview = null;

  /** @param {typeof preview} state */
  function previewBarFor(state) {
    const bar = state && barByKey.get(state.key);
    if (!state || !bar) return null;
    return placeBar(
      bar.row,
      bar.id,
      {
        start: state.start,
        end: state.end,
        milestone: bar.milestone,
        summary: false,
        progress: bar.progress,
      },
      axis.start,
      dayWidth,
      rowHeight,
      true,
    );
  }

  $: previewBar = previewBarFor(preview);

  /**
   * @param {typeof linkShapes[number]} link
   * @param {typeof preview} state
   * @param {typeof previewBar} moved
   */
  function linkD(link, state, moved) {
    if (!state || !moved) return link.d;
    if (link.fromKey !== state.key && link.toKey !== state.key) return link.d;
    return linkPath(
      link.fromKey === state.key ? moved : link.from,
      link.toKey === state.key ? moved : link.to,
      rowHeight,
    );
  }

  /** @param {import("./gantt-utils.js").GanttBar} bar */
  function barStyle(bar) {
    return `--ccs-gantt-x:${bar.x}px;--ccs-gantt-progress:${bar.progress}%;width:${bar.width}px;height:${bar.height}px;top:${bar.y}px`;
  }

  /** The bar that holds the timeline's one tab stop. */
  /** @type {string | undefined} */
  let focusKey;
  $: tabStopKey =
    focusKey !== undefined && barByKey.has(focusKey) ? focusKey : bars[0]?.key;

  let announcement = "";

  /**
   * Ask for new dates. A listener can cancel the change; otherwise the task is
   * rewritten in `tasks`.
   * @param {import("./gantt-utils.js").GanttBar} bar
   * @param {number} start
   * @param {number} end
   * @param {"move" | "start" | "end"} mode
   * @param {"pointer" | "keyboard"} source
   */
  function commit(bar, start, end, mode, source) {
    const node = maps.nodeMap.get(bar.id);
    if (!node || (start === bar.start && end === bar.end)) return;
    const startLike = node.start;
    const endLike = node.end ?? node.start;
    const detail = {
      id: bar.id,
      start: fromDay(start, startLike),
      end: fromDay(end, endLike),
      previous: {
        start: fromDay(bar.start, startLike),
        end: fromDay(bar.end, endLike),
      },
      mode,
      source,
    };
    if (!dispatch("change", detail, { cancelable: true })) return;
    tasks = patchNode(
      tasks,
      bar.id,
      bar.milestone && node.end === undefined
        ? { start: detail.start }
        : { start: detail.start, end: detail.end },
    );
    announcement = `${node.text}, ${rangeOf(start, end)}`;
  }

  /** @param {import("./gantt-utils.js").GanttBar} bar */
  function selectBar(bar) {
    const node = maps.nodeMap.get(bar.id);
    if (!node) return;
    activeId = bar.id;
    dispatch("select", {
      ...node,
      expanded: expandedSet.has(bar.id),
      leaf: !(Array.isArray(node.nodes) && node.nodes.length > 0),
      selected: true,
    });
  }

  /**
   * @param {EventTarget | null} target
   * @returns {import("./gantt-utils.js").GanttBar | undefined}
   */
  function barOf(target) {
    if (!(target instanceof Element)) return undefined;
    const element = target.closest(`[${BAR_ATTR}]`);
    if (!element || !canvasRef?.contains(element)) return undefined;
    return barByKey.get(element.getAttribute(BAR_ATTR) ?? "");
  }

  /**
   * @type {null | {
   *   bar: import("./gantt-utils.js").GanttBar;
   *   mode: "move" | "start" | "end";
   *   x: number;
   *   sign: 1 | -1;
   *   moved: boolean;
   *   cancelled: boolean;
   * }}
   */
  let drag = null;
  /** @type {"move" | "start" | "end" | null} */
  let dragMode = null;

  /** @param {PointerEvent} event */
  function handleDragStart(event) {
    const element =
      event.target instanceof Element
        ? event.target.closest(`[${BAR_ATTR}]`)
        : null;
    const bar = barOf(element);
    if (!element || !bar?.editable) return false;
    const rtl = resolveLayoutDirection($layoutDirection, canvasRef) === "rtl";
    const rect = element.getBoundingClientRect();
    const offset = rtl ? rect.right - event.clientX : event.clientX - rect.left;
    drag = {
      bar,
      mode: bar.milestone ? "move" : hitMode(offset, rect.width),
      x: event.clientX,
      sign: rtl ? -1 : 1,
      moved: false,
      cancelled: false,
    };
    return true;
  }

  /** @param {PointerEvent} event */
  function handleDragMove(event) {
    if (!drag || drag.cancelled) return;
    const dx = (event.clientX - drag.x) * drag.sign;
    if (!drag.moved) {
      if (Math.abs(dx) < DRAG_THRESHOLD) return;
      drag.moved = true;
      dragMode = drag.mode;
    }
    const snap = level.snap;
    const next = applyDelta(
      drag.bar.start,
      drag.bar.end,
      drag.mode,
      Math.round(dx / dayWidth / snap) * snap,
    );
    if (preview?.start !== next.start || preview?.end !== next.end) {
      preview = { key: drag.bar.key, ...next };
    }
  }

  /** @param {PointerEvent} event */
  function handleDragEnd(event) {
    const finished = drag;
    const result = preview;
    drag = null;
    dragMode = null;
    if (
      finished?.moved &&
      !finished.cancelled &&
      result &&
      event.type !== "pointercancel"
    ) {
      commit(finished.bar, result.start, result.end, finished.mode, "pointer");
    }
    preview = null;
  }

  /** @param {PointerEvent} event */
  function handlePointerdown(event) {
    if (event.button !== 0) return;
    const bar = barOf(event.target);
    if (bar) selectBar(bar);
  }

  /** @param {FocusEvent} event */
  function handleFocusin(event) {
    const bar = barOf(event.target);
    if (bar) focusKey = bar.key;
  }

  /** @param {import("./gantt-utils.js").GanttBar} bar */
  function focusBar(bar) {
    const element = canvasRef?.querySelector(barSelector(bar.id));
    if (element instanceof HTMLElement) element.focus();
  }

  /**
   * Focus the nearest bar above or below the row, skipping rows without one.
   * @param {number} row
   * @param {1 | -1} step
   */
  function focusBarFrom(row, step) {
    const byRow = new Map(bars.map((bar) => [bar.row, bar]));
    for (let i = row + step; i >= 0 && i < rows.length; i += step) {
      const target = byRow.get(i);
      if (target) {
        focusBar(target);
        return;
      }
    }
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    const bar = barOf(event.target);
    if (!bar) return;
    const key = inlineKey(
      event.key,
      $layoutDirection,
      /** @type {Element} */ (event.currentTarget),
    );

    switch (key) {
      case "ArrowRight":
      case "ArrowLeft": {
        if (!bar.editable) break;
        event.preventDefault();
        const mode = event.shiftKey ? (event.altKey ? "start" : "end") : "move";
        if (bar.milestone && mode !== "move") break;
        const delta = (key === "ArrowRight" ? 1 : -1) * level.snap;
        const next = applyDelta(bar.start, bar.end, mode, delta);
        commit(bar, next.start, next.end, mode, "keyboard");
        break;
      }
      case "ArrowDown":
      case "ArrowUp":
        event.preventDefault();
        focusBarFrom(bar.row, key === "ArrowDown" ? 1 : -1);
        break;
      case "Home":
      case "End": {
        event.preventDefault();
        const target = key === "Home" ? bars[0] : bars[bars.length - 1];
        if (target) focusBar(target);
        break;
      }
      case "Enter":
      case " ":
        event.preventDefault();
        selectBar(bar);
        break;
      case "Escape":
        if (drag) {
          event.preventDefault();
          drag.cancelled = true;
          preview = null;
        }
        break;
    }
  }
</script>

{#if !hideLabel}
  <div id={labelId} class:bx--label={true}>
    {labelText}
  </div>
{/if}

<div
  class:bx--gantt={true}
  style="--ccs-gantt-height:{toCssLength(
    height,
  )};--ccs-gantt-row-height:{rowHeight}px;--ccs-gantt-header-height:{headerHeight}px;--ccs-gantt-list-width:{listWidth}px;--ccs-gantt-timeline-width:{timelineWidth}px;--ccs-gantt-weekends:{weekends ||
    'none'}"
>
  <div bind:this={scrollerRef} class:bx--gantt__scroller={true}>
    <div class:bx--gantt__body={true}>
      <div class:bx--gantt__list={true}>
        <TreeViewGrid
          {id}
          nodes={tasks}
          headers={columns}
          size={effectiveSize}
          hideLabel
          {labelText}
          bind:expandedIds
          bind:selectedIds
          bind:activeId
          {...labelProps}
          {...$$restProps}
          on:select
          on:toggle
        />
      </div>

      <div class:bx--gantt__timeline={true}>
        <div class:bx--gantt__axis={true} aria-hidden="true">
          <div class:bx--gantt__axis-tier={true}>
            {#each axis.top as cell (cell.key)}
              <div
                class:bx--gantt__axis-cell={true}
                style="--ccs-gantt-x:{cell.x}px;width:{cell.width}px"
              >
                <span>{cell.label}</span>
              </div>
            {/each}
          </div>
          <div class:bx--gantt__axis-tier={true}>
            {#each axis.bottom as cell (cell.key)}
              <div
                class:bx--gantt__axis-cell={true}
                style="--ccs-gantt-x:{cell.x}px;width:{cell.width}px"
              >
                <span>{cell.label}</span>
              </div>
            {/each}
          </div>
        </div>

        <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
        <div
          bind:this={canvasRef}
          class:bx--gantt__canvas={true}
          role="group"
          aria-label={timelineLabel}
          data-gantt-drag={dragMode}
          style="height:{rows.length * rowHeight}px"
          use:pointerDrag={{
            enabled: !readonly,
            onStart: handleDragStart,
            onMove: handleDragMove,
            onEnd: handleDragEnd,
          }}
          on:pointerdown={handlePointerdown}
          on:focusin={handleFocusin}
          on:keydown={handleKeydown}
        >
          <svg
            class:bx--gantt__links={true}
            width={timelineWidth}
            height={rows.length * rowHeight}
            aria-hidden="true"
            focusable="false"
          >
            {#each linkShapes as link (link.key)}
              <path
                class:bx--gantt__link={true}
                class:bx--gantt__link--conflict={link.conflict}
                d={linkD(link, preview, previewBar)}
              />
            {/each}
          </svg>

          {#if todayX !== null}
            <div
              class:bx--gantt__today={true}
              aria-hidden="true"
              style="--ccs-gantt-x:{todayX}px"
            ></div>
          {/if}

          {#each bars as bar (bar.key)}
            {@const shown =
              preview !== null && previewBar !== null && preview.key === bar.key
                ? previewBar
                : bar}
            <div
              class:bx--gantt__bar={true}
              class:bx--gantt__bar--milestone={bar.milestone}
              class:bx--gantt__bar--summary={bar.summary}
              class:bx--gantt__bar--editable={bar.editable}
              class:bx--gantt__bar--resizable={bar.editable && !bar.milestone}
              class:bx--gantt__bar--selected={selectedSet.has(bar.id)}
              class:bx--gantt__bar--dragging={shown !== bar}
              role="button"
              tabindex={bar.key === tabStopKey ? 0 : -1}
              data-gantt-id={bar.id}
              aria-label={labelByKey.get(bar.key)}
              aria-describedby={bar.editable ? hintId : undefined}
              aria-current={bar.id === activeId ? "true" : undefined}
              style={barStyle(shown)}
            >
              {#if !bar.milestone && !bar.summary}
                <span class:bx--gantt__progress={true}></span>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
  <span id={hintId} class:bx--visually-hidden={true}>{hintText}</span>
  <span class:bx--visually-hidden={true} role="status">{announcement}</span>
</div>
