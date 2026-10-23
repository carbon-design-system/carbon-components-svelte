// @ts-check
// Row geometry for `SpanWaterfall`: a tree of intervals placed on one time
// scale, kept out of the component so a test can count how often it runs.

import { formatDuration } from "../utils/format-compact.js";
import { ticks } from "../utils/ticks.js";
import { timeTickFormat, timeTicks } from "../utils/time-ticks.js";
import { categoricalColors, vizColor } from "../utils/tokens.js";
import { treeLayout } from "../utils/tree-layout.js";

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
 * Build the tree of spans, in depth-first order with parents before their
 * children, and place each on a shared time scale as percentages of the
 * domain. The domain defaults to the earliest start and the latest end.
 * Spans inside a collapsed span are left out. Groups are colored in
 * first-seen order, or by the `groups` map, whose values are semantic names
 * or any color.
 *
 * The critical path runs from each root through whichever child ends last,
 * so it is the chain that decided how long the whole took.
 *
 * @template T
 * @param {ReadonlyArray<T>} rows
 * @param {import("./span-geometry.d.ts").SpanOptions<T>} options
 * @returns {import("./span-geometry.d.ts").SpanTree<T>}
 */
export function buildSpans(rows, options) {
  const {
    id,
    parent,
    start,
    duration,
    end,
    label,
    group,
    collapsed = [],
    groups = {},
    palette = 1,
    locale,
    utc,
    absolute = false,
  } = options;

  const layout = treeLayout(rows, { id, parent, width: 1, height: 1 });
  const closed = new Set(collapsed.map(String));

  /** @type {Map<string, { from: number; to: number }>} */
  const times = new Map();
  let low = Number.POSITIVE_INFINITY;
  let high = Number.NEGATIVE_INFINITY;
  for (const node of layout.nodes) {
    const index = rows.indexOf(node.row);
    const from = toTime(start(node.row, index));
    const length = duration ? Number(duration(node.row, index)) : Number.NaN;
    const to = end
      ? toTime(end(node.row, index))
      : Number.isFinite(length)
        ? from + Math.max(length, 0)
        : Number.NaN;
    if (!Number.isFinite(from) || !Number.isFinite(to)) continue;
    times.set(node.id, { from, to: Math.max(from, to) });
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

  // The critical path: from each root, the child that ends last, and so on.
  /** @type {Set<string>} */
  const critical = new Set();
  for (const root of layout.nodes.filter((node) => node.parent === null)) {
    let at = root;
    while (at && times.has(at.id)) {
      critical.add(at.id);
      /** @type {import("../utils/tree-layout.js").TreeNode<T> | null} */
      let next = null;
      let latest = Number.NEGATIVE_INFINITY;
      for (const child of at.children) {
        const time = times.get(child.id);
        if (time && time.to > latest) {
          latest = time.to;
          next = child;
        }
      }
      if (!next) break;
      at = next;
    }
  }

  /** @type {string[]} */
  const groupKeys = [];
  /** @type {Map<string, string>} */
  const groupOf = new Map();
  if (group) {
    for (const node of layout.nodes) {
      const key = String(group(node.row, rows.indexOf(node.row)));
      groupOf.set(node.id, key);
      if (!groupKeys.includes(key)) groupKeys.push(key);
    }
  }
  const assigned = categoricalColors(groupKeys.length, palette);
  /** @type {Map<string, string>} */
  const colorOf = new Map();
  groupKeys.forEach((key, i) => {
    const given = groups[key];
    colorOf.set(
      key,
      given === undefined
        ? assigned[i]
        : SEMANTIC.includes(String(given))
          ? `var(--cds-viz-${given})`
          : (vizColor(given) ?? assigned[i]),
    );
  });

  /** @type {Set<string>} */
  const hidden = new Set();
  /** @type {import("./span-geometry.d.ts").SpanRow<T>[]} */
  const out = [];
  for (const node of layout.nodes) {
    const up = node.parent;
    if (up && (closed.has(up.id) || hidden.has(up.id))) {
      hidden.add(node.id);
      continue;
    }
    const time = times.get(node.id);
    if (!time) continue;
    const from = Math.max(time.from, domain[0]);
    const to = Math.min(time.to, domain[1]);
    const index = rows.indexOf(node.row);
    const key = groupOf.get(node.id);
    out.push({
      id: node.id,
      parent: up ? up.id : null,
      depth: node.depth,
      label: label ? String(label(node.row, index) ?? node.id) : node.id,
      group: key ?? "",
      from: time.from,
      to: time.to,
      duration: time.to - time.from,
      offset: time.from - domain[0],
      datum: node.row,
      index,
      children: node.children.length,
      collapsed: closed.has(node.id),
      critical: critical.has(node.id),
      color: key === undefined ? undefined : colorOf.get(key),
      startPct: ((from - domain[0]) / span) * 100,
      widthPct: Math.max(((to - from) / span) * 100, 0),
    });
  }

  /** @type {Array<{ value: number; pct: number; label: string }>} */
  let axis = [];
  if (absolute) {
    const result = timeTicks(domain[0], domain[1], 4, { utc });
    const write = timeTickFormat(result.interval, locale, { utc });
    axis = result.values
      .filter((value) => value >= domain[0] && value <= domain[1])
      .map((value) => ({
        value,
        pct: ((value - domain[0]) / span) * 100,
        label: write(value),
      }));
  }
  // Times of day are long labels: keep every other one, or fewer, so
  // neighbors never touch.
  if (axis.length > 4) {
    const keep = Math.ceil(axis.length / 4);
    axis = axis.filter((_, i) => i % keep === 0);
  }
  // Times of day cannot label a range shorter than their finest tick, so
  // such a trace falls back to offsets.
  if (axis.length < 2) {
    axis = ticks(0, domain[1] - domain[0], 5).map((offset) => ({
      value: domain[0] + offset,
      pct: (offset / span) * 100,
      label: formatDuration(offset, { locale, largest: 1 }),
    }));
  }

  return {
    domain,
    groups: groupKeys.map((key) => ({
      key,
      color: /** @type {string} */ (colorOf.get(key)),
    })),
    ticks: axis,
    rows: out,
  };
}
