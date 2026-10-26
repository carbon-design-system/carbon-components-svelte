import { render, screen } from "@testing-library/svelte";
import type { DataTableRow } from "carbon-components-svelte/DataTable/DataTable.svelte";
import type { ComponentProps } from "svelte";
import { user } from "../utils/user";
import DataTableRefilterOnRowsChange from "./DataTableRefilterOnRowsChange.test.svelte";
import DataTableSearch from "./DataTableSearch.test.svelte";
import ToolbarSearchHost from "./ToolbarSearchHost.test.svelte";
import { getTableRows } from "./helpers";

describe("DataTableSearch", () => {
  const getNextPageButton = () =>
    screen.getByRole("button", { name: "Next page" });
  const getPrevPageButton = () =>
    screen.getByRole("button", { name: "Previous page" });
  const allRowsRendered = () => {
    const tableRows = getTableRows();
    expect(tableRows).toHaveLength(5);
    for (const row of tableRows) {
      expect(row).toHaveTextContent(/Round robin|DNS delegation/);
    }

    expect(screen.getByText("1–5 of 10 items")).toBeInTheDocument();
    expect(screen.getByText("of 2 pages")).toBeInTheDocument();
    expect(getNextPageButton()).toBeEnabled();
    expect(getPrevPageButton()).toBeDisabled();
  };

  it("renders non-persistent search input", async () => {
    render(DataTableSearch);

    const searchBar = screen.getByRole("search");
    expect(searchBar).not.toHaveClass(
      "bx--toolbar-search-container-persistent",
    );
    expect(searchBar).not.toHaveClass("bx--toolbar-search-container-active");

    const searchInput = screen.getByRole("searchbox");
    expect(searchInput).toHaveValue("");
    expect(searchInput).not.toHaveFocus();
    allRowsRendered();

    await user.type(searchInput, "dns");
    expect(searchInput).toHaveValue("dns");
    expect(searchInput).toHaveFocus();
    expect(searchBar).toHaveClass("bx--toolbar-search-container-active");
    expect(screen.getByText("1–5 of 5 items")).toBeInTheDocument();
    expect(screen.getByText("of 1 page")).toBeInTheDocument();
    expect(getNextPageButton()).toBeDisabled();
    expect(getPrevPageButton()).toBeDisabled();

    const tableRows = getTableRows();
    expect(tableRows).toHaveLength(5);
    for (const row of tableRows) {
      expect(row).toHaveTextContent("DNS");
    }

    await user.keyboard("{Tab}{Enter}");
    expect(searchInput).toHaveValue("");
    expect(searchInput).toHaveFocus();
    allRowsRendered();

    await user.keyboard("{Tab}");
    expect(searchBar).not.toHaveClass("bx--toolbar-search-container-active");
  });

  it("renders persistent search input", async () => {
    render(DataTableSearch, {
      props: {
        persistent: true,
      } satisfies ComponentProps<DataTableSearch>,
    });

    const searchBar = screen.getByRole("search");
    expect(searchBar).toHaveClass("bx--toolbar-search-container-persistent");

    const searchInput = screen.getByRole("searchbox");
    expect(searchInput).toHaveValue("");
    expect(searchInput).not.toHaveFocus();
    allRowsRendered();

    await user.type(searchInput, "dns");
    expect(searchInput).toHaveValue("dns");
    expect(searchInput).toHaveFocus();
    expect(screen.getByText("1–5 of 5 items")).toBeInTheDocument();
    expect(screen.getByText("of 1 page")).toBeInTheDocument();
    expect(getNextPageButton()).toBeDisabled();
    expect(getPrevPageButton()).toBeDisabled();

    const tableRows = getTableRows();
    expect(tableRows).toHaveLength(5);
    for (const row of tableRows) {
      expect(row).toHaveTextContent("DNS");
    }
  });

  it("persistent search bar does not toggle the active class when typing", async () => {
    render(DataTableSearch, {
      props: {
        persistent: true,
      } satisfies ComponentProps<DataTableSearch>,
    });

    const searchBar = screen.getByRole("search");
    expect(searchBar).toHaveClass("bx--toolbar-search-container-persistent");
    expect(searchBar).not.toHaveClass("bx--toolbar-search-container-active");

    const searchInput = screen.getByRole("searchbox");
    await user.type(searchInput, "dns");

    // Persistent search should remain persistent only; the "active" class
    // (meant for expandable mode) should not coexist with "persistent".
    expect(searchBar).toHaveClass("bx--toolbar-search-container-persistent");
    expect(searchBar).not.toHaveClass("bx--toolbar-search-container-active");
  });

  it("renders with initial search value in non-persistent search input", async () => {
    render(DataTableSearch, {
      props: {
        value: "round",
      },
    });

    const searchInput = screen.getByRole("searchbox");
    expect(searchInput).toHaveValue("round");
    expect(searchInput).not.toHaveFocus();

    const searchBar = screen.getByRole("search");
    expect(searchBar).toHaveClass("bx--toolbar-search-container-active");

    expect(screen.getByText("1–5 of 5 items")).toBeInTheDocument();
    expect(screen.getByText("of 1 page")).toBeInTheDocument();
    expect(getNextPageButton()).toBeDisabled();
    expect(getPrevPageButton()).toBeDisabled();

    let tableRows = getTableRows();
    expect(tableRows).toHaveLength(5);
    for (const row of tableRows) {
      expect(row).toHaveTextContent("Round");
    }

    await user.type(searchInput, "rr");

    tableRows = getTableRows();
    expect(tableRows).toHaveLength(0);

    expect(screen.getByText("0 items")).toBeInTheDocument();
    expect(screen.getByText("of 1 page")).toBeInTheDocument();
    expect(getNextPageButton()).toBeDisabled();
    expect(getPrevPageButton()).toBeDisabled();
  });

  it("can filter with a custom filter function", async () => {
    const props = {
      shouldFilterRows: (row: DataTableRow, value: string | number) => {
        return (
          /(6|8)$/.test(row.name) &&
          row.rule.toLowerCase().includes(value.toString().toLowerCase())
        );
      },
    } satisfies ComponentProps<DataTableSearch>;

    render(DataTableSearch, { props });

    allRowsRendered();

    const searchInput = screen.getByRole("searchbox");
    await user.type(searchInput, "round");
    expect(searchInput).toHaveValue("round");
    expect(searchInput).toHaveFocus();
    expect(screen.getByText("1–2 of 2 items")).toBeInTheDocument();
    expect(screen.getByText("of 1 page")).toBeInTheDocument();
    expect(getNextPageButton()).toBeDisabled();
    expect(getPrevPageButton()).toBeDisabled();

    const tableRows = getTableRows();
    expect(tableRows).toHaveLength(2);
    for (const row of tableRows) {
      expect(row).toHaveTextContent("Round");
      expect(row).toHaveTextContent(/Load Balancer 6|Load Balancer 8/);
    }
  });

  it("re-filters rows when toggled", async () => {
    render(DataTableSearch);

    allRowsRendered();

    const searchInput = screen.getByRole("searchbox");
    await user.type(searchInput, "round");
    expect(searchInput).toHaveValue("round");
    expect(searchInput).toHaveFocus();
    expect(screen.getByText("1–5 of 5 items")).toBeInTheDocument();
    expect(screen.getByText("of 1 page")).toBeInTheDocument();
    expect(getNextPageButton()).toBeDisabled();
    expect(getPrevPageButton()).toBeDisabled();

    const toggleButton = screen.getByRole("button", { name: "Toggle rows" });
    await user.click(toggleButton);

    expect(searchInput).toHaveValue("round");
    expect(searchInput).not.toHaveFocus();

    expect(screen.getByText("1–2 of 2 items")).toBeInTheDocument();
    expect(screen.getByText("of 1 page")).toBeInTheDocument();
    expect(getNextPageButton()).toBeDisabled();
    expect(getPrevPageButton()).toBeDisabled();

    const tableRows = getTableRows();
    expect(tableRows).toHaveLength(2);
    for (const row of tableRows) {
      expect(row).toHaveTextContent("Round!");
    }

    await user.click(toggleButton);
    expect(searchInput).toHaveValue("round");
    expect(searchInput).not.toHaveFocus();
    expect(screen.getByText("1–5 of 5 items")).toBeInTheDocument();
    expect(screen.getByText("of 1 page")).toBeInTheDocument();
    expect(getNextPageButton()).toBeDisabled();
    expect(getPrevPageButton()).toBeDisabled();
  });
});

describe("DataTableSearch with nested keys", () => {
  const props = {
    headers: [
      { key: "id", value: "ID" },
      { key: "contact.company", value: "Company name" },
    ],
    rows: [
      { id: "1", contact: { company: "Super Wheels" } },
      { id: "2", contact: { company: "Mini Wheels" } },
      { id: "3", contact: { company: "Mega Corp" } },
    ],
    searchProps: { persistent: true, shouldFilterRows: true },
  };

  it("filters rows by nested property values", async () => {
    render(ToolbarSearchHost, { props });

    const searchInput = screen.getByRole("searchbox");
    expect(searchInput).toHaveValue("");

    let tableRows = getTableRows();
    expect(tableRows).toHaveLength(3);

    await user.type(searchInput, "super");
    expect(searchInput).toHaveValue("super");

    tableRows = getTableRows();
    expect(tableRows).toHaveLength(1);
    expect(tableRows[0]).toHaveTextContent("Super Wheels");
    expect(tableRows[0]).toHaveTextContent("1");

    await user.clear(searchInput);
    await user.type(searchInput, "wheels");
    expect(searchInput).toHaveValue("wheels");

    tableRows = getTableRows();
    expect(tableRows).toHaveLength(2);
    expect(tableRows[0]).toHaveTextContent("Super Wheels");
    expect(tableRows[1]).toHaveTextContent("Mini Wheels");

    await user.clear(searchInput);
    await user.type(searchInput, "mega");
    expect(searchInput).toHaveValue("mega");

    tableRows = getTableRows();
    expect(tableRows).toHaveLength(1);
    expect(tableRows[0]).toHaveTextContent("Mega Corp");

    await user.clear(searchInput);
    expect(searchInput).toHaveValue("");

    tableRows = getTableRows();
    expect(tableRows).toHaveLength(3);
  });

  it("can still search by non-nested id field", async () => {
    render(ToolbarSearchHost, { props });

    const searchInput = screen.getByRole("searchbox");

    await user.type(searchInput, "1");
    expect(searchInput).toHaveValue("1");

    const tableRows = getTableRows();
    expect(tableRows).toHaveLength(1);
    expect(tableRows[0]).toHaveTextContent("1");
    expect(tableRows[0]).toHaveTextContent("Super Wheels");
  });
});

describe("DataTable re-filters when rows change", () => {
  it("preserves an active filter when the rows prop is reassigned", async () => {
    render(DataTableRefilterOnRowsChange);

    // Initial filter ("round") was applied on mount via the context's
    // filterRows. Five of the ten initial rows match "Round robin".
    let tableRows = getTableRows();
    expect(tableRows).toHaveLength(5);
    for (const row of tableRows) {
      expect(row).toHaveTextContent("Round robin");
    }

    // Reassign `rows` to a new set. The filter ("round") should still apply
    // and only match rows containing "Round!" — two of the four new rows.
    await user.click(screen.getByRole("button", { name: "Toggle rows" }));

    tableRows = getTableRows();
    expect(tableRows).toHaveLength(2);
    for (const row of tableRows) {
      expect(row).toHaveTextContent("Round!");
    }
  });
});
