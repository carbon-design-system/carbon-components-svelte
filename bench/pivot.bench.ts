// Pure-logic benchmark: no jsdom, no Svelte, run directly via bun
// (`bunx ostia bench bench/pivot.bench.ts`). `pivot` does the whole
// aggregation once; `layoutPivot` is what opening a group re-runs.
import { group, task } from "ostia";
import { groupIds, layoutPivot } from "../src/PivotTable/pivot-layout.js";
import { pivot } from "../src/PivotTable/pivot.js";

function buildRecords(count: number) {
  let seed = 1;
  const next = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
  return Array.from({ length: count }, () => {
    const region = Math.floor(next() * 8);
    return {
      region: `Region ${region}`,
      country: `Country ${region}-${Math.floor(next() * 12)}`,
      product: `Product ${Math.floor(next() * 25)}`,
      year: 2020 + Math.floor(next() * 5),
      quarter: `Q${1 + Math.floor(next() * 4)}`,
      amount: Math.round(next() * 1000) / 10,
      units: Math.floor(next() * 20),
    };
  });
}

const config = {
  rows: ["region", "country", "product"],
  columns: ["year", "quarter"],
  values: [{ field: "amount", aggregate: "sum" as const }],
};

group(
  "pivot, 3 row fields x 2 column fields",
  () => {
    for (const size of [1_000, 10_000, 100_000]) {
      const records = buildRecords(size);
      task(`${size} records, 1 value`, () => pivot(records, config));
      task(`${size} records, sum and average`, () =>
        pivot(records, {
          ...config,
          values: [
            { field: "amount", aggregate: "sum" },
            { field: "units", aggregate: "avg" },
          ],
        }),
      );
    }
  },
  { gc: true },
);

group("layoutPivot, 100,000 records", () => {
  const result = pivot(buildRecords(100_000), config);
  const rows = new Set(groupIds(result.rowRoot));
  const columns = new Set(groupIds(result.columnRoot));
  task("collapsed", () => layoutPivot(result));
  task("every group open", () =>
    layoutPivot(result, { expandedRowIds: rows, expandedColumnIds: columns }),
  );
});
