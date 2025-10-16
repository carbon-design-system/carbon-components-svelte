import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import DataTableSearchNested from "./DataTableSearchNested.test.svelte";

describe("DataTableSearch with nested keys", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const getTableRows = () => screen.getAllByRole("row").slice(1);

  it("filters rows by nested property values", async () => {
    render(DataTableSearchNested);

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
    render(DataTableSearchNested);

    const searchInput = screen.getByRole("searchbox");

    await user.type(searchInput, "1");
    expect(searchInput).toHaveValue("1");

    const tableRows = getTableRows();
    expect(tableRows).toHaveLength(1);
    expect(tableRows[0]).toHaveTextContent("1");
    expect(tableRows[0]).toHaveTextContent("Super Wheels");
  });

  it("returns no results when search does not match", async () => {
    render(DataTableSearchNested);

    const searchInput = screen.getByRole("searchbox");

    await user.type(searchInput, "nonexistent");
    expect(searchInput).toHaveValue("nonexistent");

    const tableRows = getTableRows();
    expect(tableRows).toHaveLength(0);
  });
});
