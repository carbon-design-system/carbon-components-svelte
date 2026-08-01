import { render, screen, within } from "@testing-library/svelte";
import { user } from "../utils/user";
import DataTableColumnFiltersPreventDefault from "./DataTableColumnFilters.preventDefault.test.svelte";
import DataTableColumnFilters from "./DataTableColumnFilters.test.svelte";

describe("DataTable column filters", () => {
  const getBodyRows = () =>
    screen.getAllByRole("row").filter((row) => row.closest("tbody") !== null);
  const getRowNames = () =>
    getBodyRows().map((row) => within(row).getAllByRole("cell")[0].textContent);
  const filteredRowIds = () =>
    screen.getByTestId("filtered-row-ids").textContent;

  it("narrows the rendered rows and restores them when the filter clears", async () => {
    const { rerender } = render(DataTableColumnFilters, {
      props: { filters: { protocol: "FTP" } },
    });

    expect(getRowNames()).toEqual(["Mango"]);

    await rerender({ filters: {} });

    expect(getRowNames()).toEqual(["Zebra", "Alpha", "Mango", "Bravo"]);
  });

  it("combines two active filters with AND", async () => {
    const { rerender } = render(DataTableColumnFilters, {
      props: { filters: { protocol: "HTTP" } },
    });

    expect(getRowNames()).toEqual(["Zebra", "Alpha", "Bravo"]);

    await rerender({ filters: { protocol: "HTTP", status: "disabled" } });

    expect(getRowNames()).toEqual(["Bravo"]);
  });

  it("combines a column filter with the toolbar search using AND", async () => {
    const { rerender } = render(DataTableColumnFilters, {
      props: { search: true, filters: { protocol: "HTTP" } },
    });

    await user.type(screen.getByRole("searchbox"), "zebra");
    expect(getRowNames()).toEqual(["Zebra"]);

    await rerender({ filters: { protocol: "FTP" } });
    expect(getBodyRows()).toHaveLength(0);
  });

  it("matches a substring for a string filter value", () => {
    render(DataTableColumnFilters, {
      props: { filters: { status: "active" } },
    });

    // "inactive" contains "active", so the default predicate matches it.
    expect(getRowNames()).toEqual(["Zebra", "Alpha", "Mango"]);
  });

  it("uses header.filter in place of the default predicate", () => {
    render(DataTableColumnFilters, {
      props: { exactStatus: true, filters: { status: "active" } },
    });

    expect(getRowNames()).toEqual(["Zebra", "Mango"]);
  });

  it("treats an empty string, null, and an empty array as inactive", async () => {
    const { rerender } = render(DataTableColumnFilters, {
      props: { filters: { protocol: "" } },
    });

    expect(getBodyRows()).toHaveLength(4);

    await rerender({ filters: { protocol: null } });
    expect(getBodyRows()).toHaveLength(4);

    await rerender({ filters: { protocol: [] } });
    expect(getBodyRows()).toHaveLength(4);

    await rerender({ filters: { protocol: ["FTP"] } });
    expect(getRowNames()).toEqual(["Mango"]);
  });

  it("reports the combined result in filteredRowIds and keeps it in sync with rows", async () => {
    render(DataTableColumnFilters, {
      props: { search: true, filters: { status: "active" } },
    });

    expect(filteredRowIds()).toBe("a,b,c");

    await user.type(screen.getByRole("searchbox"), "mango");
    expect(filteredRowIds()).toBe("c");

    await user.clear(screen.getByRole("searchbox"));
    await user.click(screen.getByRole("button", { name: "Toggle rows" }));
    expect(filteredRowIds()).toBe("e,f");
  });

  it("applies a filter set through a control bound into filters", async () => {
    render(DataTableColumnFilters, {
      props: { showControls: true, filters: { protocol: "" } },
    });

    expect(getBodyRows()).toHaveLength(4);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Protocol filter" }),
      "FTP",
    );

    expect(getRowNames()).toEqual(["Mango"]);
  });

  it("sorts only the matching rows", async () => {
    render(DataTableColumnFilters, {
      props: { sortable: true, filters: { protocol: "HTTP" } },
    });

    await user.click(screen.getByText("Name"));

    expect(getRowNames()).toEqual(["Alpha", "Bravo", "Zebra"]);
  });

  describe('filterMode="hide"', () => {
    it("keeps non-matching rows mounted with the hidden attribute", async () => {
      const { rerender } = render(DataTableColumnFilters, {
        props: { filterMode: "hide" },
      });

      await rerender({ filters: { protocol: "FTP" } });

      expect(document.querySelector('[data-row="a"]')).toHaveAttribute(
        "hidden",
      );
      expect(document.querySelector('[data-row="c"]')).not.toHaveAttribute(
        "hidden",
      );
    });

    it('"select all" selects only matching rows', async () => {
      const { rerender } = render(DataTableColumnFilters, {
        props: { filterMode: "hide", batchSelection: true },
      });

      await rerender({ filters: { protocol: "FTP" } });
      await user.click(
        screen.getByRole("checkbox", { name: "Select all rows" }),
      );

      expect(screen.getByTestId("selected-count")).toHaveTextContent("1");
    });
  });

  describe("preventDefault", () => {
    it("skips client-side filtering but still reports key, value, and filters", async () => {
      const onfilter = vi.fn();
      const { rerender } = render(DataTableColumnFiltersPreventDefault, {
        props: { preventFilterDefault: true, onfilter },
      });

      await rerender({ filters: { protocol: "FTP" } });

      expect(onfilter).toHaveBeenCalledTimes(1);
      expect(onfilter.mock.calls[0][0].detail).toEqual({
        key: "protocol",
        value: "FTP",
        filters: { protocol: "FTP" },
      });
      expect(getBodyRows()).toHaveLength(2);
    });

    it("filters client-side when the event is not cancelled", async () => {
      const onfilter = vi.fn();
      const { rerender } = render(DataTableColumnFiltersPreventDefault, {
        props: { onfilter },
      });

      await rerender({ filters: { protocol: "FTP" } });

      expect(onfilter).toHaveBeenCalledTimes(1);
      expect(getBodyRows()).toHaveLength(1);
    });

    it("reports a null key when more than one entry changes at once", async () => {
      const onfilter = vi.fn();
      const { rerender } = render(DataTableColumnFiltersPreventDefault, {
        props: { onfilter },
      });

      await rerender({ filters: { protocol: "FTP", name: "Alpha" } });

      expect(onfilter.mock.calls[0][0].detail).toEqual({
        key: null,
        value: null,
        filters: { protocol: "FTP", name: "Alpha" },
      });
    });
  });
});
