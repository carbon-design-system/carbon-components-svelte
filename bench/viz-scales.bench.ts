// Pure-logic benchmark: no jsdom, no Svelte, run directly via bun (`bunx ostia bench bench/<this file>.bench.ts`, optionally filtered — see CONTRIBUTING.md).
// scaleLinear/scaleBand/ticks/timeTicks all run on every render of a chart
// axis or series, so these are the hottest pure-JS paths in src/viz.
import { group, range, task } from "ostia";
import { scaleBand } from "../src/viz/utils/scale-band.js";
import { scaleLinear } from "../src/viz/utils/scale-linear.js";
import { ticks } from "../src/viz/utils/ticks.js";
import { timeTicks } from "../src/viz/utils/time-ticks.js";

const VALUES = Array.from({ length: 100_000 }, (_, i) => i / 100_000);

group("scaleLinear.map, 100k values", () => {
  const scale = scaleLinear({ domain: [0, 1], range: [0, 1000] });
  task("map", () => {
    for (let i = 0; i < VALUES.length; i++) scale.map(VALUES[i]);
  });
});

// scaleBand builds a Map plus a deduped key array up front, so construction
// cost (not just lookup) matters as the key count grows.
group(
  "scaleBand: construction + 100k lookups",
  () => {
    for (const size of [10, 1_000, 10_000]) {
      const domain = Array.from({ length: size }, (_, i) => `key-${i}`);
      task(`${size} keys`, () => {
        const scale = scaleBand({ domain, range: [0, 1000] });
        for (let i = 0; i < 100_000; i++) scale.map(domain[i % size]);
      });
    }
  },
  { gc: true },
);

group(
  "ticks()",
  () => {
    for (const count of range(5, 100)) {
      task(`count=${count}`, () => ticks(0, 1_000_000, count));
    }
  },
  { gc: true },
);

group(
  "timeTicks() across a year",
  () => {
    const start = Date.UTC(2024, 0, 1);
    const end = Date.UTC(2025, 0, 1);
    for (const count of [3, 6, 12, 24]) {
      task(`count=${count}`, () => timeTicks(start, end, count, { utc: true }));
    }
  },
  { gc: true },
);
