// Pure-logic benchmark: no jsdom, no Svelte, run directly via bun (`bunx ostia bench bench/tableExport.bench.ts`).
// Puts a number on the main-thread cost of a `ToolbarExport` click: it
// serializes every exported row synchronously before the download starts.
import { group, task } from "ostia";
import { toCsv, toJson } from "../src/DataTable/data-table-utils.js";

const headers = [
  { key: "name", value: "Name" },
  { key: "protocol", value: "Protocol" },
  { key: "port", value: "Port" },
  { key: "contact.company", value: "Company" },
];

function buildRows(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: String(i),
    name: `Load Balancer ${i}, "primary"`,
    protocol: "HTTP",
    port: (i * 37) % 9000,
    contact: { company: `Company ${i % 5}` },
  }));
}

for (const size of [10_000, 100_000]) {
  const rows = buildRows(size);
  group(
    `export ${size} rows`,
    () => {
      task("toCsv", () => toCsv(headers, rows));
      task("toJson", () => toJson(headers, rows));
    },
    { gc: true },
  );
}
