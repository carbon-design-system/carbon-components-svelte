// Pure-logic benchmark: no jsdom, no Svelte, run directly via bun (`bun run bench/<this file>.bench.ts`, optionally filtered — see CONTRIBUTING.md).
// Shared windowing math behind Dropdown/MultiSelect/DataTable/TreeViewGrid
// virtualization — the third scenario named alongside tree render and
// DataTable sort. virtualize() slices to a bounded visible window
// (containerHeight/itemHeight + overscan), not the full item count, so this
// sweep is the empirical check that cost is actually O(1) in item count
// rather than assuming it from reading the code.
import { bench } from "mitata";
import { virtualize } from "../src/utils/virtualize.js";
import { runWithFilter } from "./run-with-filter.js";

type Item = { id: number };

function buildItems(count: number): Item[] {
  return Array.from({ length: count }, (_, i) => ({ id: i }));
}

bench("virtualize(), $size items, mid-scroll", function* (state) {
  const size = state.get("size");
  const items = buildItems(size);
  const scrollTop = Math.floor((size * 40) / 2);
  yield () =>
    virtualize({
      items,
      itemHeight: 40,
      containerHeight: 300,
      scrollTop,
      threshold: 100,
    });
}).range("size", 100, 100_000);

// Realistic hot path: virtualize() runs on every scroll event, not once.
// Simulates a scrollbar drag across a 10k-item list.
bench("virtualize(), 10k items, 500 scroll positions", function* () {
  const items = buildItems(10_000);
  const totalHeight = items.length * 40;
  const positions = Array.from({ length: 500 }, (_, i) =>
    Math.floor((i / 500) * totalHeight),
  );

  yield () => {
    for (const scrollTop of positions) {
      virtualize({
        items,
        itemHeight: 40,
        containerHeight: 300,
        scrollTop,
        threshold: 100,
      });
    }
  };
});

// The measured path, which `wrapOptions` turns on, replaces the fixed path's
// offset arithmetic with a binary search over prefix sums. The sums are rebuilt
// on every call: two walks over every option plus a Float64Array(n+1), however
// few options are actually measured. Comparing this sweep against the fixed
// sweep above shows what that costs.
function buildHeights(count: number): number[] {
  // Varied, so the binary search is not degenerate: a plain 40px list would
  // make every prefix sum uniform and the search land in one step.
  return Array.from({ length: count }, (_, i) => 32 + ((i * 17) % 96));
}

bench("virtualize() measured, $size items, mid-scroll", function* (state) {
  const size = state.get("size");
  const items = buildItems(size);
  const heights = buildHeights(size);
  const scrollTop = Math.floor(
    heights.reduce((total, height) => total + height, 0) / 2,
  );
  yield () =>
    virtualize({
      items,
      itemHeight: 40,
      containerHeight: 300,
      scrollTop,
      threshold: 100,
      measured: true,
      heights,
    });
})
  .range("size", 100, 100_000)
  .gc("inner");

// The measured counterpart of the scrollbar drag above.
bench("virtualize() measured, 10k items, 500 scroll positions", function* () {
  const items = buildItems(10_000);
  const heights = buildHeights(10_000);
  const totalHeight = heights.reduce((total, height) => total + height, 0);
  const positions = Array.from({ length: 500 }, (_, i) =>
    Math.floor((i / 500) * totalHeight),
  );

  yield () => {
    for (const scrollTop of positions) {
      virtualize({
        items,
        itemHeight: 40,
        containerHeight: 300,
        scrollTop,
        threshold: 100,
        measured: true,
        heights,
      });
    }
  };
}).gc("inner");

await runWithFilter();
