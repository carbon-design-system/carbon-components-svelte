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

await runWithFilter();
