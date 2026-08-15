// Pure-logic benchmark: no jsdom, no Svelte, run directly via bun (`bun run bench/<this file>.bench.ts`, optionally filtered — see CONTRIBUTING.md).
// BoundedFifoCache backs DataTable's resolvePath path-segment cache (see
// dataTableSort.bench.ts) and is a Map wrapper with `.keys().next().value`
// eviction — expected O(1) per set() regardless of cache size. A naive FIFO
// implementation (e.g. `Array.from(map.keys())[0]`) would be O(size) instead.
//
// Measured result is more nuanced than a clean O(1)/O(n) verdict: a single
// evicting set(), measured in isolation (below), scales with maxSize —
// ~110ns at 100 → ~11.7µs at 10,000 (confirmed with and without `.gc("inner")`,
// so this isn't a mitata batching artifact) — because V8's Map does periodic
// backing-table compaction proportional to table size after repeated
// delete+insert cycles. But amortized over many sets in a tight loop, the
// average cost is far lower (~0.3ns → ~12ns at the same sizes) because most
// individual sets don't trigger a compaction. Both numbers are "real" —
// they just answer different questions, so both are benched here. At this
// cache's actual codebase size (MAX_PATH_CACHE_SIZE = 1000 in
// data-table-utils.js) and its real workload (fills once, then mostly
// cache-hit gets — evictions are rare, not back-to-back), the single-call
// number is the more representative one, and even that is negligible
// (sub-microsecond) at this scale.
import { bench } from "mitata";
import { BoundedFifoCache } from "../src/utils/boundedFifoCache.js";
import { runWithFilter } from "./run-with-filter.js";

// Cache held at capacity (maxSize == $size), so every set() past warmup
// evicts — the worst case for eviction cost, not the empty-cache case.
bench(
  "BoundedFifoCache set() at capacity, single call, $size maxSize",
  function* (state) {
    const size = state.get("size");
    const cache = new BoundedFifoCache<number, number>(size);
    for (let i = 0; i < size; i++) cache.set(i, i);
    let next = size;
    yield () => cache.set(next++, next);
  },
).range("size", 100, 10_000);

const AMORTIZE_COUNT = 1000;

bench(
  `BoundedFifoCache set() at capacity, amortized over ${AMORTIZE_COUNT} calls, $size maxSize`,
  function* (state) {
    const size = state.get("size");
    const cache = new BoundedFifoCache<number, number>(size);
    for (let i = 0; i < size; i++) cache.set(i, i);
    let next = size;
    yield () => {
      for (let i = 0; i < AMORTIZE_COUNT; i++) cache.set(next++, next);
    };
  },
).range("size", 100, 10_000);

await runWithFilter();
