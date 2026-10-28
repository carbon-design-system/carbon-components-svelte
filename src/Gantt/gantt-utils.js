// @ts-check
// Pure geometry, calendar and scheduling helpers for `Gantt`.
//
// Every date is a day number: whole days since 1970-01-01 in UTC. A `Date`
// is read by its local year, month and day, so a task on "March 3" is March 3
// in any time zone and across a DST change. Nothing here reads the DOM, so a
// pointer press, a key press and the server all place a bar from arithmetic.

import { getDateTimeFormatter } from "../utils/intl-formatter-cache.js";

export const MS_PER_DAY = 86400000;

/**
 * Per zoom level: the width of a day in px, and the number of days a drag or
 * a Left/Right key press moves a bar (the snap).
 */
export const ZOOM_LEVELS = {
  day: { dayWidth: 40, snap: 1 },
  week: { dayWidth: 14, snap: 1 },
  month: { dayWidth: 4, snap: 7 },
  quarter: { dayWidth: 1.5, snap: 7 },
};

/** Row heights in px, as DataTable's sizes. */
export const ROW_HEIGHTS = {
  compact: 24,
  short: 32,
  medium: 40,
  default: 48,
  tall: 64,
};

/** The narrowest a bar is drawn, so a one-day bar stays visible when zoomed out. */
export const MIN_BAR_WIDTH = 6;

/** How far a link runs beside a bar before it turns. */
const LINK_GAP = 8;

/** Arrowhead size. */
const ARROW_LENGTH = 5;
const ARROW_HALF_WIDTH = 3.5;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})/;

/**
 * A day number from a `Date` (read by its local date parts) or a
 * `YYYY-MM-DD` string. `null` for anything else.
 * @param {unknown} value
 * @returns {number | null}
 */
export function toDay(value) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return Math.round(
      Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()) /
        MS_PER_DAY,
    );
  }
  if (typeof value === "string") {
    const match = ISO_DATE.exec(value.trim());
    if (!match) return null;
    const [year, month, day] = [+match[1], +match[2], +match[3]];
    const time = Date.UTC(year, month - 1, day);
    const check = new Date(time);
    if (
      check.getUTCFullYear() !== year ||
      check.getUTCMonth() !== month - 1 ||
      check.getUTCDate() !== day
    ) {
      return null;
    }
    return Math.round(time / MS_PER_DAY);
  }
  return null;
}

/**
 * A day number as a value of the same kind as `like`: a local-midnight
 * `Date` for a `Date`, else a `YYYY-MM-DD` string.
 * @param {number} day
 * @param {unknown} like
 * @returns {Date | string}
 */
export function fromDay(day, like) {
  const utc = dayToDate(day);
  if (like instanceof Date) {
    return new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate());
  }
  return utc.toISOString().slice(0, 10);
}

/**
 * The UTC midnight of a day, for `Intl.DateTimeFormat` with `timeZone: "UTC"`.
 * @param {number} day
 */
export function dayToDate(day) {
  return new Date(day * MS_PER_DAY);
}

/**
 * ISO weekday of a day: 1 is Monday, 7 is Sunday.
 * @param {number} day
 */
export function isoWeekday(day) {
  return ((((day + 3) % 7) + 7) % 7) + 1;
}

/**
 * The first day of the month `months` away from the month holding `day`.
 * @param {number} day
 * @param {number} [months]
 */
export function monthStart(day, months = 0) {
  const date = dayToDate(day);
  return Math.round(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1) /
      MS_PER_DAY,
  );
}

/**
 * The first day of the quarter `quarters` away from the quarter holding `day`.
 * @param {number} day
 * @param {number} [quarters]
 */
export function quarterStart(day, quarters = 0) {
  const date = dayToDate(day);
  const month = date.getUTCMonth() - (date.getUTCMonth() % 3);
  return Math.round(
    Date.UTC(date.getUTCFullYear(), month + quarters * 3, 1) / MS_PER_DAY,
  );
}

/**
 * The first day of the year `years` away from the year holding `day`.
 * @param {number} day
 * @param {number} [years]
 */
export function yearStart(day, years = 0) {
  const date = dayToDate(day);
  return Math.round(Date.UTC(date.getUTCFullYear() + years, 0, 1) / MS_PER_DAY);
}

/**
 * @param {number} day
 * @param {number} firstDay - ISO weekday the week starts on.
 */
export function weekStart(day, firstDay) {
  return day - ((isoWeekday(day) - firstDay + 7) % 7);
}

/**
 * The week start and weekend days of a locale, as ISO weekdays. Falls back to
 * a Monday start and a Saturday and Sunday weekend where `Intl.Locale` has no
 * week data.
 * @param {string | undefined} locale
 * @returns {{ firstDay: number; weekend: number[] }}
 */
export function localeWeek(locale) {
  try {
    const intlLocale = /** @type {any} */ (new Intl.Locale(locale ?? "en"));
    const info = intlLocale.getWeekInfo?.() ?? intlLocale.weekInfo;
    if (info) {
      return {
        firstDay: info.firstDay ?? 1,
        weekend: Array.isArray(info.weekend) ? info.weekend : [6, 7],
      };
    }
  } catch {
    // An invalid locale tag: use the defaults below.
  }
  return { firstDay: 1, weekend: [6, 7] };
}

/**
 * @typedef {object} ScheduleEntry
 * @property {number | null} start - First day, or null when unscheduled.
 * @property {number | null} end - Last day (inclusive).
 * @property {boolean} milestone
 * @property {boolean} summary - Dates derive from the descendants.
 * @property {number} progress - 0 to 100.
 */

/**
 * @param {unknown} value
 */
function clampProgress(value) {
  const number = typeof value === "number" ? value : Number.NaN;
  if (Number.isNaN(number)) return 0;
  return Math.min(100, Math.max(0, number));
}

/**
 * @typedef {object} TaskLike
 * @property {string | number} id
 * @property {ReadonlyArray<TaskLike>} [nodes]
 * @property {unknown} [start]
 * @property {unknown} [end]
 * @property {boolean} [milestone]
 * @property {number} [progress]
 */

/**
 * Each task's dates. A task with children is a summary: it spans its
 * descendants, and its progress is theirs weighted by length. A task with no
 * `start` is unscheduled and gets no bar.
 * @param {ReadonlyArray<TaskLike>} nodes
 * @returns {Map<string | number, ScheduleEntry>}
 */
export function computeSchedule(nodes) {
  /** @type {Map<string | number, ScheduleEntry>} */
  const schedule = new Map();

  /**
   * @param {TaskLike} node
   * @returns {{ start: number | null; end: number | null; weight: number; done: number }}
   */
  function visit(node) {
    if (Array.isArray(node.nodes) && node.nodes.length > 0) {
      let start = Number.POSITIVE_INFINITY;
      let end = Number.NEGATIVE_INFINITY;
      let weight = 0;
      let done = 0;
      for (const child of node.nodes) {
        const result = visit(child);
        if (result.start === null || result.end === null) continue;
        start = Math.min(start, result.start);
        end = Math.max(end, result.end);
        weight += result.weight;
        done += result.done;
      }
      const scheduled = Number.isFinite(start);
      schedule.set(node.id, {
        start: scheduled ? start : null,
        end: scheduled ? end : null,
        milestone: false,
        summary: scheduled,
        progress: weight > 0 ? (done / weight) * 100 : 0,
      });
      return {
        start: scheduled ? start : null,
        end: scheduled ? end : null,
        weight,
        done,
      };
    }

    let start = toDay(node.start);
    let end = toDay(node.end);
    if (start === null && end !== null) start = end;
    if (end === null || (start !== null && end < start)) end = start;
    const milestone = node.milestone === true && start !== null;
    if (milestone) end = start;
    const progress = clampProgress(node.progress);
    schedule.set(node.id, {
      start,
      end,
      milestone,
      summary: false,
      progress,
    });
    const length = start === null || end === null ? 0 : end - start + 1;
    return {
      start,
      end,
      weight: milestone ? 0 : length,
      done: milestone ? 0 : (length * progress) / 100,
    };
  }

  for (const node of nodes) visit(node);
  return schedule;
}

/**
 * The size of a bar for a row height: a margin of at least 6px above and
 * below, never taller than 32px.
 * @param {number} rowHeight
 */
export function barHeightFor(rowHeight) {
  return Math.min(32, Math.max(12, rowHeight - 14));
}

/**
 * @typedef {object} GanttBar
 * @property {string | number} id
 * @property {string} key - `String(id)`.
 * @property {number} row - Index in the visible rows.
 * @property {number} start
 * @property {number} end
 * @property {number} x - Inline offset from the start of the axis, px.
 * @property {number} y - Offset from the top of the canvas, px.
 * @property {number} width
 * @property {number} height
 * @property {number} anchorY - Where a link meets the bar, from the top of the canvas.
 * @property {boolean} milestone
 * @property {boolean} summary
 * @property {number} progress
 * @property {boolean} editable
 */

/**
 * Place a bar. A milestone is a square centred on its day.
 * @param {number} row
 * @param {string | number} id
 * @param {ScheduleEntry} entry
 * @param {number} domainStart
 * @param {number} dayWidth
 * @param {number} rowHeight
 * @param {boolean} editable
 * @returns {GanttBar | null}
 */
export function placeBar(
  row,
  id,
  entry,
  domainStart,
  dayWidth,
  rowHeight,
  editable,
) {
  if (entry.start === null || entry.end === null) return null;
  const height = barHeightFor(rowHeight);
  const y = row * rowHeight + (rowHeight - height) / 2;
  if (entry.milestone) {
    const size = Math.round(height * 0.65);
    return {
      id,
      key: String(id),
      row,
      start: entry.start,
      end: entry.end,
      x: (entry.start - domainStart + 0.5) * dayWidth - size / 2,
      y: row * rowHeight + (rowHeight - size) / 2,
      width: size,
      height: size,
      anchorY: row * rowHeight + rowHeight / 2,
      milestone: true,
      summary: false,
      progress: 0,
      editable,
    };
  }
  return {
    id,
    key: String(id),
    row,
    start: entry.start,
    end: entry.end,
    x: (entry.start - domainStart) * dayWidth,
    y,
    width: Math.max((entry.end - entry.start + 1) * dayWidth, MIN_BAR_WIDTH),
    height,
    anchorY: y + height * (entry.summary ? 0.3 : 0.5),
    milestone: false,
    summary: entry.summary,
    progress: entry.progress,
    editable: editable && !entry.summary,
  };
}

/**
 * A link's route from the end of one bar to the start of another, as an SVG
 * path in LTR coordinates (the SVG mirrors itself in RTL). It runs beside the
 * predecessor, turns at most twice when the successor starts clear of it, and
 * threads the gap between rows otherwise. An arrowhead closes the path at the
 * start of the successor.
 * @param {GanttBar} from
 * @param {GanttBar} to
 * @param {number} rowHeight
 * @returns {string}
 */
export function linkPath(from, to, rowHeight) {
  const x1 = from.x + from.width;
  const y1 = from.anchorY;
  const x2 = to.x;
  const y2 = to.anchorY;
  const dx = x2 - x1;
  const head = `M${r(x2 - ARROW_LENGTH)} ${r(y2 - ARROW_HALF_WIDTH)}L${r(x2)} ${r(y2)}L${r(x2 - ARROW_LENGTH)} ${r(y2 + ARROW_HALF_WIDTH)}`;
  if (dx >= LINK_GAP) {
    const turn = x1 + Math.min(LINK_GAP, dx - ARROW_LENGTH - 1);
    return `M${r(x1)} ${r(y1)}H${r(turn)}V${r(y2)}H${r(x2)}${head}`;
  }
  const channel = y1 + (y2 >= y1 ? rowHeight / 2 : -rowHeight / 2);
  return `M${r(x1)} ${r(y1)}H${r(x1 + LINK_GAP)}V${r(channel)}H${r(x2 - LINK_GAP)}V${r(y2)}H${r(x2)}${head}`;
}

/** @param {number} value */
function r(value) {
  return Math.round(value * 10) / 10;
}

/**
 * @typedef {object} GanttLink
 * @property {string | number} from - Predecessor task id.
 * @property {string | number} to - Successor task id.
 */

/**
 * The visible bar a link end attaches to: the task's own, else its nearest
 * ancestor's (a collapsed summary).
 * @param {string | number} id
 * @param {Map<string, GanttBar>} barByKey
 * @param {Map<string | number, string | number | symbol>} parentIdById
 * @returns {GanttBar | undefined}
 */
export function anchorBar(id, barByKey, parentIdById) {
  /** @type {string | number | symbol | undefined} */
  let current = id;
  while (current !== undefined && typeof current !== "symbol") {
    const bar = barByKey.get(String(current));
    if (bar) return bar;
    current = parentIdById.get(current);
  }
  return undefined;
}

/**
 * A successor that starts on or before the last day of its predecessor.
 * @param {ScheduleEntry | undefined} from
 * @param {ScheduleEntry | undefined} to
 */
export function isConflict(from, to) {
  if (!from || !to || from.end === null || to.start === null) return false;
  return to.start <= from.end;
}

/**
 * The dates after moving or resizing a task by `delta` days. `mode` is
 * `"move"`, `"start"` (the first day) or `"end"` (the last day). A bar is
 * never shorter than one day.
 * @param {number} start
 * @param {number} end
 * @param {"move" | "start" | "end"} mode
 * @param {number} delta
 * @returns {{ start: number; end: number }}
 */
export function applyDelta(start, end, mode, delta) {
  if (mode === "start") return { start: Math.min(start + delta, end), end };
  if (mode === "end") return { start, end: Math.max(end + delta, start) };
  return { start: start + delta, end: end + delta };
}

/**
 * Which part of a bar a press at `offset` px from its inline start grabs:
 * a resize zone at each end, else the body.
 * @param {number} offset
 * @param {number} width
 * @returns {"move" | "start" | "end"}
 */
export function hitMode(offset, width) {
  const zone = Math.min(8, width / 3);
  if (offset <= zone) return "start";
  if (offset >= width - zone) return "end";
  return "move";
}

/**
 * A copy of `nodes` with `patch` applied to the node `id`. Only the path to
 * that node is copied.
 * @template {{ id: string | number; nodes?: ReadonlyArray<any> }} T
 * @param {ReadonlyArray<T>} nodes
 * @param {string | number} id
 * @param {Record<string, unknown>} patch
 * @returns {T[]}
 */
export function patchNode(nodes, id, patch) {
  /**
   * @param {ReadonlyArray<T>} list
   * @returns {T[] | null}
   */
  function walk(list) {
    for (let i = 0; i < list.length; i++) {
      const node = list[i];
      if (node.id === id) {
        const next = list.slice();
        next[i] = { ...node, ...patch };
        return next;
      }
      if (Array.isArray(node.nodes)) {
        const children = walk(node.nodes);
        if (children) {
          const next = list.slice();
          next[i] = { ...node, nodes: children };
          return next;
        }
      }
    }
    return null;
  }
  return walk(nodes) ?? /** @type {T[]} */ (nodes.slice());
}

/**
 * @typedef {object} AxisCell
 * @property {string} key
 * @property {number} x - Offset from the start of the axis, px.
 * @property {number} width
 * @property {string} label
 */

/**
 * @typedef {object} Axis
 * @property {number} start - First day of the axis.
 * @property {number} end - Day after the last (exclusive).
 * @property {number} dayWidth
 * @property {AxisCell[]} top
 * @property {AxisCell[]} bottom
 */

/**
 * Snap `[start, end]` outward to whole cells of the zoom's bottom tier.
 * @param {"day" | "week" | "month" | "quarter"} zoom
 * @param {number} start
 * @param {number} end - Last day (inclusive).
 * @param {number} firstDay
 * @returns {{ start: number; end: number }}
 */
export function alignDomain(zoom, start, end, firstDay) {
  switch (zoom) {
    case "day":
      return { start, end: end + 1 };
    case "week":
      return {
        start: weekStart(start, firstDay),
        end: weekStart(end, firstDay) + 7,
      };
    case "month":
      return { start: monthStart(start), end: monthStart(end, 1) };
    default:
      return { start: quarterStart(start), end: quarterStart(end, 1) };
  }
}

/**
 * A day formatted for a locale.
 * @param {string | undefined} locale
 * @param {Intl.DateTimeFormatOptions} options
 * @param {number} day
 */
export function formatDay(locale, options, day) {
  return getDateTimeFormatter(locale, { ...options, timeZone: "UTC" }).format(
    dayToDate(day),
  );
}

/**
 * The two header tiers for a zoom level. Top tier: months (day and week
 * zoom) or years (month and quarter zoom). Bottom tier: days, weeks, months
 * or quarters. Labels come from `Intl`, except the quarter, which has no
 * `Intl` form: `formatQuarter` makes it.
 * @param {object} options
 * @param {"day" | "week" | "month" | "quarter"} options.zoom
 * @param {number} options.start
 * @param {number} options.end - Exclusive; align it with `alignDomain`.
 * @param {string | undefined} options.locale
 * @param {number} options.firstDay
 * @param {(quarter: number, year: number) => string} options.formatQuarter
 * @returns {Axis}
 */
export function buildAxis({
  zoom,
  start,
  end,
  locale,
  firstDay,
  formatQuarter,
}) {
  const dayWidth = ZOOM_LEVELS[zoom].dayWidth;

  /**
   * @param {number} from
   * @param {(day: number) => number} next - The start of the following cell.
   * @param {(day: number) => string} label
   * @param {(day: number) => number} align - Start of the cell holding a day.
   * @returns {AxisCell[]}
   */
  function tier(from, next, label, align) {
    /** @type {AxisCell[]} */
    const cells = [];
    let cursor = align(from);
    while (cursor < end) {
      const following = next(cursor);
      const clippedStart = Math.max(cursor, start);
      const clippedEnd = Math.min(following, end);
      cells.push({
        key: String(cursor),
        x: (clippedStart - start) * dayWidth,
        width: (clippedEnd - clippedStart) * dayWidth,
        label: label(cursor),
      });
      cursor = following;
    }
    return cells;
  }

  const monthLabel = (/** @type {number} */ day) =>
    formatDay(locale, { month: "long", year: "numeric" }, day);
  const yearLabel = (/** @type {number} */ day) =>
    formatDay(locale, { year: "numeric" }, day);

  const topByMonth = zoom === "day" || zoom === "week";
  const top = topByMonth
    ? tier(
        start,
        (day) => monthStart(day, 1),
        monthLabel,
        (day) => monthStart(day),
      )
    : tier(
        start,
        (day) => yearStart(day, 1),
        yearLabel,
        (day) => yearStart(day),
      );

  /** @type {AxisCell[]} */
  let bottom;
  if (zoom === "day") {
    bottom = tier(
      start,
      (day) => day + 1,
      (day) => formatDay(locale, { day: "numeric" }, day),
      (day) => day,
    );
  } else if (zoom === "week") {
    bottom = tier(
      start,
      (day) => day + 7,
      (day) => formatDay(locale, { month: "short", day: "numeric" }, day),
      (day) => weekStart(day, firstDay),
    );
  } else if (zoom === "month") {
    bottom = tier(
      start,
      (day) => monthStart(day, 1),
      (day) => formatDay(locale, { month: "short" }, day),
      (day) => monthStart(day),
    );
  } else {
    bottom = tier(
      start,
      (day) => quarterStart(day, 1),
      (day) => {
        const date = dayToDate(day);
        return formatQuarter(
          Math.floor(date.getUTCMonth() / 3) + 1,
          date.getUTCFullYear(),
        );
      },
      (day) => quarterStart(day),
    );
  }

  return { start, end, dayWidth, top, bottom };
}

/**
 * A repeating gradient that shades the weekend days, for `background-image`
 * on an element that starts at day `start`. Empty when a day is narrower
 * than `minDayWidth`, where the stripes would only blur.
 * @param {number} start
 * @param {number} dayWidth
 * @param {number[]} weekend - ISO weekdays.
 * @param {string} color - A CSS color.
 * @param {number} [minDayWidth]
 */
export function weekendGradient(
  start,
  dayWidth,
  weekend,
  color,
  minDayWidth = 6,
) {
  if (dayWidth < minDayWidth || weekend.length === 0) return "";
  /** @type {string[]} */
  const stops = [];
  const first = isoWeekday(start);
  let run = null;
  /** @type {Array<[number, number]>} */
  const runs = [];
  for (let offset = 0; offset < 7; offset++) {
    const weekday = ((first - 1 + offset) % 7) + 1;
    if (weekend.includes(weekday)) {
      if (run === null) run = offset;
    } else if (run !== null) {
      runs.push([run, offset]);
      run = null;
    }
  }
  if (run !== null) runs.push([run, 7]);
  let cursor = 0;
  for (const [from, to] of runs) {
    if (from > cursor) {
      stops.push(`transparent ${cursor * dayWidth}px ${from * dayWidth}px`);
    }
    stops.push(`${color} ${from * dayWidth}px ${to * dayWidth}px`);
    cursor = to;
  }
  if (cursor < 7) {
    stops.push(`transparent ${cursor * dayWidth}px ${7 * dayWidth}px`);
  }
  return `repeating-linear-gradient(calc(90deg * var(--ccs-inline-sign, 1)), ${stops.join(", ")})`;
}

/**
 * The accessible name of a bar.
 * @typedef {object} BarLabelInfo
 * @property {string} text - The task name.
 * @property {string} range - The dates, formatted for the locale.
 * @property {"task" | "summary" | "milestone"} kind
 * @property {number} progress - 0 to 100.
 * @property {string[]} after - Names of the tasks this one follows.
 */

/**
 * @param {BarLabelInfo} info
 * @returns {string}
 */
export function defaultBarLabel({ text, range, kind, progress, after }) {
  const parts = [text];
  if (kind === "milestone") parts.push("milestone");
  else if (kind === "summary") parts.push("summary");
  parts.push(range);
  if (kind !== "milestone") parts.push(`${Math.round(progress)}% complete`);
  if (after.length > 0) parts.push(`after ${after.join(", ")}`);
  return parts.join(", ");
}

/**
 * The dates of a bar as one phrase: a single day, or a range that drops the
 * parts both ends share (`Oct 6 – 10, 2026`).
 * @param {string | undefined} locale
 * @param {Intl.DateTimeFormatOptions} options
 * @param {number} start
 * @param {number} end
 */
export function formatRange(locale, options, start, end) {
  const formatter = getDateTimeFormatter(locale, {
    ...options,
    timeZone: "UTC",
  });
  if (start === end) return formatter.format(dayToDate(start));
  const range = /** @type {any} */ (formatter).formatRange;
  if (typeof range === "function") {
    return range.call(formatter, dayToDate(start), dayToDate(end));
  }
  return `${formatter.format(dayToDate(start))} - ${formatter.format(dayToDate(end))}`;
}
