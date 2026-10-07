// Pure-logic benchmark: no jsdom, no Svelte, run directly via bun (`bunx ostia bench bench/<this file>.bench.ts`, optionally filtered — see CONTRIBUTING.md).
// Hot paths behind the viz charts: lttb() and the nearest-point lookups run
// on every pointer move over a long series, and formatCompact() runs once
// per rendered axis/data label, so a dense chart calls it thousands of times
// a frame.
import { group, task } from "ostia";
import { lttb } from "../src/viz/utils/downsample-lttb.js";
import { formatCompact } from "../src/viz/utils/format-compact.js";
import {
  bisectNearest,
  createGridIndex,
} from "../src/viz/utils/nearest-point.js";

type Row = { x: number; y: number };

function buildSeries(n: number): Row[] {
  const rows: Row[] = new Array(n);
  for (let i = 0; i < n; i++) rows[i] = { x: i, y: Math.sin(i / 97) * 100 };
  return rows;
}

const x = (row: Row) => row.x;
const y = (row: Row) => row.y;

// lttb() allocates a new output array and re-averages a bucket per call.
group(
  "lttb downsampling",
  () => {
    const series100k = buildSeries(100_000);
    const series1m = buildSeries(1_000_000);
    task("100k -> 1k", () => lttb(series100k, 1000, x, y));
    task("1M -> 2k", () => lttb(series1m, 2000, x, y));
  },
  { gc: true },
);

group("bisectNearest", () => {
  const sorted = Array.from({ length: 1_000_000 }, (_, i) => i);
  task("1M sorted values", () => bisectNearest(sorted, 500_000.5));
});

// Build cost and per-query cost matter separately: a chart builds the index
// once per data change, then queries it on every pointer move.
group(
  "createGridIndex",
  () => {
    const points = buildSeries(100_000).map((row) => ({
      x: row.x % 2000,
      y: row.y,
    }));
    const index = createGridIndex(points, 20);
    const queries = Array.from({ length: 10_000 }, (_, i) => ({
      x: (i * 37) % 2000,
      y: Math.sin(i) * 100,
    }));

    task("build, 100k points", () => createGridIndex(points, 20));
    task("10k queries over 100k points", () => {
      for (const query of queries) index.nearest(query.x, query.y);
    });
  },
  { gc: true },
);

group("formatCompact", () => {
  task("100k calls", () => {
    for (let i = 0; i < 100_000; i++) formatCompact(i * 137);
  });
});
