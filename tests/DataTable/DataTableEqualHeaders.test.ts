import { render, screen, within } from "@testing-library/svelte";
import DataTable from "./DataTable.test.svelte";

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

  const createSortFn = () =>
    vi.fn((a: any, b: any) => (a < b ? -1 : a > b ? 1 : 0));

  const buildHeaders = (
    sortFn: ReturnType<typeof createSortFn>,
    portHidden = false,
  ) => [
    { key: "name", value: "Name", sort: sortFn },
    { key: "protocol", value: "Protocol" },
    { key: "port", value: "Port", columnHidden: portHidden },
    { key: "rule", value: "Rule" },
  ];

  const getColumnHeaderText = () =>
    screen
      .getAllByRole("columnheader")
      .map((columnHeader) => columnHeader.textContent?.trim());

  const getBodyRows = () =>
    screen.getAllByRole("row").filter((row) => row.closest("tbody") !== null);

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

    const bodyRow = getBodyRows()[0];
    expect(
      within(bodyRow)
        .getAllByRole("cell")
        .map((cell) => cell.textContent?.trim()),
    ).toEqual(["Load Balancer 3", "HTTP", "Round robin"]);
  });
});
