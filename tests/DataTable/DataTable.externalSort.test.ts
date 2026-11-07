import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import DataTableExternalSort from "./DataTableExternalSort.test.svelte";
import { clickHeader, getColumnTexts } from "./helpers";

describe("DataTable externalSort", () => {
  const serverOrder = ["Banana", "apple", "Cherry"];
  const rows = [
    { id: "a", name: "Banana", port: 3 },
    { id: "b", name: "apple", port: 1 },
    { id: "c", name: "Cherry", port: 2 },
  ];

  const renderTable = (props = {}) => {
    const compare = (a: unknown, b: unknown) =>
      String(a).localeCompare(String(b));
    const sortSpy = vi.fn(compare);
    const headerSortSpy = vi.fn(compare);
    const result = render(DataTableExternalSort, {
      props: { sortSpy, headerSortSpy, ...props },
    });
    return { ...result, sortSpy, headerSortSpy };
  };

  it("renders rows in the given order while sortKey is set", () => {
    renderTable({ sortKey: "name", sortDirection: "ascending" });

    expect(getColumnTexts(0)).toEqual(serverOrder);
    expect(screen.getByRole("columnheader", { name: /Name/ })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
  });

  it("re-sorts client side when externalSort is off", () => {
    renderTable({
      externalSort: false,
      sortKey: "port",
      sortDirection: "ascending",
      sortSpy: (a: number, b: number) => a - b,
    });

    expect(getColumnTexts(1)).toEqual(["1", "2", "3"]);
  });

  it("never calls the comparators on mount, click or a rows update", async () => {
    const { rerender, sortSpy, headerSortSpy } = renderTable();

    await clickHeader("Name");
    await clickHeader("Port");
    await rerender({ rows: [...rows].reverse() });

    expect(sortSpy).not.toHaveBeenCalled();
    expect(headerSortSpy).not.toHaveBeenCalled();
    expect(getColumnTexts(0)).toEqual([...serverOrder].reverse());
  });

  it("still updates the header and dispatches sort on click", async () => {
    const onsort = vi.fn();
    renderTable({ onsort });

    await clickHeader("Name");

    expect(onsort.mock.calls[0][0].detail).toEqual({
      key: "name",
      direction: "ascending",
    });
    expect(screen.getByRole("columnheader", { name: /Name/ })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    expect(getColumnTexts(0)).toEqual(serverOrder);
  });

  it("keeps the given order with selection, batch selection and paging", async () => {
    renderTable({
      selectable: true,
      batchSelection: true,
      pageSize: 2,
      sortKey: "name",
      sortDirection: "descending",
    });

    expect(getColumnTexts(1)).toEqual(["Banana", "apple"]);

    await user.click(screen.getAllByRole("checkbox")[1]);
    expect(screen.getAllByRole("checkbox")[1]).toBeChecked();
    expect(getColumnTexts(1)).toEqual(["Banana", "apple"]);
  });

  it("keeps the given order across a ToolbarSearch filter", async () => {
    renderTable({ search: true, sortKey: "name", sortDirection: "ascending" });

    await user.type(screen.getByRole("searchbox"), "a");

    expect(getColumnTexts(0)).toEqual(["Banana", "apple"]);
  });
});
