// Pure-logic benchmark: no jsdom, no Svelte, run directly via bun (`bun run bench/<this file>.bench.ts`, optionally filtered — see CONTRIBUTING.md).
// Mirrors MultiSelect.svelte's default `sortItem`, which runs inside sort()
// on every items/selectedIds change, against the cached-Intl.Collator form
// the default was switched to (same change DataTable's compareValues got).
import { bench } from "mitata";
import { runWithFilter } from "./run-with-filter.js";

type Item = {
  id: number;
  text: string;
};

function buildItems(count: number): Item[] {
  const items: Item[] = [];
  for (let i = 0; i < count; i++) {
    items.push({
      id: i,
      text: `Option ${(i * 37) % count} rev ${i % 10}`,
    });
  }
  return items;
}

// `.gc("inner")` forces a GC before/after every sample instead of mitata's
// default of batching many calls together with no GC in between. Without it,
// these two cases (which each allocate a fresh sorted array per call)
// mis-calibrate batch size and report numbers inflated by 20-60x.
// Cross-check any surprising absolute number from an allocation-heavy bench
// against a manual loop before trusting it (the 10k ratio below was confirmed
// at ~10x with a plain performance.now() loop: 140ms vs 14ms per sort).

// Per-call localeCompare: MultiSelect's former default sortItem. Passing an
// options object makes each comparison rebuild the full ICU collator.
bench(
  "MultiSelect default sortItem (per-call localeCompare), $size items",
  function* (state) {
    const size = state.get("size");
    const items = buildItems(size);
    yield () =>
      [...items].sort((a, b) =>
        a.text.localeCompare(b.text, "en", { numeric: true }),
      );
  },
)
  .range("size", 100, 10_000)
  .gc("inner");

// Cached Intl.Collator: the current default. The collator is created once in
// setup (unmeasured), then its .compare() is reused across all comparisons.
bench(
  "MultiSelect cached Intl.Collator sortItem, $size items",
  function* (state) {
    const size = state.get("size");
    const items = buildItems(size);
    const collator = new Intl.Collator("en", { numeric: true });
    yield () => [...items].sort((a, b) => collator.compare(a.text, b.text));
  },
)
  .range("size", 100, 10_000)
  .gc("inner");

await runWithFilter();
