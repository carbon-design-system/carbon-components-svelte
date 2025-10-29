import { render, screen } from "@testing-library/svelte";
import type { ComponentProps } from "svelte";
import { user } from "../setup-tests";
import DataTableSearch from "./DataTableSearch.test.svelte";

describe("DataTableSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Remove first row since it's the header
  const getTableRows = () => screen.getAllByRole("row").slice(1);
  const getNextPageButton = () =>
    screen.getByRole("button", { name: "Next page" });
  const getPrevPageButton = () =>
    screen.getByRole("button", { name: "Previous page" });
  const allRowsRendered = () => {
    const tableRows = getTableRows();
    expect(tableRows).toHaveLength(5);
    tableRows.forEach((row) => {
      expect(row).toHaveTextContent(/Round robin|DNS delegation/);
    });

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
    tableRows.forEach((row) => {
      expect(row).toHaveTextContent("DNS");
    });

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
    tableRows.forEach((row) => {
      expect(row).toHaveTextContent("DNS");
    });

    await user.keyboard("{Tab}{Enter}");
    expect(searchInput).toHaveValue("");
    expect(searchInput).toHaveFocus();
    allRowsRendered();
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

    // Search bar should be active.
    const searchBar = screen.getByRole("search");
    expect(searchBar).toHaveClass("bx--toolbar-search-container-active");

    expect(screen.getByText("1–5 of 5 items")).toBeInTheDocument();
    expect(screen.getByText("of 1 page")).toBeInTheDocument();
    expect(getNextPageButton()).toBeDisabled();
    expect(getPrevPageButton()).toBeDisabled();

    let tableRows = getTableRows();
    expect(tableRows).toHaveLength(5);
    tableRows.forEach((row) => {
      expect(row).toHaveTextContent("Round");
    });

    await user.click(
      screen.getByRole("button", { name: "Clear search input" }),
    );
    expect(searchInput).toHaveValue("");
    expect(searchInput).toHaveFocus();
    allRowsRendered();

    await user.type(searchInput, "rr");

    tableRows = getTableRows();
    expect(tableRows).toHaveLength(0);

    expect(screen.getByText("0–0 of 0 items")).toBeInTheDocument();
    expect(screen.getByText("of 1 page")).toBeInTheDocument();
    expect(getNextPageButton()).toBeDisabled();
    expect(getPrevPageButton()).toBeDisabled();

    await user.keyboard("{Escape}");
    expect(searchInput).toHaveValue("");
    expect(searchInput).toHaveFocus();
    allRowsRendered();

    await user.keyboard("{Tab}");
    expect(searchBar).not.toHaveClass("bx--toolbar-search-container-active");
  });

  it("can filter with a custom filter function", async () => {
    const props = {
      shouldFilterRows: (row: any, value: any) => {
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
    tableRows.forEach((row) => {
      expect(row).toHaveTextContent("Round");
      expect(row).toHaveTextContent(/Load Balancer 6|Load Balancer 8/);
    });
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
    tableRows.forEach((row) => {
      expect(row).toHaveTextContent("Round!");
    });

    await user.click(toggleButton);
    expect(searchInput).toHaveValue("round");
    expect(searchInput).not.toHaveFocus();
    expect(screen.getByText("1–5 of 5 items")).toBeInTheDocument();
    expect(screen.getByText("of 1 page")).toBeInTheDocument();
    expect(getNextPageButton()).toBeDisabled();
    expect(getPrevPageButton()).toBeDisabled();

    await user.click(
      screen.getByRole("button", { name: "Clear search input" }),
    );
    expect(searchInput).toHaveValue("");
    expect(searchInput).toHaveFocus();
    allRowsRendered();
  });
});
