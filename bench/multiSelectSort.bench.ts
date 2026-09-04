// Pure-logic benchmark: no jsdom, no Svelte, run directly via bun (`bunx ostia bench bench/<this file>.bench.ts`, optionally filtered — see CONTRIBUTING.md).
// Mirrors MultiSelect.svelte's default `sortItem`, which runs inside sort()
// on every items/selectedIds change, against the cached-Intl.Collator form
// the default was switched to (same change DataTable's compareValues got).
import { group, range, task } from "ostia";

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

// `{ gc: true }` on every group forces `Bun.gc(true)` between trials —
// mitata's per-bench `.gc("inner")` equivalent (see CONTRIBUTING.md). Without
// it, these two cases (which each allocate a fresh sorted array per call)
// mis-calibrate batch size and report numbers inflated by 20-60x. Cross-check
// any surprising absolute number from an allocation-heavy bench against a
// manual loop before trusting it (the 10k ratio below was confirmed at ~10x
// with a plain performance.now() loop: 140ms vs 14ms per sort).

// Per-call localeCompare: MultiSelect's former default sortItem. Passing an
// options object makes each comparison rebuild the full ICU collator.
group(
  "MultiSelect default sortItem (per-call localeCompare)",
  () => {
    for (const size of range(100, 10_000)) {
      const items = buildItems(size);
      task(`${size} items`, () =>
        [...items].sort((a, b) =>
          a.text.localeCompare(b.text, "en", { numeric: true }),
        ),
      );
    }
  },
  { gc: true },
);

// Cached Intl.Collator: the current default. The collator is created once in
// setup (unmeasured), then its .compare() is reused across all comparisons.
group(
  "MultiSelect cached Intl.Collator sortItem",
  () => {
    for (const size of range(100, 10_000)) {
      const items = buildItems(size);
      const collator = new Intl.Collator("en", { numeric: true });
      task(`${size} items`, () =>
        [...items].sort((a, b) => collator.compare(a.text, b.text)),
      );
    }
  },
  { gc: true },
);
