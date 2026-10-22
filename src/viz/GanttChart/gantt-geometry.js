// @ts-check
// Row and bar geometry for `GanttChart`: tasks on one time scale, grouped
// by workstream, with dependency arrows between rows, kept out of the
// component so a test can count how often it runs.

import { scaleTime } from "../utils/scale-time.js";
import { timeTickFormat, timeTicks } from "../utils/time-ticks.js";
import { categoricalColors, vizColor } from "../utils/tokens.js";

const SEMANTIC = [
  "interactive",
  "neutral",
  "success",
  "error",
  "warning",
  "info",
];

/**
 * Midnight on or before `ms`, in local time or UTC.
 * @param {number} ms
 * @param {boolean | undefined} utc
 */
function dayStart(ms, utc) {
  const date = new Date(ms);
  if (utc) date.setUTCHours(0, 0, 0, 0);
  else date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/**
 * Midnight on or after `ms`, in local time or UTC.
 * @param {number} ms
 * @param {boolean | undefined} utc
 */
function dayEnd(ms, utc) {
  const floor = dayStart(ms, utc);
  if (floor === ms) return ms;
  const date = new Date(floor);
  if (utc) date.setUTCDate(date.getUTCDate() + 1);
  else date.setDate(date.getDate() + 1);
  return date.getTime();
}

/**
 * @param {unknown} value
 * @returns {number}
 */
function toTime(value) {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  if (typeof value === "string") return new Date(value).getTime();
  return Number.NaN;
}

/**
 * Place every task as a bar on one time scale, one row each, grouped
 * under its workstream in first-seen order. The domain defaults to the
 * earliest start and the latest end, widened to whole days. A task's
 * dependencies become arrows from the end of what it waits for to its
 * start. Groups are colored in first-seen order, or by the `colors` map.
 *
 * @template T
 * @param {ReadonlyArray<T>} rows
 * @param {import("./gantt-geometry.d.ts").GanttOptions<T>} options
 * @returns {import("./gantt-geometry.d.ts").Gantt<T>}
 */
export function buildGantt(rows, options) {
  const {
    id,
    label,
    group,
    start,
    end,
    progress,
    dependsOn,
    domain: fixed,
    colors = {},
    palette = 1,
    plot,
    rowHeight,
    locale,
    utc,
  } = options;

  /** @type {Map<string, Array<{ id: string; label: string; from: number; to: number; progress: number | null; deps: string[]; row: T; index: number }>>} */
  const byGroup = new Map();
  let low = Number.POSITIVE_INFINITY;
  let high = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < rows.length; i++) {
    const from = toTime(start(rows[i], i));
    const to = toTime(end(rows[i], i));
    if (!Number.isFinite(from) || !Number.isFinite(to)) continue;
    const key = group ? String(group(rows[i], i)) : "";
    let list = byGroup.get(key);
    if (!list) {
      list = [];
      byGroup.set(key, list);
    }
    const raw = dependsOn ? dependsOn(rows[i], i) : undefined;
    const done = progress ? Number(progress(rows[i], i)) : Number.NaN;
    list.push({
      id: String(id ? id(rows[i], i) : i),
      label: label ? String(label(rows[i], i) ?? i) : String(i),
      from,
      to: Math.max(from, to),
      progress: Number.isFinite(done) ? Math.min(Math.max(done, 0), 1) : null,
      deps: Array.isArray(raw)
        ? raw.map(String)
        : raw === undefined || raw === null || raw === ""
          ? []
          : [String(raw)],
      row: rows[i],
      index: i,
    });
    if (from < low) low = from;
    if (to > high) high = to;
  }
  /** @type {[number, number]} */
  const domain = fixed
    ? [toTime(fixed[0]), toTime(fixed[1])]
    : low <= high
      ? [dayStart(low, utc), dayEnd(high, utc)]
      : [dayStart(Date.now(), utc), dayEnd(Date.now(), utc)];
  const x = scaleTime({ domain, range: [plot.x0, plot.x1] });

  const keys = [...byGroup.keys()];
  const assigned = categoricalColors(keys.length, palette);
  /** @type {Map<string, string>} */
  const colorOf = new Map();
  keys.forEach((key, i) => {
    const given = colors[key];
    colorOf.set(
      key,
      given === undefined
        ? assigned[i]
        : SEMANTIC.includes(String(given))
          ? `var(--cds-viz-${given})`
          : (vizColor(given) ?? assigned[i]),
    );
  });

  /** @type {import("./gantt-geometry.d.ts").GanttRow<T>[]} */
  const tasks = [];
  /** @type {Array<{ key: string; color: string; y: number; count: number }>} */
  const groups = [];
  let line = 0;
  for (const [key, list] of byGroup) {
    const color = /** @type {string} */ (colorOf.get(key));
    groups.push({ key, color, y: line * rowHeight, count: list.length });
    for (const task of list) {
      const x0 = x.map(Math.max(task.from, domain[0]));
      const x1 = x.map(Math.min(task.to, domain[1]));
      tasks.push({
        ...task,
        group: key,
        color,
        line,
        y: line * rowHeight,
        x0,
        x1: Math.max(x1, x0),
        duration: task.to - task.from,
      });
      line++;
    }
  }
  const at = new Map(tasks.map((task) => [task.id, task]));
  /** @type {import("./gantt-geometry.d.ts").GanttLink[]} */
  const links = [];
  for (const task of tasks) {
    for (const dep of task.deps) {
      const before = at.get(dep);
      if (!before || before === task) continue;
      const half = rowHeight / 2;
      const fromX = before.x1;
      const fromY = before.y + half;
      const toX = task.x0;
      const toY = task.y + half;
      // Out of the end of the earlier bar, down or up beside it, then in
      // to the start of the later one.
      const turn = Math.max(fromX + 8, Math.min(toX - 8, fromX + 8));
      links.push({
        id: `${before.id}->${task.id}`,
        from: before.id,
        to: task.id,
        // The wait is late when it starts before what it waits for ends.
        late: task.from < before.to,
        d:
          toX >= fromX + 16
            ? `M${fromX},${fromY}H${turn}V${toY}H${toX}`
            : `M${fromX},${fromY}H${fromX + 8}V${toY - (toY > fromY ? half : -half)}H${toX - 8}V${toY}H${toX}`,
      });
    }
  }

  const result = timeTicks(domain[0], domain[1], 6, { utc });
  const write = timeTickFormat(result.interval, locale, { utc });
  const full = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    ...(utc ? { timeZone: "UTC" } : {}),
  });

  return {
    domain,
    x,
    groups,
    tasks,
    links,
    ticks: result.values
      .filter((value) => value >= domain[0] && value <= domain[1])
      .map((value) => ({ value, px: x.map(value), label: write(value) })),
    xLabel: (value) => full.format(value),
    height: line * rowHeight,
  };
}
