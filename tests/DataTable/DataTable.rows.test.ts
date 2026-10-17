import { render, screen, within } from "@testing-library/svelte";
import DataTableComponent from "carbon-components-svelte/DataTable/DataTable.svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import DataTable from "./DataTable.test.svelte";
import DataTableRefreshRow from "./DataTableRefreshRow.test.svelte";
import { eventNames, getBodyRows, getCells, getFirstBodyRow } from "./helpers";

describe("DataTable body cells", () => {
  const rows = [
    { id: "a", name: "Load Balancer 3", protocol: "HTTP" },
    { id: "b", name: "Load Balancer 1", protocol: "HTTP" },
  ];

  describe("empty column", () => {
    const headers = [
      { key: "name", value: "Name" },
      { key: "actions", value: "", empty: true },
    ] as const;

    it("pairs a data cell with its header and leaves an empty cell unpaired", () => {
      render(DataTable, { props: { headers, rows } });

      const nameHeader = screen.getAllByRole("columnheader")[0];
      const [nameCell, actionsCell] = getCells(getBodyRows()[0]);

      expect(nameHeader.id).toBeTruthy();
      expect(nameCell).toHaveAttribute("headers", nameHeader.id);
      expect(actionsCell).not.toHaveAttribute("headers");
    });

    it("dispatches cell events for a data cell but not an empty cell", async () => {
      const onevent = vi.fn();
      render(DataTable, { props: { headers, rows, onevent } });

      const [nameCell, actionsCell] = getCells(getBodyRows()[0]);

      await user.click(actionsCell);
      expect(eventNames(onevent, "click")).toEqual(["click", "click:row"]);

      onevent.mockClear();
      await user.click(nameCell);
      expect(eventNames(onevent, "click")).toEqual([
        "click",
        "click:cell",
        "click",
        "click:row",
      ]);
    });
  });
});

describe("DataTable refreshRow / refreshCells", () => {
  it("updates a row after in-place edit when refreshRow is called", async () => {
    const { component } = render(DataTableRefreshRow);
    const row = getFirstBodyRow();

    expect(within(row).queryByRole("cell", { name: "alpha" })).not.toBeNull();
    expect(within(row).queryByRole("cell", { name: "ALPHA" })).not.toBeNull();

    component.mutateAndRefreshRow();
    await tick();

    const refreshed = getFirstBodyRow();
    expect(
      within(refreshed).queryByRole("cell", { name: "beta" }),
    ).not.toBeNull();
    expect(within(refreshed).queryByRole("cell", { name: "alpha" })).toBeNull();
    expect(
      within(refreshed).queryByRole("cell", { name: "BETA" }),
    ).not.toBeNull();
    expect(within(refreshed).queryByRole("cell", { name: "ALPHA" })).toBeNull();
  });

  it("does not update cells after in-place edit without refresh", async () => {
    const { component } = render(DataTableRefreshRow);
    const row = getFirstBodyRow();

    expect(within(row).queryByRole("cell", { name: "alpha" })).not.toBeNull();

    component.mutateNoRefresh();
    await tick();

    const stale = getFirstBodyRow();
    expect(within(stale).queryByRole("cell", { name: "alpha" })).not.toBeNull();
    expect(within(stale).queryByRole("cell", { name: "gamma" })).toBeNull();
  });

  it("updates all rows when refreshCells is called", async () => {
    const { component } = render(DataTableRefreshRow);
    expect(
      within(getFirstBodyRow()).queryByRole("cell", { name: "alpha" }),
    ).not.toBeNull();

    component.mutateAndRefreshCells();
    await tick();

    const refreshed = getFirstBodyRow();
    expect(
      within(refreshed).queryByRole("cell", { name: "delta" }),
    ).not.toBeNull();
    expect(
      within(refreshed).queryByRole("cell", { name: "DELTA" }),
    ).not.toBeNull();
  });
});

describe("DataTable highlightedRowIds", () => {
  const headers = [
    { key: "name", value: "Name" },
    { key: "port", value: "Port" },
  ] as const;

  const rows = [
    { id: "a", name: "Load Balancer 3", port: 3000 },
    { id: "b", name: "Load Balancer 1", port: 443 },
    { id: "c", name: "Load Balancer 2", port: 80 },
  ];

  it("reacts when highlightedRowIds changes", async () => {
    const { container, rerender } = render(DataTableComponent, {
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
