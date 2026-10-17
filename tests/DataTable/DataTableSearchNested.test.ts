import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import { getTableRows } from "./helpers";
import ToolbarSearchHost from "./ToolbarSearchHost.test.svelte";

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
