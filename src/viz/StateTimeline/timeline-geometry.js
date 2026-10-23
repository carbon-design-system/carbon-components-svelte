// @ts-check
// Row and segment geometry for `StateTimeline`, kept out of the component
// so a test can count how often it runs.

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
 * Group spans into rows, in first-seen order, and place each on a shared
 * time scale as percentages of the domain. The domain defaults to the
 * earliest start and the latest end. A span outside it is clipped, and one
 * entirely outside is dropped. A span that starts and ends at the same
 * instant is an event: it has no width and stays as long as it is inside.
 * States are colored in first-seen order, or by the `states` map, whose
 * values are semantic names or any color.
 *
 * @template T
 * @param {ReadonlyArray<T>} rows
 * @param {import("./timeline-geometry.d.ts").TimelineOptions<T>} options
 * @returns {import("./timeline-geometry.d.ts").Timeline<T>}
 */
export function buildTimeline(rows, options) {
  const { row, state, start, end, states = {}, palette = 1, locale } = options;

  /** @type {Map<string, Array<{ state: string; from: number; to: number; row: T; index: number }>>} */
  const byRow = new Map();
  /** @type {string[]} */
  const stateKeys = [];
  let low = Number.POSITIVE_INFINITY;
  let high = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < rows.length; i++) {
    const from = toTime(start(rows[i], i));
    const to = toTime(end(rows[i], i));
    if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) continue;
    const key = String(row(rows[i], i));
    const kind = String(state(rows[i], i));
    if (!stateKeys.includes(kind)) stateKeys.push(kind);
    let spans = byRow.get(key);
    if (!spans) {
      spans = [];
      byRow.set(key, spans);
    }
    spans.push({ state: kind, from, to, row: rows[i], index: i });
    if (from < low) low = from;
    if (to > high) high = to;
  }
  /** @type {[number, number]} */
  const domain = options.domain
    ? [toTime(options.domain[0]), toTime(options.domain[1])]
    : low <= high
      ? [low, high]
      : [0, 1];
  const span = Math.max(domain[1] - domain[0], 1);

  const assigned = categoricalColors(stateKeys.length, palette);
  /** @type {Map<string, string>} */
  const colorOf = new Map();
  stateKeys.forEach((kind, i) => {
    const given = states[kind];
    colorOf.set(
      kind,
      given === undefined
        ? assigned[i]
        : SEMANTIC.includes(String(given))
          ? `var(--cds-viz-${given})`
          : (vizColor(given) ?? assigned[i]),
    );
  });

  const ticks = timeTicks(domain[0], domain[1], 6, { utc: options.utc });
  const writeTick = timeTickFormat(ticks.interval, locale, {
    utc: options.utc,
  });

  return {
    domain,
    states: stateKeys.map((kind) => ({
      key: kind,
      color: /** @type {string} */ (colorOf.get(kind)),
    })),
    ticks: ticks.values
      .filter((value) => value >= domain[0] && value <= domain[1])
      .map((value) => ({
        value,
        pct: ((value - domain[0]) / span) * 100,
        label: writeTick(value),
      })),
    rows: [...byRow].map(([key, spans]) => ({
      key,
      segments: spans
        // An instant on the boundary is inside; a span must overlap it.
        .filter((entry) =>
          entry.to === entry.from
            ? entry.from >= domain[0] && entry.from <= domain[1]
            : entry.to > domain[0] && entry.from < domain[1],
        )
        .sort((a, b) => a.from - b.from)
        .map((entry) => {
          const from = Math.max(entry.from, domain[0]);
          const to = Math.min(entry.to, domain[1]);
          return {
            id: `${key}/${entry.index}`,
            row: key,
            state: entry.state,
            from: entry.from,
            to: entry.to,
            duration: entry.to - entry.from,
            datum: entry.row,
            index: entry.index,
            color: /** @type {string} */ (colorOf.get(entry.state)),
            startPct: ((from - domain[0]) / span) * 100,
            widthPct: ((to - from) / span) * 100,
          };
        }),
    })),
  };
}
