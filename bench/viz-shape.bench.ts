// Pure-logic benchmark: no jsdom, no Svelte, run directly via bun (`bunx ostia bench bench/<this file>.bench.ts`, optionally filtered — see CONTRIBUTING.md).
// pathLine/stack/bin back every chart mark: a line/area redraw, a stacked
// bar/area layout, and a histogram recompute all run on pan/zoom/filter, so
// their per-frame cost at realistic and stress sizes matters.
import { group, range, task } from "ostia";
import { bin } from "../src/viz/utils/bin.js";
import { pathLine } from "../src/viz/utils/path-line.js";
import { stack } from "../src/viz/utils/stack.js";

function buildPoints(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    x: i,
    y: Math.sin(i / 50) * 100,
  }));
}

group(
  "pathLine linear",
  () => {
    for (const size of range(1_000, 100_000)) {
      const points = buildPoints(size);
      task(`${size} points`, () => pathLine(points));
    }
  },
  { gc: true },
);

group(
  "pathLine monotone",
  () => {
    for (const size of range(1_000, 100_000)) {
      const points = buildPoints(size);
      task(`${size} points`, () => pathLine(points, { curve: "monotone" }));
    }
  },
  { gc: true },
);

function buildStackRows(seriesCount: number, xCount: number) {
  const rows: { x: number; s: string; v: number }[] = [];
  for (let x = 0; x < xCount; x++) {
    for (let s = 0; s < seriesCount; s++) {
      rows.push({ x, s: `series-${s}`, v: (x + s) % 17 });
    }
  }
  return rows;
}

group(
  "stack",
  () => {
    const rows = buildStackRows(10, 10_000);
    task("10 series x 10k x", () =>
      stack(rows, {
        x: (row) => row.x,
        y: (row) => row.v,
        series: (row) => row.s,
      }),
    );
  },
  { gc: true },
);

group(
  "bin",
  () => {
    const values = Array.from(
      { length: 1_000_000 },
      () => Math.random() * 1000,
    );
    task("1,000,000 values", () => bin(values));
  },
  { gc: true },
);
