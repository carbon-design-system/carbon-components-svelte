import { render } from "@testing-library/svelte";
import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";

const headers = [
  { key: "name", value: "Name" },
  { key: "port", value: "Port" },
] as const;

const rows = [
  { id: "a", name: "Load Balancer 3", port: 3000 },
  { id: "b", name: "Load Balancer 1", port: 443 },
  { id: "c", name: "Load Balancer 2", port: 80 },
];

describe("DataTable highlightedRowIds", () => {
  it("reacts when highlightedRowIds changes", async () => {
    const { container, rerender } = render(DataTable, {
      props: { headers, rows, highlightedRowIds: [] },
    });

    expect(
      container.querySelector(".bx--data-table--highlighted-row"),
    ).not.toBeInTheDocument();

    await rerender({ headers, rows, highlightedRowIds: ["c"] });

    const highlightedRow = container.querySelector("tr[data-row='c']");
    expect(highlightedRow).toHaveClass("bx--data-table--highlighted-row");
    expect(container.querySelector("tr[data-row='a']")).not.toHaveClass(
      "bx--data-table--highlighted-row",
    );
  });
});
