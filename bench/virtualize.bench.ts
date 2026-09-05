// Pure-logic benchmark: no jsdom, no Svelte, run directly via bun (`bunx ostia bench bench/<this file>.bench.ts`, optionally filtered — see CONTRIBUTING.md).
// Shared windowing math behind Dropdown/MultiSelect/DataTable/TreeViewGrid
// virtualization — the third scenario named alongside tree render and
// DataTable sort. virtualize() slices to a bounded visible window
// (containerHeight/itemHeight + overscan), not the full item count, so this
// sweep is the empirical check that cost is actually O(1) in item count
// rather than assuming it from reading the code.
import { group, range, task } from "ostia";
import { virtualize } from "../src/utils/virtualize.js";

type Item = { id: number };

function buildItems(count: number): Item[] {
  return Array.from({ length: count }, (_, i) => ({ id: i }));
}

group("virtualize(), mid-scroll", () => {
  for (const size of range(100, 100_000)) {
    const items = buildItems(size);
    const scrollTop = Math.floor((size * 40) / 2);
    task(`${size} items`, () =>
      virtualize({
        items,
        itemHeight: 40,
        containerHeight: 300,
        scrollTop,
        threshold: 100,
      }),
    );
  }
});

// Realistic hot path: virtualize() runs on every scroll event, not once.
// Simulates a scrollbar drag across a 10k-item list.
{
  const items = buildItems(10_000);
  const totalHeight = items.length * 40;
  const positions = Array.from({ length: 500 }, (_, i) =>
    Math.floor((i / 500) * totalHeight),
  );

  task("virtualize(), 10k items, 500 scroll positions", () => {
    for (const scrollTop of positions) {
      virtualize({
        items,
        itemHeight: 40,
        containerHeight: 300,
        scrollTop,
        threshold: 100,
      });
    }
  });
}

// The measured path (`wrapOptions` turns it on) replaces the fixed path's
// offset arithmetic with a binary search over prefix sums, rebuilt on every
// call (two walks over every option plus a Float64Array(n+1)). `{ gc: true }`
// forces GC between trials for just these two cases — mitata's original
// `.gc("inner")` on this pair only, not the fixed-path pair above. Without
// it, these allocation-heavy cases mis-calibrate batch size and report
// numbers inflated by 20-60x (see CONTRIBUTING.md).

// Varied, so the binary search is not degenerate: a plain 40px list would
// make every prefix sum uniform and the search land in one step.
function buildHeights(count: number): number[] {
  return Array.from({ length: count }, (_, i) => 32 + ((i * 17) % 96));
}

group(
  "virtualize() measured, mid-scroll",
  () => {
    for (const size of range(100, 100_000)) {
      const items = buildItems(size);
      const heights = buildHeights(size);
      const scrollTop = Math.floor(
        heights.reduce((total, height) => total + height, 0) / 2,
      );
      task(`${size} items`, () =>
        virtualize({
          items,
          itemHeight: 40,
          containerHeight: 300,
          scrollTop,
          threshold: 100,
          measured: true,
          heights,
        }),
      );
    }
  },
  { gc: true },
);

// The measured counterpart of the scrollbar drag above.
{
  const items = buildItems(10_000);
  const heights = buildHeights(10_000);
  const totalHeight = heights.reduce((total, height) => total + height, 0);
  const positions = Array.from({ length: 500 }, (_, i) =>
    Math.floor((i / 500) * totalHeight),
  );

  task(
    "virtualize() measured, 10k items, 500 scroll positions",
    () => {
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
    },
    { gc: true },
  );
}
