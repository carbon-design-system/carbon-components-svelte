// Pure-logic benchmark: no jsdom, no Svelte, run directly via bun (`bunx ostia bench bench/<this file>.bench.ts`, optionally filtered — see CONTRIBUTING.md).
// Mirrors DataTable.svelte's `$: sortedRows` reactive block exactly —
// [...rows].sort((a, b) => compareValues(resolvePath(a, key), resolvePath(b, key), ascending))
// — which recomputes on every rows/sortKey/sortDirection change.
import { group, range, task } from "ostia";
import {
  compareValues,
  resolvePath,
} from "../src/DataTable/data-table-utils.js";

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

// `{ gc: true }` on every group forces `Bun.gc(true)` between trials —
// mitata's per-bench `.gc("inner")` equivalent (see CONTRIBUTING.md). Without
// it, these two cases (which each allocate a fresh sorted array per call)
// mis-calibrate batch size and report numbers inflated by 20-60x — e.g. the
// nested-string case below measured 9.38s/iter at 10k rows without this
// flag, vs. ~180ms/iter with it (confirmed against a plain performance.now()
// loop). Cross-check any surprising absolute number from an
// allocation-heavy bench against a manual loop before trusting it.

// Flat numeric key: resolvePath's `path in object` fast path, compareValues'
// numeric fast path.
group(
  "DataTable sort, flat numeric key",
  () => {
    for (const size of range(100, 10_000)) {
      const rows = buildRows(size);
      task(`${size} rows`, () =>
        [...rows].sort((a, b) => {
          const itemA = resolvePath(a, "age");
          const itemB = resolvePath(b, "age");
          return compareValues(itemA, itemB, true);
        }),
      );
    }
  },
  { gc: true },
);

// Nested string key: exercises resolvePath's split + path-cache lookup and
// compareValues' localeCompare path — the more expensive combination.
group(
  "DataTable sort, nested string key",
  () => {
    for (const size of range(100, 10_000)) {
      const rows = buildRows(size);
      task(`${size} rows`, () =>
        [...rows].sort((a, b) => {
          const itemA = resolvePath(a, "contact.company");
          const itemB = resolvePath(b, "contact.company");
          return compareValues(itemA, itemB, true);
        }),
      );
    }
  },
  { gc: true },
);
