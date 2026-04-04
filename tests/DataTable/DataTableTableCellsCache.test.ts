import { render, screen, within } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../setup-tests";
import DataTableTableCellsCache from "./DataTableTableCellsCache.test.svelte";

function getFirstBodyRow(): HTMLElement {
  const rows = screen
    .getAllByRole("row")
    .filter((r) => r.closest("tbody") !== null);
  expect(rows.length).toBeGreaterThan(0);
  return rows[0];
}

describe("DataTable tableCellsByRowId caching", () => {
  const headers = [{ key: "name", value: "Name" }] as const;

  it("reuses cell objects when rows is a new array but row references are unchanged", async () => {
    const row = { id: "a", name: "Alpha" };
    let lastCell: { key: string; value: unknown } | undefined;

    const { rerender } = render(DataTableTableCellsCache, {
      props: {
        headers,
        rows: [row],
        onCellClick: (cell) => {
          lastCell = cell;
        },
      },
    });

    const bodyRow = getFirstBodyRow();
    const nameCell = within(bodyRow).getByRole("cell", { name: "Alpha" });
    await user.click(nameCell);
    const first = lastCell;
    expect(first).toBeDefined();
    expect(first).toEqual(expect.objectContaining({ key: "name" }));

    await rerender({
      rows: [row],
    });
    await tick();

    await user.click(within(bodyRow).getByRole("cell", { name: "Alpha" }));
    expect(lastCell).toBe(first);
  });

  it("rebuilds cell objects when the row object for an id is replaced", async () => {
    const rowV1 = { id: "a", name: "Alpha" };
    const rowV2 = { id: "a", name: "Beta" };
    let lastCell: { key: string; value: unknown } | undefined;

    const { rerender } = render(DataTableTableCellsCache, {
      props: {
        headers,
        rows: [rowV1],
        onCellClick: (cell) => {
          lastCell = cell;
        },
      },
    });

    await user.click(
      within(getFirstBodyRow()).getByRole("cell", { name: "Alpha" }),
    );
    const first = lastCell;
    expect(first).toBeDefined();

    await rerender({ rows: [rowV2] });
    await tick();

    await user.click(
      within(getFirstBodyRow()).getByRole("cell", { name: "Beta" }),
    );
    expect(lastCell).not.toBe(first);
    expect(lastCell).toEqual(expect.objectContaining({ value: "Beta" }));
  });

  it("rebuilds cell objects when headers change", async () => {
    const row = { id: "a", name: "Alpha", protocol: "HTTP" };
    const headersWide = [
      { key: "name", value: "Name" },
      { key: "protocol", value: "Protocol" },
    ] as const;

    let lastCell: { key: string; value: unknown } | undefined;

    const { rerender } = render(DataTableTableCellsCache, {
      props: {
        headers,
        rows: [row],
        onCellClick: (cell) => {
          lastCell = cell;
        },
      },
    });

    await user.click(
      within(getFirstBodyRow()).getByRole("cell", { name: "Alpha" }),
    );
    const first = lastCell;
    expect(first).toBeDefined();

    await rerender({ headers: headersWide, rows: [row] });
    await tick();

    await user.click(
      within(getFirstBodyRow()).getByRole("cell", { name: "Alpha" }),
    );
    expect(lastCell).not.toBe(first);
  });
});
