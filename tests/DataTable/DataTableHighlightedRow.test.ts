import { render } from "@testing-library/svelte";
import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
import { tick } from "svelte";

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
  it("highlights rows with the class", () => {
    const { container } = render(DataTable, {
      props: { headers, rows, highlightedRowIds: ["b"] },
    });

    const highlightedRow = container.querySelector("tr[data-row='b']");
    expect(highlightedRow).toHaveClass("bx--data-table--highlighted-row");
  });

  it("does not mark non-highlighted rows", () => {
    const { container } = render(DataTable, {
      props: { headers, rows, highlightedRowIds: ["b"] },
    });

    const row = container.querySelector("tr[data-row='a']");
    expect(row).not.toHaveClass("bx--data-table--highlighted-row");
  });

  it("adds no highlighted rows by default", () => {
    const { container } = render(DataTable, { props: { headers, rows } });

    expect(
      container.querySelector(".bx--data-table--highlighted-row"),
    ).not.toBeInTheDocument();
  });

  it("reacts when highlightedRowIds changes", async () => {
    const { container, rerender } = render(DataTable, {
      props: { headers, rows, highlightedRowIds: [] },
    });

    expect(
      container.querySelector(".bx--data-table--highlighted-row"),
    ).not.toBeInTheDocument();

    rerender({ headers, rows, highlightedRowIds: ["c"] });
    await tick();

    const highlightedRow = container.querySelector("tr[data-row='c']");
    expect(highlightedRow).toHaveClass("bx--data-table--highlighted-row");
    expect(container.querySelector("tr[data-row='a']")).not.toHaveClass(
      "bx--data-table--highlighted-row",
    );
  });
});
