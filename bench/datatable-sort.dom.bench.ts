import { fireEvent, render } from "@testing-library/svelte";
import { task } from "ostia";
import { tick } from "svelte";
import DataTableSortBench from "./fixtures/DataTableSortBench.svelte";

// Clicking a sort header on a 1000-row table. dataTableSort.bench.ts times
// the comparator alone; this times the re-render too (row moves, per-row
// work). Instances are rendered once and persist for the file's run, so the
// timed closure only clicks: each click cycles ascending, descending, none.

function buildRows(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: String(i),
    name: `row ${i} - Load Balancer`,
    protocol: "HTTP",
    port: (i * 37) % 9000,
    rule: i % 2 ? "Round robin" : "DNS delegation",
  }));
}

const plain = render(DataTableSortBench, {
  props: { rows: buildRows(1000) },
});
const virtual = render(DataTableSortBench, {
  props: { rows: buildRows(1000), virtualize: true },
});

const getPortButton = (instance: typeof plain) => {
  const button = [
    ...instance.container.querySelectorAll<HTMLButtonElement>("th button"),
  ].find((el) => el.textContent?.includes("Port"));
  if (!button) throw new Error("Port sort button not found");
  return button;
};

const plainButton = getPortButton(plain);
await fireEvent.click(plainButton);
await tick();
const first = plain.container.querySelector("tbody tr")?.textContent ?? "";
process.stdout.write(`sanity: first row after sort "${first.trim()}"\n`);

const registerSortCase = (title: string, button: HTMLButtonElement) => {
  task(title, async () => {
    await fireEvent.click(button);
    await tick();
  });
};

registerSortCase("sort click, DataTable 1000 rows", plainButton);
registerSortCase(
  "sort click, DataTable 1000 rows, virtualized",
  getPortButton(virtual),
);
