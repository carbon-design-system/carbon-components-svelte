import { render, screen, within } from "@testing-library/svelte";
import DataTableComponent from "carbon-components-svelte/DataTable/DataTable.svelte";
import { isSvelte5 } from "../utils/svelte-version";
import { user } from "../utils/user";
import DataTable from "./DataTable.test.svelte";
import ToolbarSearchHost from "./ToolbarSearchHost.test.svelte";
import {
  createSortFn,
  eventDetails,
  getBodyRows,
  getColumnHeaderText,
  getColumnTexts,
  getFirstBodyRow,
  getRowTexts,
} from "./helpers";

describe("DataTable new-but-equal rows", () => {
  const buildHeaders = (sortFn: ReturnType<typeof createSortFn>) => [
    { key: "name", value: "Name", sort: sortFn },
    { key: "port", value: "Port" },
  ];

  const buildRows = () => [
    { id: "a", name: "Load Balancer 3", port: 3000 },
    { id: "b", name: "Load Balancer 1", port: 443 },
    { id: "c", name: "Load Balancer 2", port: 80 },
  ];

  it("does not re-sort for a new-but-equal rows array, and re-sorts for a different one", async () => {
    const sortFn = createSortFn();
    const { rerender } = render(DataTable, {
      props: {
        headers: buildHeaders(sortFn),
        rows: buildRows(),
        sortable: true,
        sortKey: "name",
        sortDirection: "ascending",
      },
    });

    sortFn.mockClear();
    const bodyRows = getBodyRows();
    await rerender({ rows: buildRows() });
    await rerender({ rows: buildRows() });
    expect(sortFn).not.toHaveBeenCalled();
    expect(getBodyRows()).toEqual(bodyRows);

    await rerender({
      rows: [
        { id: "a", name: "Load Balancer 3", port: 3000 },
        { id: "b", name: "Load Balancer 1", port: 443 },
        { id: "c", name: "Load Balancer 2 updated", port: 80 },
      ],
    });
    expect(sortFn).toHaveBeenCalled();
  });

  it("re-sorts when a row is mutated in place and the array is copied", async () => {
    const sortFn = createSortFn();
    const rows = buildRows();
    const { rerender } = render(DataTable, {
      props: {
        headers: buildHeaders(sortFn),
        rows,
        sortable: true,
        sortKey: "name",
        sortDirection: "ascending",
      },
    });

    sortFn.mockClear();
    rows[0].name = "Zzz Balancer";
    await rerender({ rows: [...rows] });
    expect(sortFn).toHaveBeenCalled();
  });

  it("re-sorts when a field compared by identity changes", async () => {
    const withMeta = (renderFn: () => string) => [
      {
        id: "a",
        name: "Load Balancer 3",
        port: 3000,
        meta: { render: renderFn },
      },
      {
        id: "b",
        name: "Load Balancer 1",
        port: 443,
        meta: { render: renderFn },
      },
      {
        id: "c",
        name: "Load Balancer 2",
        port: 80,
        meta: { render: renderFn },
      },
    ];
    const sortFn = createSortFn();
    const renderA = () => "a";
    const { rerender } = render(DataTable, {
      props: {
        headers: buildHeaders(sortFn),
        rows: withMeta(renderA),
        sortable: true,
        sortKey: "name",
        sortDirection: "ascending",
      },
    });

    sortFn.mockClear();
    await rerender({ rows: withMeta(renderA) });
    expect(sortFn).not.toHaveBeenCalled();

    await rerender({ rows: withMeta(() => "a") });
    expect(sortFn).toHaveBeenCalled();
  });

  it("keeps the filtered set when new-but-equal rows arrive with an active search", async () => {
    const buildNamedRows = () => [
      { id: "a", name: "Load Balancer 3" },
      { id: "b", name: "Load Balancer 1" },
      { id: "c", name: "Load Balancer 2" },
    ];
    const { rerender } = render(ToolbarSearchHost, {
      props: {
        rows: buildNamedRows(),
        searchProps: { shouldFilterRows: true },
      },
    });

    await user.type(screen.getByRole("searchbox"), "load balancer 1");
    expect(getBodyRows()).toHaveLength(1);

    await rerender({ rows: buildNamedRows() });
    expect(getBodyRows()).toHaveLength(1);
  });
});

describe("DataTable new-but-equal headers", () => {
  const buildRows = () => [
    {
      id: "a",
      name: "Load Balancer 3",
      protocol: "HTTP",
      port: 3000,
      rule: "Round robin",
    },
    {
      id: "b",
      name: "Load Balancer 1",
      protocol: "HTTP",
      port: 443,
      rule: "Round robin",
    },
    {
      id: "c",
      name: "Load Balancer 2",
      protocol: "HTTP",
      port: 80,
      rule: "DNS delegation",
    },
  ];

  const buildHeaders = (
    sortFn: ReturnType<typeof createSortFn>,
    portHidden = false,
  ) => [
    { key: "name", value: "Name", sort: sortFn },
    { key: "protocol", value: "Protocol" },
    { key: "port", value: "Port", columnHidden: portHidden },
    { key: "rule", value: "Rule" },
  ];

  it("does not re-sort for a new-but-equal headers array, and re-sorts for a different one", async () => {
    const sortFn = createSortFn();
    const { rerender } = render(DataTable, {
      props: {
        headers: buildHeaders(sortFn),
        rows: buildRows(),
        sortable: true,
        sortKey: "name",
        sortDirection: "ascending",
      },
    });

    sortFn.mockClear();
    const bodyRows = getBodyRows();
    await rerender({ headers: buildHeaders(sortFn) });
    await rerender({ headers: buildHeaders(sortFn) });
    expect(sortFn).not.toHaveBeenCalled();
    expect(getBodyRows()).toEqual(bodyRows);

    await rerender({
      headers: [
        { key: "name", value: "Name", sort: sortFn },
        { key: "protocol", value: "Protocol" },
        { key: "port", value: "Port" },
        { key: "rule", value: "Rule" },
        { key: "extra", value: "Extra" },
      ],
    });
    expect(sortFn).toHaveBeenCalled();
  });

  it("re-sorts when the header sort function is a new reference", async () => {
    const sortFnA = createSortFn();
    const { rerender } = render(DataTable, {
      props: {
        headers: buildHeaders(sortFnA),
        rows: buildRows(),
        sortable: true,
        sortKey: "name",
        sortDirection: "ascending",
      },
    });

    const sortFnB = createSortFn();
    sortFnB.mockClear();
    await rerender({ headers: buildHeaders(sortFnB) });
    expect(sortFnB).toHaveBeenCalled();
  });

  it("still hides the column when columnHidden is toggled in place on the same headers array", async () => {
    const sortFn = createSortFn();
    const headers = buildHeaders(sortFn, false);
    const { rerender } = render(DataTable, {
      props: {
        headers,
        rows: buildRows(),
      },
    });

    expect(getColumnHeaderText()).toEqual(["Name", "Protocol", "Port", "Rule"]);

    headers[2].columnHidden = true;
    await rerender({ headers });
    expect(getColumnHeaderText()).toEqual(["Name", "Protocol", "Rule"]);

    expect(getRowTexts(getBodyRows()[0])).toEqual([
      "Load Balancer 3",
      "HTTP",
      "Round robin",
    ]);
  });
});

describe("DataTable tableCellsByRowId caching", () => {
  const headers = [{ key: "name", value: "Name" }] as const;
  const lastClickedCell = (onevent: ReturnType<typeof vi.fn>) =>
    (
      eventDetails(onevent, "click:cell").at(-1) as
        { cell: unknown } | undefined
    )?.cell;

  it("reuses cell objects when rows is a new array but row references are unchanged", async () => {
    const row = { id: "a", name: "Alpha" };
    const onevent = vi.fn();

    const { rerender } = render(DataTable, {
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

    const { rerender } = render(DataTable, {
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

    const { rerender } = render(DataTable, {
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

    const { rerender } = render(DataTable, {
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
    render(DataTableComponent, { props: { sortable: true, headers, rows } });
    calls = 0;

    await user.click(screen.getByRole("button", { name: /Name/ }));
    expect(getColumnTexts(0)).toEqual(["Alpha", "Bravo", "Charlie"]);
    await user.click(screen.getByRole("button", { name: /Name/ }));
    expect(getColumnTexts(0)).toEqual(["Charlie", "Bravo", "Alpha"]);

    // Svelte 3/4 re-run each block bodies whenever the list changes.
    if (isSvelte5) expect(calls).toBe(0);
  });
});
