import { render, screen, within } from "@testing-library/svelte";
import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
import { isSvelte5 } from "../utils/svelte-version";
import { user } from "../utils/user";
import DataTableHost from "./DataTable.test.svelte";
import { eventDetails, getColumnTexts, getFirstBodyRow } from "./helpers";

describe("DataTable tableCellsByRowId caching", () => {
  const headers = [{ key: "name", value: "Name" }] as const;
  const lastClickedCell = (onevent: ReturnType<typeof vi.fn>) =>
    (
      eventDetails(onevent, "click:cell").at(-1) as
        | { cell: unknown }
        | undefined
    )?.cell;

  it("reuses cell objects when rows is a new array but row references are unchanged", async () => {
    const row = { id: "a", name: "Alpha" };
    const onevent = vi.fn();

    const { rerender } = render(DataTableHost, {
      props: { headers, rows: [row], onevent },
    });

    const bodyRow = getFirstBodyRow();
    const nameCell = within(bodyRow).getByRole("cell", { name: "Alpha" });
    await user.click(nameCell);
    const first = lastClickedCell(onevent);
    expect(first).toEqual(expect.objectContaining({ key: "name" }));

    await rerender({
      rows: [row],
    });

    await user.click(within(bodyRow).getByRole("cell", { name: "Alpha" }));
    expect(lastClickedCell(onevent)).toBe(first);
  });

  it("rebuilds cell objects when the row object for an id is replaced", async () => {
    const rowV1 = { id: "a", name: "Alpha" };
    const rowV2 = { id: "a", name: "Beta" };
    const onevent = vi.fn();

    const { rerender } = render(DataTableHost, {
      props: { headers, rows: [rowV1], onevent },
    });

    await user.click(
      within(getFirstBodyRow()).getByRole("cell", { name: "Alpha" }),
    );
    const first = lastClickedCell(onevent);
    expect(first).toBeDefined();

    await rerender({ rows: [rowV2] });

    await user.click(
      within(getFirstBodyRow()).getByRole("cell", { name: "Beta" }),
    );
    expect(lastClickedCell(onevent)).not.toBe(first);
    expect(lastClickedCell(onevent)).toEqual(
      expect.objectContaining({ value: "Beta" }),
    );
  });

  it("reflects in-place row mutations when the row reference is unchanged", async () => {
    const row = { id: "a", name: "Alpha" };

    const { rerender } = render(DataTableHost, {
      props: { headers, rows: [row] },
    });

    expect(
      within(getFirstBodyRow()).queryByRole("cell", { name: "Alpha" }),
    ).not.toBeNull();

    row.name = "Beta";
    await rerender({ rows: [row] });

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

    const onevent = vi.fn();

    const { rerender } = render(DataTableHost, {
      props: { headers, rows: [row], onevent },
    });

    expect(within(getFirstBodyRow()).queryByText("HTTP")).toBeNull();

    await rerender({ headers: headersWide });

    await user.click(within(getFirstBodyRow()).getByText("HTTP"));
    expect(lastClickedCell(onevent)).toEqual(
      expect.objectContaining({ key: "protocol", value: "HTTP" }),
    );
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
    calls = 0;

    await user.click(screen.getByRole("button", { name: /Name/ }));
    expect(getColumnTexts(0)).toEqual(["Alpha", "Bravo", "Charlie"]);
    await user.click(screen.getByRole("button", { name: /Name/ }));
    expect(getColumnTexts(0)).toEqual(["Charlie", "Bravo", "Alpha"]);

    // Svelte 3/4 re-run each block bodies whenever the list changes.
    if (isSvelte5) expect(calls).toBe(0);
  });
});
