// Pure-logic benchmark: no jsdom, no Svelte, run directly via bun (`bun run bench/<this file>.bench.ts`, optionally filtered — see CONTRIBUTING.md).
// Mirrors DataTable.svelte's `$: sortedRows` reactive block exactly —
// [...rows].sort((a, b) => compareValues(resolvePath(a, key), resolvePath(b, key), ascending))
// — which recomputes on every rows/sortKey/sortDirection change.
import { bench } from "mitata";
import {
  compareValues,
  resolvePath,
} from "../src/DataTable/data-table-utils.js";
import { runWithFilter } from "./run-with-filter.js";

type Row = {
  id: number;
  name: string;
  age: number;
  contact: { company: string };
};

const COMPANIES = ["Acme", "Globex", "Initech", "Umbrella", "Soylent"];

function buildRows(count: number): Row[] {
  const rows: Row[] = [];
  for (let i = 0; i < count; i++) {
    rows.push({
      id: i,
      name: `Row ${i}`,
      age: (i * 37) % 100,
      contact: { company: COMPANIES[i % COMPANIES.length] },
    });
  }
  return rows;
}

// `.gc("inner")` forces a GC before/after every sample instead of mitata's
// default of batching many calls together with no GC in between. Without it,
// these two cases (which each allocate a fresh sorted array per call)
// mis-calibrate batch size and report numbers inflated by 20-60x — e.g. the
// nested-string case below measured 9.38s/iter at 10k rows without this flag,
// vs. ~180ms/iter with it (confirmed against a plain performance.now() loop).
// Cross-check any surprising absolute number from an allocation-heavy bench
// against a manual loop before trusting it.

// Flat numeric key: resolvePath's `path in object` fast path, compareValues'
// numeric fast path.
bench("DataTable sort, flat numeric key, $size rows", function* (state) {
  const size = state.get("size");
  const rows = buildRows(size);
  yield () =>
    [...rows].sort((a, b) => {
      const itemA = resolvePath(a, "age");
      const itemB = resolvePath(b, "age");
      return compareValues(itemA, itemB, true);
    });
})
  .range("size", 100, 10_000)
  .gc("inner");

// Nested string key: exercises resolvePath's split + path-cache lookup and
// compareValues' localeCompare path — the more expensive combination.
bench("DataTable sort, nested string key, $size rows", function* (state) {
  const size = state.get("size");
  const rows = buildRows(size);
  yield () =>
    [...rows].sort((a, b) => {
      const itemA = resolvePath(a, "contact.company");
      const itemB = resolvePath(b, "contact.company");
      return compareValues(itemA, itemB, true);
    });
})
  .range("size", 100, 10_000)
  .gc("inner");

await runWithFilter();
