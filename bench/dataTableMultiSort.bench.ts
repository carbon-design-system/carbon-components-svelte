// Pure-logic benchmark: no jsdom, no Svelte, run directly via bun (`bunx ostia bench bench/dataTableMultiSort.bench.ts`).
// Times `sortRows`, the comparator behind DataTable's `sortMode="multiple"`,
// on one, two and three keys. Ties are frequent on purpose (five companies,
// a hundred ages), so most comparisons read every key.
import { group, range, task } from "ostia";
import { sortRows } from "../src/DataTable/data-table-utils.js";

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
      name: `Row ${(i * 7919) % 997}`,
      age: (i * 37) % 100,
      contact: { company: COMPANIES[i % COMPANIES.length] },
    });
  }
  return rows;
}

const specs = [
  { key: "contact.company", path: "contact.company", ascending: true },
  { key: "age", path: "age", ascending: false },
  { key: "name", path: "name", ascending: true },
].map((spec) => ({ ...spec, headerSort: undefined }));

group(
  "DataTable multi sort",
  () => {
    for (const size of range(1000, 10_000)) {
      const rows = buildRows(size);
      for (const keys of [1, 2, 3]) {
        task(`${size} rows, ${keys} key${keys > 1 ? "s" : ""}`, () =>
          sortRows(rows, specs.slice(0, keys), undefined),
        );
      }
    }
  },
  { gc: true },
);
