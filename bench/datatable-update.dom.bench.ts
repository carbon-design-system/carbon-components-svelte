import { fireEvent, render } from "@testing-library/svelte";
import { task } from "ostia";
import { tick } from "svelte";
import DataTableSortBench from "./fixtures/DataTableSortBench.svelte";

// Updates to a mounted 1000-row table other than sorting and filtering:
// toggling one row's checkbox, a refetch that returns equal rows, and an
// immutable edit of one row. Instances render once; the timed closures only
// update them.

function buildRows(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: String(i),
    name: `row ${i} - Load Balancer`,
    protocol: "HTTP",
    port: (i * 37) % 9000,
    rule: i % 2 ? "Round robin" : "DNS delegation",
  }));
}

const selectable = render(DataTableSortBench, {
  props: { rows: buildRows(1000), selectable: true },
});
const checkbox = selectable.container.querySelector<HTMLInputElement>(
  "tbody input[type='checkbox']",
);
if (!checkbox) throw new Error("row checkbox not found");

task("select a row, DataTable 1000 rows", async () => {
  await fireEvent.click(checkbox);
  await tick();
});

const refetched = render(DataTableSortBench, {
  props: { rows: buildRows(1000) },
});

task("rows reassigned to an equal copy, DataTable 1000 rows", async () => {
  await refetched.rerender({ rows: buildRows(1000) });
});

const edited = render(DataTableSortBench, {
  props: { rows: buildRows(1000) },
});
let editedRows = buildRows(1000);
let edits = 0;

task("one row replaced, DataTable 1000 rows", async () => {
  const index = edits++ % 1000;
  editedRows = editedRows.with(index, {
    ...editedRows[index],
    port: editedRows[index].port + 1,
  });
  await edited.rerender({ rows: editedRows });
});
