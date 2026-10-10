import { render, screen, within } from "@testing-library/svelte";
import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
import { tick } from "svelte";
import { isSvelte5 } from "../utils/svelte-version";
import { user } from "../utils/user";
import DataTableTableCellsCache from "./DataTableTableCellsCache.test.svelte";
import { getFirstBodyRow } from "./helpers";

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

  it("reflects in-place row mutations when the row reference is unchanged", async () => {
    const row = { id: "a", name: "Alpha" };

    const { rerender } = render(DataTableTableCellsCache, {
      props: { headers, rows: [row] },
    });

    expect(
      within(getFirstBodyRow()).queryByRole("cell", { name: "Alpha" }),
    ).not.toBeNull();

    row.name = "Beta";
    await rerender({ rows: [row] });
    await tick();

    expect(
      within(getFirstBodyRow()).queryByRole("cell", { name: "Beta" }),
    ).not.toBeNull();
    expect(
      within(getFirstBodyRow()).queryByRole("cell", { name: "Alpha" }),
    ).toBeNull();
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

describe("DataTable re-sorting", () => {
  it("moves rendered rows without re-running cell display", async () => {
    let calls = 0;
    const headers = [
      {
        key: "name",
        value: "Name",
        display: (value: unknown) => {
          calls++;
          return String(value);
        },
      },
    ];
    const rows = [
      { id: "a", name: "Bravo" },
      { id: "b", name: "Alpha" },
      { id: "c", name: "Charlie" },
    ];
    render(DataTable, { props: { sortable: true, headers, rows } });
    const names = () =>
      [...document.querySelectorAll("tbody tr")].map((tr) =>
        tr.textContent?.trim(),
      );
    calls = 0;

    await user.click(screen.getByRole("button", { name: /Name/ }));
    expect(names()).toEqual(["Alpha", "Bravo", "Charlie"]);
    await user.click(screen.getByRole("button", { name: /Name/ }));
    expect(names()).toEqual(["Charlie", "Bravo", "Alpha"]);

    // Svelte 3/4 re-run each block bodies whenever the list changes.
    if (isSvelte5) expect(calls).toBe(0);
  });
});
