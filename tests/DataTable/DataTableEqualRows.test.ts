import { render, screen } from "@testing-library/svelte";
import type { DataTableValue } from "carbon-components-svelte/DataTable/DataTable.svelte";
import { user } from "../utils/user";
import DataTable from "./DataTable.test.svelte";
import DataTableActiveSearchEqualRows from "./DataTableActiveSearchEqualRows.test.svelte";

describe("DataTable new-but-equal rows", () => {
  const createSortFn = () =>
    vi.fn((a: DataTableValue, b: DataTableValue) =>
      a < b ? -1 : a > b ? 1 : 0,
    );

  const buildHeaders = (sortFn: ReturnType<typeof createSortFn>) => [
    { key: "name", value: "Name", sort: sortFn },
    { key: "port", value: "Port" },
  ];

  const buildRows = () => [
    { id: "a", name: "Load Balancer 3", port: 3000 },
    { id: "b", name: "Load Balancer 1", port: 443 },
    { id: "c", name: "Load Balancer 2", port: 80 },
  ];

  const getBodyRows = () =>
    screen.getAllByRole("row").filter((row) => row.closest("tbody") !== null);

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
    const { rerender } = render(DataTableActiveSearchEqualRows, {
      props: { rows: buildNamedRows() },
    });

    await user.type(screen.getByRole("searchbox"), "load balancer 1");
    expect(getBodyRows()).toHaveLength(1);

    await rerender({ rows: buildNamedRows() });
    expect(getBodyRows()).toHaveLength(1);
  });
});
