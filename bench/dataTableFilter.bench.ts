// Pure-logic benchmark: no jsdom, no Svelte, run directly via bun (`bun run bench/<this file>.bench.ts`, optionally filtered — see CONTRIBUTING.md).
// Mirrors DataTable.svelte's `filterRows` default predicate exactly —
// rows.filter((row) => searchableKeys.some((key) => { const v = resolvePath(row, key); return (typeof v === "string" || typeof v === "number") ? `${v}`.toLowerCase().includes(value) : false; }))
// — which recomputes on every rows/searchValue change (default path when no customFilter is provided).
// This is the hot path: ToolbarSearch invokes filterRows on every keystroke over all rows.
import { bench } from "mitata";
import { resolvePath } from "../src/DataTable/data-table-utils.js";
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
// these cases (which each allocate a fresh filtered array per call)
// mis-calibrate batch size and report numbers inflated by 20-60x — e.g.
// filtering at 10k rows without this flag could measure several hundred ms/iter,
// vs. ~5-10ms/iter with it (allocation-heavy array.filter calls).
// Cross-check any surprising absolute number from an allocation-heavy bench
// against a manual loop before trusting it.

// Few matches: only "Row 7" matches the search term "row 7" (one exact row ID match).
bench("DataTable default filter, few matches, $size rows", function* (state) {
  const size = state.get("size");
  const rows = buildRows(size);
  const keys = ["name", "age", "contact.company"];
  const value = "row 7";
  yield () =>
    rows.filter((row) =>
      keys.some((key) => {
        const v = resolvePath(row, key);
        return typeof v === "string" || typeof v === "number"
          ? `${v}`.toLowerCase().includes(value)
          : false;
      }),
    );
})
  .range("size", 100, 10_000)
  .gc("inner");

// Many matches: "acme" matches ~1/5 of rows via contact.company (COMPANIES[i % 5] cycles through "Acme" frequently).
bench("DataTable default filter, many matches, $size rows", function* (state) {
  const size = state.get("size");
  const rows = buildRows(size);
  const keys = ["name", "age", "contact.company"];
  const value = "acme";
  yield () =>
    rows.filter((row) =>
      keys.some((key) => {
        const v = resolvePath(row, key);
        return typeof v === "string" || typeof v === "number"
          ? `${v}`.toLowerCase().includes(value)
          : false;
      }),
    );
})
  .range("size", 100, 10_000)
  .gc("inner");

// No matches: "zzzz" does not match any row field.
bench("DataTable default filter, no matches, $size rows", function* (state) {
  const size = state.get("size");
  const rows = buildRows(size);
  const keys = ["name", "age", "contact.company"];
  const value = "zzzz";
  yield () =>
    rows.filter((row) =>
      keys.some((key) => {
        const v = resolvePath(row, key);
        return typeof v === "string" || typeof v === "number"
          ? `${v}`.toLowerCase().includes(value)
          : false;
      }),
    );
})
  .range("size", 100, 10_000)
  .gc("inner");

await runWithFilter();
