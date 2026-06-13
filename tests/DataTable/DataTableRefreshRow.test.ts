import { render, screen, within } from "@testing-library/svelte";
import { tick } from "svelte";
import DataTableRefreshRow from "./DataTableRefreshRow.test.svelte";

function getFirstBodyRow(): HTMLElement {
  const rows = screen
    .getAllByRole("row")
    .filter((r) => r.closest("tbody") !== null);
  expect(rows.length).toBeGreaterThan(0);
  return rows[0];
}

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
