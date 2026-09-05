// Pure-logic benchmark: no jsdom, no Svelte, run directly via bun (`bunx ostia bench bench/<this file>.bench.ts`, optionally filtered — see CONTRIBUTING.md).
// Mirrors DataTable.svelte's `filterRows` default predicate exactly —
// rows.filter((row) => searchableKeys.some((key) => { const v = resolvePath(row, key); return (typeof v === "string" || typeof v === "number") ? `${v}`.toLowerCase().includes(value) : false; }))
// — which recomputes on every rows/searchValue change (default path when no customFilter is provided).
// This is the hot path: ToolbarSearch invokes filterRows on every keystroke over all rows.
import { group, range, task } from "ostia";
import { resolvePath } from "../src/DataTable/data-table-utils.js";

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
// it, these cases (which each allocate a fresh filtered array per call)
// mis-calibrate batch size and report numbers inflated by 20-60x — e.g.
// filtering at 10k rows without this flag could measure several hundred ms/iter,
// vs. ~5-10ms/iter with it (allocation-heavy array.filter calls).
// Cross-check any surprising absolute number from an allocation-heavy bench
// against a manual loop before trusting it.

// Few matches: only "Row 7" matches the search term "row 7" (one exact row ID match).
group(
  "DataTable default filter, few matches",
  () => {
    for (const size of range(100, 10_000)) {
      const rows = buildRows(size);
      const keys = ["name", "age", "contact.company"];
      const value = "row 7";
      task(`${size} rows`, () =>
        rows.filter((row) =>
          keys.some((key) => {
            const v = resolvePath(row, key);
            return typeof v === "string" || typeof v === "number"
              ? `${v}`.toLowerCase().includes(value)
              : false;
          }),
        ),
      );
    }
  },
  { gc: true },
);

// Many matches: "acme" matches ~1/5 of rows via contact.company (COMPANIES[i % 5] cycles through "Acme" frequently).
group(
  "DataTable default filter, many matches",
  () => {
    for (const size of range(100, 10_000)) {
      const rows = buildRows(size);
      const keys = ["name", "age", "contact.company"];
      const value = "acme";
      task(`${size} rows`, () =>
        rows.filter((row) =>
          keys.some((key) => {
            const v = resolvePath(row, key);
            return typeof v === "string" || typeof v === "number"
              ? `${v}`.toLowerCase().includes(value)
              : false;
          }),
        ),
      );
    }
  },
  { gc: true },
);

// No matches: "zzzz" does not match any row field.
group(
  "DataTable default filter, no matches",
  () => {
    for (const size of range(100, 10_000)) {
      const rows = buildRows(size);
      const keys = ["name", "age", "contact.company"];
      const value = "zzzz";
      task(`${size} rows`, () =>
        rows.filter((row) =>
          keys.some((key) => {
            const v = resolvePath(row, key);
            return typeof v === "string" || typeof v === "number"
              ? `${v}`.toLowerCase().includes(value)
              : false;
          }),
        ),
      );
    }
  },
  { gc: true },
);
