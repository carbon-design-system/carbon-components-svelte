// Pure-logic benchmark: no jsdom, no Svelte, run directly via bun (`bunx ostia bench bench/<this file>.bench.ts`, optionally filtered — see CONTRIBUTING.md).
// The work a chart does before it can paint: rows to series groups, a domain,
// scales, and one path per series. It runs on mount and again whenever `data`
// is reassigned. Hover re-runs none of it.
import { group, task } from "ostia";
import { buildBars } from "../src/viz/Chart/bar-geometry.js";
import { buildLinePath } from "../src/viz/Chart/line-geometry.js";
import {
  buildGroups,
  buildScales,
  resolveDomain,
} from "../src/viz/Chart/model.js";

type Row = { date: Date; region: string; revenue: number };

const START = new Date(2026, 0, 1).getTime();
const REGIONS = ["EMEA", "APAC", "AMER"];

function buildRows(perSeries: number): Row[] {
  const rows: Row[] = [];
  for (let i = 0; i < perSeries; i++) {
    for (let r = 0; r < REGIONS.length; r++) {
      rows.push({
        date: new Date(START + i * 60_000),
        region: REGIONS[r],
        revenue: 30_000 + r * 9000 + Math.sin(i / 50 + r) * 9000,
      });
    }
  }
  return rows;
}

const accessors = {
  x: (row: Row) => row.date,
  y: (row: Row) => row.revenue,
  series: (row: Row) => row.region,
};
const size = { width: 900, height: 320 };

function lineChart(rows: Row[], budget?: number) {
  const built = buildGroups(rows, accessors);
  const scales = buildScales(resolveDomain(built, {}), size);
  return built.groups.map((series) =>
    buildLinePath(series, scales, { curve: "monotone", budget }),
  );
}

group("line chart, rows to paths, 3 series", () => {
  for (const perSeries of [1_000, 10_000, 100_000]) {
    const rows = buildRows(perSeries);
    task(`${perSeries} points each, downsampled`, () => lineChart(rows, 1800));
  }
  const rows = buildRows(10_000);
  task("10000 points each, every point drawn", () => lineChart(rows));
});

group("bar chart, rows to rects, 3 series", () => {
  for (const slots of [12, 365]) {
    const rows = buildRows(slots);
    task(`${slots} slots`, () => {
      const built = buildGroups(rows, { ...accessors, band: true });
      const scales = buildScales(resolveDomain(built, {}), size);
      return buildBars(built.groups, scales, { mode: "stacked" });
    });
  }
});
